#!/usr/bin/env bun
// `financas [local|ajuda]` (global, via npm link) e `npm run ia`:
// abre o site e a sessão interativa do Claude Code com o canal "financas".
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Subprocess } from 'bun'
import { loadOrCreateToken } from '../src/auth'
import { TOKEN_DIR } from '../src/config'

const BASE = 'mcp/financas-channel'
const DEFAULT_MODEL = 'sonnet'
const DEFAULT_EFFORT = 'medium'
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

const valorOu = (valor: string | undefined, padrao: string): string => valor?.trim() || padrao

/** Argumentos do `claude`. Caminhos relativos à raiz do repositório (o `claude` roda com cwd nela). */
export const buildClaudeArgs = (
  env: Readonly<Record<string, string | undefined>>,
  systemPrompt: string,
): string[] => [
  '--dangerously-load-development-channels', 'server:financas',
  '--strict-mcp-config', '--mcp-config', `${BASE}/mcp.json`,
  '--settings', `${BASE}/settings.json`,
  '--setting-sources', 'project',
  '--tools', '',
  '--system-prompt', systemPrompt,
  '--model', valorOu(env.FINANCAS_MODEL, DEFAULT_MODEL),
  '--effort', valorOu(env.FINANCAS_EFFORT, DEFAULT_EFFORT),
]

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

const iniciarClaude = async (token: string): Promise<number> => {
  const systemPrompt = readFileSync(join(REPO_ROOT, BASE, 'system-prompt.md'), 'utf8').trim()
  const proc = Bun.spawn(['claude', ...buildClaudeArgs(process.env, systemPrompt)], {
    cwd: REPO_ROOT,
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env, FINANCAS_TOKEN: token, MCP_PROTOCOL_NEGOTIATION: 'legacy' },
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
  console.log(`\nToken do chat (cole em Configurações do site): ${token}\n`)
  const vite = modo === 'local' ? await prepararSiteLocal() : null
  abrirNavegador(urlComToken(URLS[modo], token))
  const codigo = await iniciarClaude(token)
  vite?.kill()
  process.exit(codigo)
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error('Não foi possível iniciar o chat de IA:', err)
    process.exit(1)
  })
}
