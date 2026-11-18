import { test, expect } from 'bun:test'
import { EMPTY_SNAPSHOT, setSnapshot, takeIfChanged } from '../src/snapshotStore'
import { buildChannelContent } from '../src/channelContent'
import { snap } from './fixtures'

test('primeira pergunta leva o snapshot; a segunda, sem mudança, não', () => {
  const s1 = setSnapshot(EMPTY_SNAPSHOT, snap)
  const a = takeIfChanged(s1)
  expect(a.json).toBe(JSON.stringify(snap))
  expect(takeIfChanged(a.state).json).toBeNull()
})

test('snapshot alterado volta a ser enviado', () => {
  const { state } = takeIfChanged(setSnapshot(EMPTY_SNAPSHOT, snap))
  const mudado = { ...snap, cotacaoUsdBrl: snap.cotacaoUsdBrl + 1 }
  expect(takeIfChanged(setSnapshot(state, mudado)).json).toBe(JSON.stringify(mudado))
})

test('sem snapshot nenhum, json é null', () => expect(takeIfChanged(EMPTY_SNAPSHOT).json).toBeNull())

test('setSnapshot não altera o estado anterior', () => {
  const s0 = EMPTY_SNAPSHOT
  setSnapshot(s0, snap)
  expect(s0.atual).toBeNull()
})

test('conteúdo com dados', () =>
  expect(buildChannelContent('Quanto tenho?', '{"a":1}')).toBe(
    'Dados financeiros atualizados do site:\n<dados_financeiros>\n{"a":1}\n</dados_financeiros>\n\nPergunta: Quanto tenho?'))

test('conteúdo sem dados', () =>
  expect(buildChannelContent('Quanto tenho?', null)).toBe('Pergunta: Quanto tenho?'))
