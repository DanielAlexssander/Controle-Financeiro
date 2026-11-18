import { test, expect } from 'bun:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isAllowedOrigin, tokensMatch, loadOrCreateToken } from '../src/auth'
import { ALLOWED_ORIGINS } from '../src/config'

test('origem exata permitida', () =>
  expect(isAllowedOrigin('http://localhost:5173', ALLOWED_ORIGINS)).toBe(true))

test('origem nula ou parecida é recusada', () => {
  expect(isAllowedOrigin(null, ALLOWED_ORIGINS)).toBe(false)
  expect(isAllowedOrigin('https://danielalexssander.github.io.evil.com', ALLOWED_ORIGINS)).toBe(false)
})

test('tokensMatch compara com tamanho diferente sem lançar', () => {
  expect(tokensMatch('abc', 'abcd')).toBe(false)
  expect(tokensMatch(null, 'abcd')).toBe(false)
  expect(tokensMatch('abcd', 'abcd')).toBe(true)
})

test('loadOrCreateToken cria 64 hex e reaproveita depois', () => {
  const dir = mkdtempSync(join(tmpdir(), 'financas-'))
  const t1 = loadOrCreateToken(dir)
  expect(t1).toMatch(/^[0-9a-f]{64}$/)
  expect(loadOrCreateToken(dir)).toBe(t1)
})

test('loadOrCreateToken recria token corrompido', () => {
  const dir = mkdtempSync(join(tmpdir(), 'financas-'))
  writeFileSync(join(dir, 'token'), 'curto')
  expect(loadOrCreateToken(dir)).toMatch(/^[0-9a-f]{64}$/)
})
