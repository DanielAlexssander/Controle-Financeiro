import {
  ESFORCOS,
  MAX_PERGUNTA_CHARS,
  MAX_SNAPSHOT_BYTES,
  MODELOS,
  type ClientMessage,
  type FinanceSnapshot,
  type Preferencias,
} from '../../../src/services/ai/chatProtocol.ts'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const parsePergunta = (msg: Record<string, unknown>): ClientMessage | null => {
  if (msg.ia !== 'claude' || typeof msg.texto !== 'string') return null
  const texto = msg.texto.trim()
  if (texto.length === 0 || texto.length > MAX_PERGUNTA_CHARS) return null
  return { type: 'pergunta', ia: 'claude', texto }
}

const parseSnapshot = (msg: Record<string, unknown>): ClientMessage | null => {
  if (!isPlainObject(msg.data)) return null
  // O conteúdo do snapshot é opaco para o canal: só é repassado ao Claude como JSON.
  return { type: 'snapshot', data: msg.data as unknown as FinanceSnapshot }
}

/** Modelo e esforço só valem se forem exatamente um dos permitidos. */
export const parsePreferencias = (value: unknown): Preferencias | null => {
  if (!isPlainObject(value)) return null
  const { modelo, esforco } = value
  const modeloOk = (MODELOS as readonly unknown[]).includes(modelo)
  const esforcoOk = (ESFORCOS as readonly unknown[]).includes(esforco)
  return modeloOk && esforcoOk ? ({ modelo, esforco } as Preferencias) : null
}

/** Valida uma mensagem vinda do site. Devolve null para qualquer entrada inválida. */
export const parseClientMessage = (raw: string): ClientMessage | null => {
  if (Buffer.byteLength(raw) > MAX_SNAPSHOT_BYTES) return null
  let msg: unknown
  try {
    msg = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isPlainObject(msg)) return null
  if (msg.type === 'pergunta') return parsePergunta(msg)
  if (msg.type === 'snapshot') return parseSnapshot(msg)
  if (msg.type === 'preferencias') {
    const preferencias = parsePreferencias(msg.preferencias)
    return preferencias ? { type: 'preferencias', preferencias } : null
  }
  return null
}
