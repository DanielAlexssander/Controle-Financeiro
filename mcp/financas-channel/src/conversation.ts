import type { ServerMessage } from '../../../src/services/ai/chatProtocol.ts'

export type ConversationState = { readonly emAndamento: boolean; readonly parcial: string }

export type ConversationEvent =
  | { tipo: 'pergunta' }
  | { tipo: 'display'; delta: string }
  | { tipo: 'stop'; texto: string }
  | { tipo: 'falha'; erro: string }
  | { tipo: 'timeout' }

export type StepResult = {
  state: ConversationState
  saida: readonly ServerMessage[]
  aceita: boolean
}

export const IDLE: ConversationState = { emAndamento: false, parcial: '' }

const PRONTO: ServerMessage = { type: 'status', estado: 'pronto' }
const OCUPADO: ServerMessage = { type: 'status', estado: 'ocupado' }
const MSG_OCUPADO = 'Aguarde a resposta anterior terminar.'
const MSG_TIMEOUT = 'A sessão do Claude não respondeu. Verifique o terminal do `npm run ia`.'

const LOGIN_INVALIDO = 'O Claude Code está sem login válido. Rode /login no terminal.'
const INDISPONIVEL = 'O serviço do Claude está indisponível no momento. Tente de novo.'

const FALHAS: Readonly<Record<string, string>> = {
  rate_limit: 'Limite de uso do plano atingido. Tente novamente mais tarde.',
  authentication_failed: LOGIN_INVALIDO,
  oauth_org_not_allowed: LOGIN_INVALIDO,
  server_error: INDISPONIVEL,
  overloaded: INDISPONIVEL,
  billing_error: 'Há um problema de cobrança na conta do Claude.',
}

/** Traduz o `error` do hook StopFailure para uma mensagem ao usuário. */
export const mensagemDeFalha = (erro: string): string => FALHAS[erro] ?? `Erro na IA (${erro}).`

const ignorar = (state: ConversationState): StepResult => ({ state, saida: [], aceita: false })

const encerrar = (saida: ServerMessage): StepResult => ({ state: IDLE, saida: [saida, PRONTO], aceita: false })

/**
 * Máquina de estados pergunta ↔ resposta. Eventos de hook sem pergunta em andamento
 * (ex.: algo digitado direto no terminal) são ignorados.
 */
export const step = (state: ConversationState, ev: ConversationEvent): StepResult => {
  if (ev.tipo === 'pergunta') {
    return state.emAndamento
      ? { state, saida: [{ type: 'erro', mensagem: MSG_OCUPADO }], aceita: false }
      : { state: { emAndamento: true, parcial: '' }, saida: [OCUPADO], aceita: true }
  }
  if (!state.emAndamento) return ignorar(state)
  switch (ev.tipo) {
    case 'display':
      return {
        state: { ...state, parcial: state.parcial + ev.delta },
        saida: [{ type: 'parcial', texto: ev.delta }],
        aceita: false,
      }
    case 'stop':
      return encerrar({ type: 'final', texto: ev.texto || state.parcial })
    case 'falha':
      return encerrar({ type: 'erro', mensagem: mensagemDeFalha(ev.erro) })
    case 'timeout':
      return encerrar({ type: 'erro', mensagem: MSG_TIMEOUT })
  }
}
