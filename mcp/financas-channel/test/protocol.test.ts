import { describe, test, expect } from 'bun:test'
import { parseClientMessage } from '../src/protocol'

describe('parseClientMessage', () => {
  test('aceita pergunta válida e faz trim', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'pergunta', ia: 'claude', texto: '  oi  ' })))
      .toEqual({ type: 'pergunta', ia: 'claude', texto: 'oi' })
  })
  test('rejeita JSON inválido', () => expect(parseClientMessage('{')).toBeNull())
  test('rejeita ia diferente de claude', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'pergunta', ia: 'codex', texto: 'oi' }))).toBeNull())
  test('rejeita pergunta vazia após trim', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'pergunta', ia: 'claude', texto: '   ' }))).toBeNull())
  test('rejeita pergunta com mais de 4000 caracteres', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'pergunta', ia: 'claude', texto: 'a'.repeat(4001) }))).toBeNull())
  test('aceita snapshot objeto', () => {
    const msg = parseClientMessage(JSON.stringify({ type: 'snapshot', data: { totais: {} } }))
    expect(msg?.type).toBe('snapshot')
  })
  test('rejeita snapshot que não é objeto', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'snapshot', data: [1] }))).toBeNull())
  test('rejeita mensagem maior que 200000 bytes', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'snapshot', data: { x: 'a'.repeat(200_001) } }))).toBeNull())
  test('rejeita tipo desconhecido', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'outro' }))).toBeNull())
})

describe('parseClientMessage: preferencias', () => {
  test('aceita modelo e esforço válidos', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'preferencias', preferencias: { modelo: 'opus', esforco: 'high' } })))
      .toEqual({ type: 'preferencias', preferencias: { modelo: 'opus', esforco: 'high' } }))
  test('rejeita modelo desconhecido', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'preferencias', preferencias: { modelo: 'gpt', esforco: 'high' } }))).toBeNull())
  test('rejeita esforço desconhecido', () =>
    expect(parseClientMessage(JSON.stringify({ type: 'preferencias', preferencias: { modelo: 'opus', esforco: 'max' } }))).toBeNull())
})
