import { test, expect } from 'bun:test'
import { IDLE, step, mensagemDeFalha } from '../src/conversation'

const ocupado = () => step(IDLE, { tipo: 'pergunta' }).state

test('pergunta parada → ocupado e aceita', () => {
  const r = step(IDLE, { tipo: 'pergunta' })
  expect(r.aceita).toBe(true)
  expect(r.saida).toEqual([{ type: 'status', estado: 'ocupado' }])
})

test('pergunta com outra em andamento → erro e não aceita', () => {
  const r = step(ocupado(), { tipo: 'pergunta' })
  expect(r.aceita).toBe(false)
  expect(r.saida).toEqual([{ type: 'erro', mensagem: 'Aguarde a resposta anterior terminar.' }])
})

test('display em andamento vira parcial', () =>
  expect(step(ocupado(), { tipo: 'display', delta: 'linha\n' }).saida)
    .toEqual([{ type: 'parcial', texto: 'linha\n' }]))

test('stop envia final e volta a pronto', () => {
  const r = step(ocupado(), { tipo: 'stop', texto: 'Resposta' })
  expect(r.saida).toEqual([{ type: 'final', texto: 'Resposta' }, { type: 'status', estado: 'pronto' }])
  expect(r.state).toEqual(IDLE)
})

test('stop sem texto usa o parcial acumulado', () => {
  const s = step(ocupado(), { tipo: 'display', delta: 'a\n' }).state
  expect(step(s, { tipo: 'stop', texto: '' }).saida[0]).toEqual({ type: 'final', texto: 'a\n' })
})

test('hooks com o chat parado são ignorados (algo digitado no terminal)', () => {
  expect(step(IDLE, { tipo: 'display', delta: 'x' }).saida).toEqual([])
  expect(step(IDLE, { tipo: 'stop', texto: 'x' }).saida).toEqual([])
  expect(step(IDLE, { tipo: 'falha', erro: 'rate_limit' }).saida).toEqual([])
})

test('falha em andamento → erro traduzido e pronto', () =>
  expect(step(ocupado(), { tipo: 'falha', erro: 'rate_limit' }).saida).toEqual([
    { type: 'erro', mensagem: 'Limite de uso do plano atingido. Tente novamente mais tarde.' },
    { type: 'status', estado: 'pronto' },
  ]))

test('timeout libera com erro claro', () =>
  expect(step(ocupado(), { tipo: 'timeout' }).saida).toEqual([
    { type: 'erro', mensagem: 'A sessão do Claude não respondeu. Verifique o terminal do `npm run ia`.' },
    { type: 'status', estado: 'pronto' },
  ]))

test('timeout com o chat parado é ignorado', () =>
  expect(step(IDLE, { tipo: 'timeout' }).saida).toEqual([]))

test('step não muta o estado anterior', () => {
  const s = ocupado()
  step(s, { tipo: 'display', delta: 'x' })
  expect(s).toEqual({ emAndamento: true, parcial: '' })
})

test('mensagens de falha', () => {
  expect(mensagemDeFalha('rate_limit')).toBe('Limite de uso do plano atingido. Tente novamente mais tarde.')
  expect(mensagemDeFalha('authentication_failed')).toBe('O Claude Code está sem login válido. Rode /login no terminal.')
  expect(mensagemDeFalha('oauth_org_not_allowed')).toBe('O Claude Code está sem login válido. Rode /login no terminal.')
  expect(mensagemDeFalha('server_error')).toBe('O serviço do Claude está indisponível no momento. Tente de novo.')
  expect(mensagemDeFalha('overloaded')).toBe('O serviço do Claude está indisponível no momento. Tente de novo.')
  expect(mensagemDeFalha('billing_error')).toBe('Há um problema de cobrança na conta do Claude.')
  expect(mensagemDeFalha('xyz')).toBe('Erro na IA (xyz).')
})
