import { test, expect } from 'bun:test'
import { buildClaudeArgs } from '../scripts/start'

test('args base do claude: sonnet com esforço medium por padrão', () =>
  expect(buildClaudeArgs({}, 'PROMPT')).toEqual([
    '--dangerously-load-development-channels', 'server:financas',
    '--strict-mcp-config', '--mcp-config', 'mcp/financas-channel/mcp.json',
    '--settings', 'mcp/financas-channel/settings.json',
    '--setting-sources', 'project',
    '--tools', '',
    '--system-prompt', 'PROMPT',
    '--model', 'sonnet',
    '--effort', 'medium',
  ]))

test('FINANCAS_MODEL troca o modelo', () =>
  expect(buildClaudeArgs({ FINANCAS_MODEL: 'opus' }, 'P').slice(-4)).toEqual(['--model', 'opus', '--effort', 'medium']))

test('FINANCAS_EFFORT troca o esforço', () =>
  expect(buildClaudeArgs({ FINANCAS_EFFORT: 'high' }, 'P').slice(-4)).toEqual(['--model', 'sonnet', '--effort', 'high']))

test('valores vazios usam o padrão', () =>
  expect(buildClaudeArgs({ FINANCAS_MODEL: '  ', FINANCAS_EFFORT: '' }, 'P').slice(-4))
    .toEqual(['--model', 'sonnet', '--effort', 'medium']))

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseModo, URLS, precisaSubirDevServer, esperarSite, REPO_ROOT } from '../scripts/start'

test('parseModo: sem argumento abre o GitHub Pages', () => expect(parseModo([])).toBe('pages'))
test('parseModo: local', () => expect(parseModo(['local'])).toBe('local'))
test('parseModo: ajuda e --help', () => {
  expect(parseModo(['ajuda'])).toBe('ajuda')
  expect(parseModo(['--help'])).toBe('ajuda')
})
test('parseModo: argumento desconhecido é null', () => expect(parseModo(['xyz'])).toBeNull())

test('URLs exatas dos dois ambientes', () =>
  expect(URLS).toEqual({
    pages: 'https://danielalexssander.github.io/Controle-Financeiro/',
    local: 'http://localhost:5173/Controle-Financeiro/',
  }))

test('dev server só sobe se a porta estiver livre', () => {
  expect(precisaSubirDevServer(true)).toBe(false)
  expect(precisaSubirDevServer(false)).toBe(true)
})

test('REPO_ROOT é a raiz real do repositório', () =>
  expect(existsSync(join(REPO_ROOT, 'mcp', 'financas-channel', 'scripts', 'start.ts'))).toBe(true))

test('esperarSite: true quando responde ok na segunda tentativa', async () => {
  let chamadas = 0
  const fakeFetch = (async () => {
    chamadas++
    if (chamadas === 1) throw new Error('ECONNREFUSED')
    return new Response('ok', { status: 200 })
  }) as unknown as typeof fetch
  expect(await esperarSite('http://x', 1000, 5, fakeFetch)).toBe(true)
  expect(chamadas).toBe(2)
})

test('esperarSite: false no tempo limite', async () => {
  const fakeFetch = (async () => new Response('', { status: 503 })) as unknown as typeof fetch
  expect(await esperarSite('http://x', 30, 5, fakeFetch)).toBe(false)
})

import { urlComToken } from '../scripts/start'

test('urlComToken coloca o token no fragmento (#), que não vai ao servidor', () =>
  expect(urlComToken(URLS.pages, 'a'.repeat(64)))
    .toBe(`https://danielalexssander.github.io/Controle-Financeiro/#ia=${'a'.repeat(64)}`))
