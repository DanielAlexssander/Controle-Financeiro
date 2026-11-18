export type HookEvent =
  | { tipo: 'display'; delta: string }
  | { tipo: 'stop'; texto: string }
  | { tipo: 'falha'; erro: string }

export const HOOK_PATHS = ['/hooks/display', '/hooks/stop', '/hooks/stop-failure'] as const

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const stringOr = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback)

/** Converte o JSON que o Claude Code envia nos hooks http em um evento da conversa. */
export const parseHookPayload = (path: string, body: unknown): HookEvent | null => {
  if (!isObject(body)) return null
  switch (path) {
    case '/hooks/display':
      return typeof body.delta === 'string' ? { tipo: 'display', delta: body.delta } : null
    case '/hooks/stop':
      return { tipo: 'stop', texto: stringOr(body.last_assistant_message, '') }
    case '/hooks/stop-failure':
      return { tipo: 'falha', erro: stringOr(body.error, 'unknown') }
    default:
      return null
  }
}
