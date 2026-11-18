import type { FinanceSnapshot } from '../../../src/services/ai/chatProtocol.ts'

/** `atual` = último snapshot recebido do site; `enviado` = último que foi junto de uma pergunta. */
export type SnapshotState = { readonly atual: string | null; readonly enviado: string | null }

export const EMPTY_SNAPSHOT: SnapshotState = { atual: null, enviado: null }

/** Guarda o snapshot. Nunca dispara nada: só vai ao Claude junto da próxima pergunta. */
export const setSnapshot = (state: SnapshotState, data: FinanceSnapshot): SnapshotState => ({
  ...state,
  atual: JSON.stringify(data),
})

/** Devolve o JSON a anexar (ou null se não mudou desde o último envio) e o novo estado. */
export const takeIfChanged = (state: SnapshotState): { state: SnapshotState; json: string | null } => {
  if (state.atual === null || state.atual === state.enviado) return { state, json: null }
  return { state: { ...state, enviado: state.atual }, json: state.atual }
}
