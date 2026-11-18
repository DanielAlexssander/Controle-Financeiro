import { test, expect } from 'bun:test'
import { buildClaudeArgs, escolherModelo } from '../scripts/start'

test('args do claude com o modelo escolhido', () =>
  expect(buildClaudeArgs('PROMPT', { modelo: 'sonnet', esforco: 'medium' })).toEqual([
    '--dangerously-load-development-channels', 'server:financas',
    '--strict-mcp-config', '--mcp-config', 'mcp/financas-channel/mcp.json',
    '--settings', 'mcp/financas-channel/settings.json',
    '--setting-sources', 'project',
    '--tools', '',
    '--system-prompt', 'PROMPT',
    '--model', 'sonnet',
    '--effort', 'medium',
  ]))

test('escolherModelo: sem nada usa o padrão (sonnet, medium)', () =>
  expect(escolherModelo({}, null)).toEqual({ modelo: 'sonnet', esforco: 'medium', origem: 'padrão' }))

test('escolherModelo: usa a preferência salva pelo site', () =>
  expect(escolherModelo({}, { modelo: 'opus', esforco: 'high' }))
    .toEqual({ modelo: 'opus', esforco: 'high', origem: 'preferência do site' }))

test('escolherModelo: variáveis de ambiente vencem a preferência', () =>
  expect(escolherModelo({ FINANCAS_MODEL: 'haiku', FINANCAS_EFFORT: 'low' }, { modelo: 'opus', esforco: 'high' }))
    .toEqual({ modelo: 'haiku', esforco: 'low', origem: 'variável de ambiente' }))

test('escolherModelo: variável vazia é ignorada', () =>
  expect(escolherModelo({ FINANCAS_MODEL: '  ', FINANCAS_EFFORT: '' }, { modelo: 'opus', esforco: 'high' }))
    .toEqual({ modelo: 'opus', esforco: 'high', origem: 'preferência do site' }))

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
