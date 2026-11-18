import { test, expect } from 'bun:test'
import { deveAbrirCanal } from '../src/config'
import { buildClaudeEnv } from '../scripts/start'

test('canal só abre na sessão iniciada pelo financas', () => {
  expect(deveAbrirCanal({ FINANCAS_CANAL: '1' })).toBe(true)
  expect(deveAbrirCanal({})).toBe(false)
  expect(deveAbrirCanal({ FINANCAS_CANAL: '0' })).toBe(false)
})

test('o launcher marca a sessão como canal, passa o token e o modelo da sessão', () => {
  const env = buildClaudeEnv({ PATH: 'x' }, 'TOKEN', { modelo: 'opus', esforco: 'high' })
  expect(env).toEqual({
    PATH: 'x',
    FINANCAS_TOKEN: 'TOKEN',
    FINANCAS_CANAL: '1',
    FINANCAS_SESSAO_MODELO: 'opus',
    FINANCAS_SESSAO_ESFORCO: 'high',
    MCP_PROTOCOL_NEGOTIATION: 'legacy',
  })
})
