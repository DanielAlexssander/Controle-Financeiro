#!/usr/bin/env bun
// Teste de fumaça do canal SEM o Claude (não gasta uso): faz o papel do Claude Code.
//   bun mcp/financas-channel/scripts/smoke.ts      (rodar da raiz, com o `npm run ia` FECHADO)
// Sobe o server.ts por stdio, confere o handshake MCP, manda uma pergunta pelo WebSocket,
// confere a notificação de canal e simula os hooks MessageDisplay/Stop.
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { DEFAULT_BRIDGE_PORT, type ServerMessage } from '../../../src/services/ai/chatProtocol.ts'
import { loadOrCreateToken } from '../src/auth'
import { TOKEN_DIR } from '../src/config'

const BASE = `127.0.0.1:${DEFAULT_BRIDGE_PORT}`
const token = loadOrCreateToken(TOKEN_DIR)

if (await fetch(`http://${BASE}/nada`).then(() => true, () => false)) {
  console.error('A porta 8790 está em uso (sessão do financas aberta?). Feche-a e rode o smoke de novo.')
  process.exit(1)
}

const check = (ok: unknown, msg: string) => {
  if (!ok) throw new Error(`FALHOU: ${msg}`)
  console.log(`ok - ${msg}`)
}

const waitFor = async <T>(fn: () => T | undefined, what: string, ms = 5000): Promise<T> => {
  const fim = Date.now() + ms
  while (Date.now() < fim) {
    const v = fn()
    if (v !== undefined) return v
    await Bun.sleep(50)
  }
  throw new Error(`FALHOU: tempo esgotado esperando ${what}`)
}

const openWs = async (): Promise<{ ws: WebSocket; recebidas: ServerMessage[] }> => {
  for (let i = 0; i < 40; i++) {
    const r = await new Promise<{ ws: WebSocket; recebidas: ServerMessage[] } | null>((resolve) => {
      const ws = new WebSocket(`ws://${BASE}/chat?token=${token}`, {
        headers: { Origin: 'http://localhost:5173' },
      } as unknown as string[])
      const recebidas: ServerMessage[] = []
      ws.addEventListener('message', (ev) => recebidas.push(JSON.parse(String(ev.data))))
      ws.addEventListener('open', () => resolve({ ws, recebidas }))
      ws.addEventListener('error', () => resolve(null))
    })
    if (r) return r
    await Bun.sleep(100)
  }
  throw new Error('FALHOU: WebSocket do canal não abriu')
}

const hook = (rota: string, body: object) =>
  fetch(`http://${BASE}/hooks/${rota}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })

const notificacoes: { method: string; params?: Record<string, unknown> }[] = []
const client = new Client({ name: 'smoke', version: '0.0.0' })
client.fallbackNotificationHandler = async (n) => { notificacoes.push(n as (typeof notificacoes)[number]) }

const envBase = Object.fromEntries(
  Object.entries(process.env).filter(([k, v]) => v !== undefined && k !== 'FINANCAS_CANAL'),
) as Record<string, string>
const transporte = (canal: boolean) =>
  new StdioClientTransport({
    command: 'bun',
    args: ['mcp/financas-channel/src/server.ts'],
    env: canal
      ? { ...envBase, FINANCAS_CANAL: '1', FINANCAS_SESSAO_MODELO: 'sonnet', FINANCAS_SESSAO_ESFORCO: 'medium' }
      : envBase,
  })

// 1) Sessão comum do Claude (MCP global): tem que ficar inerte.
const inerte = new Client({ name: 'smoke-inerte', version: '0.0.0' })
await inerte.connect(transporte(false))
check(inerte.getInstructions() === undefined, 'sessão comum: MCP conecta sem instruções')
check(!inerte.getServerCapabilities()?.experimental, 'sessão comum: sem capacidade de canal')
check(!(await fetch(`http://${BASE}/nada`).then(() => true, () => false)), 'sessão comum: porta 8790 fechada')
await inerte.close()

// 2) Sessão aberta pelo `financas`: canal completo.
await client.connect(transporte(true))
try {
  check(client.getServerCapabilities()?.experimental?.['claude/channel'], 'servidor declara claude/channel')
  check(client.getInstructions()?.includes('source="financas"'), 'instructions presentes')

  const { ws, recebidas } = await openWs()
  await waitFor(() => recebidas.find((m) => m.type === 'status'), 'status inicial')
  const sessao = await waitFor(() => recebidas.find((m) => m.type === 'sessao'), 'sessão')
  check(sessao.type === 'sessao' && sessao.sessao.modelo === 'sonnet', 'site recebe o modelo da sessão aberta')
  ws.send(JSON.stringify({ type: 'snapshot', data: { totais: { patrimonioBrl: 1 } } }))
  await Bun.sleep(100)
  check(notificacoes.length === 0, 'snapshot sozinho não gera notificação (uso parado = zero)')

  ws.send(JSON.stringify({ type: 'pergunta', ia: 'claude', texto: 'teste' }))
  const n = await waitFor(() => notificacoes[0], 'notificação de canal')
  check(n.method === 'notifications/claude/channel', 'pergunta vira notifications/claude/channel')
  const content = String(n.params?.content)
  check(content.includes('<dados_financeiros>') && content.endsWith('Pergunta: teste'), 'conteúdo leva dados + pergunta')

  check((await hook('display', { delta: 'linha 1\n', final: false })).status === 200, 'hook display aceito')
  await waitFor(() => recebidas.find((m) => m.type === 'parcial'), 'parcial no site')
  check((await hook('stop', { last_assistant_message: 'resposta final' })).status === 200, 'hook stop aceito')
  const fim = await waitFor(() => recebidas.find((m) => m.type === 'final'), 'final no site')
  check(fim.type === 'final' && fim.texto === 'resposta final', 'site recebe a resposta final')
  ws.close()
  console.log('\nSMOKE OK')
} finally {
  await client.close()
}
