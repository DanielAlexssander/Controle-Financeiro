#!/usr/bin/env bun
// MCP "financas": canal (channel) do Claude Code que liga o chat do site à sessão.
// stdout é o transporte MCP: nunca usar console.log aqui (logs só em console.error).
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  DEFAULT_BRIDGE_PORT,
  type ClientMessage,
  type Preferencias,
  type ServerMessage,
  type Sessao,
} from '../../../src/services/ai/chatProtocol.ts'
import { loadOrCreateToken } from './auth'
import { startBridge } from './bridge'
import { buildChannelContent } from './channelContent'
import { ALLOWED_ORIGINS, RESPOSTA_TIMEOUT_MS, TOKEN_DIR, deveAbrirCanal } from './config'
import { IDLE, step, type ConversationEvent } from './conversation'
import type { HookEvent } from './hookPayload'
import { salvarPreferencias } from './preferencias'
import { EMPTY_SNAPSHOT, setSnapshot, takeIfChanged } from './snapshotStore'

/** O launcher informa com que modelo/esforço iniciou a sessão (FINANCAS_SESSAO_*). */
export const sessaoDoAmbiente = (env: Readonly<Record<string, string | undefined>>): Sessao | null =>
  env.FINANCAS_SESSAO_MODELO && env.FINANCAS_SESSAO_ESFORCO
    ? { modelo: env.FINANCAS_SESSAO_MODELO, esforco: env.FINANCAS_SESSAO_ESFORCO }
    : null

export const INSTRUCTIONS =
  'Mensagens do chat do site Controle Financeiro chegam como <channel source="financas">. ' +
  'Responda diretamente em texto, em português do Brasil, como numa conversa no terminal; ' +
  'não existe ferramenta de resposta. Use somente os dados de <dados_financeiros> ' +
  '(vale o envio mais recente). Se ainda não houver dados, diga isso. ' +
  'Valores em BRL salvo indicação. Ao sugerir algo, deixe claro que não é recomendação de investimento.'

export type WiringDeps = {
  notify(content: string): Promise<void>
  send(msg: ServerMessage): void
  timeoutMs: number
  salvarPreferencias(prefs: Preferencias): void
  /** Modelo/esforço com que esta sessão foi iniciada (null se desconhecido). */
  sessao: Sessao | null
}

export type Wiring = {
  onConnect(): void
  onClientMessage(msg: ClientMessage): void
  onHook(ev: HookEvent): void
}

/** Liga site ↔ conversa ↔ sessão do Claude. Só uma pergunta aceita gera notificação. */
export const createWiring = (deps: WiringDeps): Wiring => {
  let conversa = IDLE
  let snapshot = EMPTY_SNAPSHOT
  let timer: ReturnType<typeof setTimeout> | null = null

  const limparTimer = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  const aplicar = (ev: ConversationEvent) => {
    const r = step(conversa, ev)
    conversa = r.state
    if (!conversa.emAndamento) limparTimer()
    r.saida.forEach((m) => deps.send(m))
    return r
  }

  const perguntar = (texto: string) => {
    if (!aplicar({ tipo: 'pergunta' }).aceita) return
    const enviadoAntes = snapshot.enviado
    const taken = takeIfChanged(snapshot)
    snapshot = taken.state
    timer = setTimeout(() => aplicar({ tipo: 'timeout' }), deps.timeoutMs)
    deps.notify(buildChannelContent(texto, taken.json)).catch((err: unknown) => {
      console.error('[financas] falha ao enviar a pergunta para a sessão:', err)
      snapshot = { ...snapshot, enviado: enviadoAntes }
      aplicar({ tipo: 'falha', erro: 'unknown' })
    })
  }

  return {
    onConnect: () => {
      deps.send({ type: 'status', estado: conversa.emAndamento ? 'ocupado' : 'pronto' })
      if (deps.sessao) deps.send({ type: 'sessao', sessao: deps.sessao })
    },
    onClientMessage: (msg) => {
      if (msg.type === 'snapshot') snapshot = setSnapshot(snapshot, msg.data)
      else if (msg.type === 'preferencias') deps.salvarPreferencias(msg.preferencias)
      else perguntar(msg.texto)
    },
    onHook: (ev) => { aplicar(ev) },
  }
}

/** Sessão comum do Claude (MCP global): conecta sem porta, sem canal e sem instruções. */
const mainInerte = async () => {
  const mcp = new Server({ name: 'financas', version: '0.1.0' }, { capabilities: {} })
  await mcp.connect(new StdioServerTransport())
  console.error('[financas] modo inerte: o canal só abre na sessão iniciada pelo comando financas')
}

const main = async () => {
  if (!deveAbrirCanal(process.env)) return mainInerte()
  const mcp = new Server(
    { name: 'financas', version: '0.1.0' },
    { capabilities: { experimental: { 'claude/channel': {} } }, instructions: INSTRUCTIONS },
  )
  await mcp.connect(new StdioServerTransport())

  let send: (msg: ServerMessage) => void = () => {}
  const wiring = createWiring({
    notify: (content) =>
      mcp.notification({ method: 'notifications/claude/channel', params: { content, meta: { origem: 'site' } } }),
    send: (msg) => send(msg),
    timeoutMs: RESPOSTA_TIMEOUT_MS,
    salvarPreferencias: (prefs) => {
      try {
        salvarPreferencias(TOKEN_DIR, prefs)
      } catch (err: unknown) {
        console.error('[financas] não foi possível salvar as preferências:', err)
      }
    },
    sessao: sessaoDoAmbiente(process.env),
  })
  const bridge = startBridge({
    port: DEFAULT_BRIDGE_PORT,
    token: loadOrCreateToken(TOKEN_DIR),
    allowedOrigins: ALLOWED_ORIGINS,
    ...wiring,
  })
  send = bridge.send
  console.error(`[financas] canal pronto em 127.0.0.1:${bridge.port}`)
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error('[financas] erro fatal ao iniciar o canal:', err)
    process.exit(1)
  })
}
