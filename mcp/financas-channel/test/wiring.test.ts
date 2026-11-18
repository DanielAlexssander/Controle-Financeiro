import { test, expect } from 'bun:test'
import { createWiring } from '../src/server'
import { buildChannelContent } from '../src/channelContent'
import type { ServerMessage } from '../../../src/services/ai/chatProtocol.ts'
import { snap } from './fixtures'

const setup = (opts: { timeoutMs?: number; falhar?: boolean } = {}) => {
  const notified: string[] = []
  const sent: ServerMessage[] = []
  const w = createWiring({
    notify: async (c) => { notified.push(c); if (opts.falhar) throw new Error('x') },
    send: (m) => { sent.push(m) },
    timeoutMs: opts.timeoutMs ?? 10_000,
  })
  return { w, notified, sent }
}
const pergunta = (texto: string) => ({ type: 'pergunta' as const, ia: 'claude' as const, texto })
const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms))

test('snapshot sozinho nunca chama notify', () => {
  const { w, notified, sent } = setup()
  w.onClientMessage({ type: 'snapshot', data: snap })
  expect(notified).toEqual([])
  expect(sent).toEqual([])
})

test('pergunta chama notify uma vez e envia status ocupado', () => {
  const { w, notified, sent } = setup()
  w.onClientMessage(pergunta('oi'))
  expect(notified).toEqual([buildChannelContent('oi', null)])
  expect(sent).toEqual([{ type: 'status', estado: 'ocupado' }])
})

test('primeira pergunta leva o snapshot; segunda sem mudança não leva', () => {
  const { w, notified } = setup()
  w.onClientMessage({ type: 'snapshot', data: snap })
  w.onClientMessage(pergunta('a'))
  w.onHook({ tipo: 'stop', texto: 'r' })
  w.onClientMessage({ type: 'snapshot', data: snap })
  w.onClientMessage(pergunta('b'))
  expect(notified).toEqual([buildChannelContent('a', JSON.stringify(snap)), buildChannelContent('b', null)])
})

test('pergunta durante outra não chama notify', () => {
  const { w, notified, sent } = setup()
  w.onClientMessage(pergunta('a'))
  w.onClientMessage(pergunta('b'))
  expect(notified.length).toBe(1)
  expect(sent.at(-1)).toEqual({ type: 'erro', mensagem: 'Aguarde a resposta anterior terminar.' })
})

test('display/stop fluem para send como parcial/final', () => {
  const { w, sent } = setup()
  w.onClientMessage(pergunta('a'))
  w.onHook({ tipo: 'display', delta: 'x\n' })
  w.onHook({ tipo: 'stop', texto: 'x' })
  expect(sent.slice(1)).toEqual([
    { type: 'parcial', texto: 'x\n' },
    { type: 'final', texto: 'x' },
    { type: 'status', estado: 'pronto' },
  ])
})

test('sem resposta até timeoutMs → erro e pronto; stop atrasado é ignorado', async () => {
  const { w, sent } = setup({ timeoutMs: 20 })
  w.onClientMessage(pergunta('a'))
  await tick(50)
  w.onHook({ tipo: 'stop', texto: 'tarde' })
  expect(sent.slice(1)).toEqual([
    { type: 'erro', mensagem: 'A sessão do Claude não respondeu. Verifique o terminal do `npm run ia`.' },
    { type: 'status', estado: 'pronto' },
  ])
})

test('resposta antes do timeout cancela o timer', async () => {
  const { w, sent } = setup({ timeoutMs: 20 })
  w.onClientMessage(pergunta('a'))
  w.onHook({ tipo: 'stop', texto: 'r' })
  await tick(50)
  expect(sent.filter((m) => m.type === 'erro')).toEqual([])
})

test('notify rejeitando → erro e pronto; próxima pergunta ainda leva o snapshot', async () => {
  const { w, notified, sent } = setup({ falhar: true })
  w.onClientMessage({ type: 'snapshot', data: snap })
  w.onClientMessage(pergunta('a'))
  await tick()
  expect(sent.slice(1)).toEqual([
    { type: 'erro', mensagem: 'Erro na IA (unknown).' },
    { type: 'status', estado: 'pronto' },
  ])
  w.onClientMessage(pergunta('b'))
  expect(notified.at(-1)).toBe(buildChannelContent('b', JSON.stringify(snap)))
})

test('onConnect envia o status atual', () => {
  const { w, sent } = setup()
  w.onConnect()
  w.onClientMessage(pergunta('a'))
  w.onConnect()
  expect(sent).toEqual([
    { type: 'status', estado: 'pronto' },
    { type: 'status', estado: 'ocupado' },
    { type: 'status', estado: 'ocupado' },
  ])
})
