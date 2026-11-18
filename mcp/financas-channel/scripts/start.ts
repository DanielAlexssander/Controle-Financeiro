#!/usr/bin/env bun
// `financas [local|ajuda]` (global, via npm link) e `npm run ia`:
// abre o site e a sessão interativa do Claude Code com o canal "financas".
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Subprocess } from 'bun'
import {
  PREFERENCIAS_PADRAO,
  type Preferencias,
  type Sessao,
} from '../../../src/services/ai/chatProtocol.ts'
import { loadOrCreateToken } from '../src/auth'
import { TOKEN_DIR } from '../src/config'
import { lerPreferencias } from '../src/preferencias'

const BASE = 'mcp/financas-channel'
const DEV_PORT = 5173
const ESPERA_SITE_MS = 60_000

// Caminho real do script: o atalho do npm link passa por uma junção em node_modules.
export const REPO_ROOT = resolve(dirname(realpathSync(fileURLToPath(import.meta.url))), '..', '..', '..')

export type Modo = 'pages' | 'local' | 'ajuda'

export const URLS: Readonly<Record<'pages' | 'local', string>> = {
  pages: 'https://danielalexssander.github.io/Controle-Financeiro/',
  local: 'http://localhost:5173/Controle-Financeiro/',
}

const USO = [
  'Uso: financas [local|ajuda]',
  '  financas         abre o site do GitHub Pages e a sessão do Claude com o canal',
  '  financas local   sobe o site local (se preciso), abre o localhost e a sessão',
  '  financas ajuda   mostra esta ajuda',
].join('\n')

export const parseModo = (args: readonly string[]): Modo | null => {
  if (args.length === 0) return 'pages'
  if (args.length > 1) return null
  if (args[0] === 'local') return 'local'
  if (args[0] === 'ajuda' || args[0] === '--help' || args[0] === '-h') return 'ajuda'
  return null
}

export const precisaSubirDevServer = (portaEmUso: boolean): boolean => !portaEmUso

/** O site lê o token do fragmento (#), salva, limpa a barra de endereço e abre o chat. */
export const urlComToken = (url: string, token: string): string => `${url}#ia=${token}`

/** Tenta o `url` até responder ok ou o tempo acabar. Erro de conexão conta como "ainda não". */
export const esperarSite = async (
  url: string,
  timeoutMs: number,
  intervaloMs: number,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> => {
  const fim = Date.now() + timeoutMs
  while (Date.now() < fim) {
    try {
      if ((await fetchFn(url)).ok) return true
    } catch {
      // servidor ainda subindo
    }
    await Bun.sleep(intervaloMs)
  }
  return false
}

type Env = Readonly<Record<string, string | undefined>>

export type Escolha = Sessao & { origem: 'variável de ambiente' | 'preferência do site' | 'padrão' }

/** Modelo/esforço da sessão: variáveis de ambiente > preferência salva pelo site > padrão. */
export const escolherModelo = (env: Env, prefs: Preferencias | null): Escolha => {
  const modeloEnv = env.FINANCAS_MODEL?.trim()
  const esforcoEnv = env.FINANCAS_EFFORT?.trim()
  const base = prefs ?? PREFERENCIAS_PADRAO
  return {
    modelo: modeloEnv || base.modelo,
    esforco: esforcoEnv || base.esforco,
    origem: modeloEnv || esforcoEnv ? 'variável de ambiente' : prefs ? 'preferência do site' : 'padrão',
  }
}

/** Argumentos do `claude`. Caminhos relativos à raiz do repositório (o `claude` roda com cwd nela). */
export const buildClaudeArgs = (systemPrompt: string, sessao: Sessao): string[] => [
  '--dangerously-load-development-channels', 'server:financas',
  '--strict-mcp-config', '--mcp-config', `${BASE}/mcp.json`,
  '--settings', `${BASE}/settings.json`,
  '--setting-sources', 'project',
  '--tools', '',
  '--system-prompt', systemPrompt,
  '--model', sessao.modelo,
  '--effort', sessao.esforco,
]

/** Ambiente do `claude`: token dos hooks, marca de sessão-canal, modelo da sessão e handshake MCP. */
export const buildClaudeEnv = (base: Env, token: string, sessao: Sessao): Record<string, string | undefined> => ({
  ...base,
  FINANCAS_TOKEN: token,
  FINANCAS_CANAL: '1',
  FINANCAS_SESSAO_MODELO: sessao.modelo,
  FINANCAS_SESSAO_ESFORCO: sessao.esforco,
  MCP_PROTOCOL_NEGOTIATION: 'legacy',
})

const portaEmUso = async (porta: number): Promise<boolean> => {
  try {
    await fetch(`http://localhost:${porta}/`, { signal: AbortSignal.timeout(1500) })
    return true
  } catch {
    return false
  }
}

/** Sobe o Vite só se a porta estiver livre. Devolve o processo que subiu (para encerrar no fim). */
const prepararSiteLocal = async (): Promise<Subprocess | null> => {
  if (!precisaSubirDevServer(await portaEmUso(DEV_PORT))) {
    console.log('Site local já está rodando.')
    return null
  }
  const viteBin = join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(viteBin)) {
    console.error(`Vite não encontrado. Rode "npm install" em ${REPO_ROOT}.`)
    return null
  }
  console.log('Subindo o site local…')
  const vite = Bun.spawn(['node', viteBin, '--port', String(DEV_PORT), '--strictPort'], {
    cwd: REPO_ROOT,
    stdout: 'ignore',
    stderr: 'ignore',
  })
  if (!(await esperarSite(URLS.local, ESPERA_SITE_MS, 500))) {
    console.error('O site local não respondeu em 60 s; seguindo mesmo assim.')
  }
  return vite
}

const abrirNavegador = (url: string) => {
  Bun.spawn(['cmd', '/c', 'start', '', url], { stdout: 'ignore', stderr: 'ignore' })
}

const iniciarClaude = async (token: string, sessao: Sessao): Promise<number> => {
  const systemPrompt = readFileSync(join(REPO_ROOT, BASE, 'system-prompt.md'), 'utf8').trim()
  const proc = Bun.spawn(['claude', ...buildClaudeArgs(systemPrompt, sessao)], {
    cwd: REPO_ROOT,
    stdio: ['inherit', 'inherit', 'inherit'],
    env: buildClaudeEnv(process.env, token, sessao),
  })
  return proc.exited
}

const main = async () => {
  const modo = parseModo(process.argv.slice(2))
  if (modo === null) {
    console.error(USO)
    process.exit(1)
  }
  if (modo === 'ajuda') {
    console.log(`${USO}\n\nProjeto: ${REPO_ROOT}`)
    return
  }
  const token = loadOrCreateToken(TOKEN_DIR)
  console.log(`\nToken do chat (cole em Configurações do site): ${token}`)
  const escolha = escolherModelo(process.env, lerPreferencias(TOKEN_DIR))
  console.log(`Modelo: ${escolha.modelo} · esforço ${escolha.esforco} (${escolha.origem})\n`)
  const vite = modo === 'local' ? await prepararSiteLocal() : null
  abrirNavegador(urlComToken(URLS[modo], token))
  const codigo = await iniciarClaude(token, escolha)
  vite?.kill()
  process.exit(codigo)
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error('Não foi possível iniciar o chat de IA:', err)
    process.exit(1)
  })
}
