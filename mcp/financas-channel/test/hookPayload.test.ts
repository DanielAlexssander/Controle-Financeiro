import { test, expect } from 'bun:test'
import { parseHookPayload } from '../src/hookPayload'

test('display lê delta', () =>
  expect(parseHookPayload('/hooks/display', { delta: 'a\n', final: false })).toEqual({ tipo: 'display', delta: 'a\n' }))
test('stop lê last_assistant_message', () =>
  expect(parseHookPayload('/hooks/stop', { last_assistant_message: 'R' })).toEqual({ tipo: 'stop', texto: 'R' }))
test('stop sem mensagem vira texto vazio', () =>
  expect(parseHookPayload('/hooks/stop', {})).toEqual({ tipo: 'stop', texto: '' }))
test('stop-failure lê error', () =>
  expect(parseHookPayload('/hooks/stop-failure', { error: 'rate_limit' })).toEqual({ tipo: 'falha', erro: 'rate_limit' }))
test('stop-failure sem error vira unknown', () =>
  expect(parseHookPayload('/hooks/stop-failure', {})).toEqual({ tipo: 'falha', erro: 'unknown' }))
test('display com delta não-string é inválido', () =>
  expect(parseHookPayload('/hooks/display', { delta: 1 })).toBeNull())
test('corpo que não é objeto é inválido', () =>
  expect(parseHookPayload('/hooks/stop', 'x')).toBeNull())
test('rota desconhecida é inválida', () =>
  expect(parseHookPayload('/outro', {})).toBeNull())
