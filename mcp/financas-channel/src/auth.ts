import { randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TOKEN_FILE = 'token'
const TOKEN_PATTERN = /^[0-9a-f]{64}$/

/** Origem precisa bater exatamente com uma da lista (sem prefixo/sufixo). */
export const isAllowedOrigin = (origin: string | null, allowed: readonly string[]): boolean =>
  origin !== null && allowed.includes(origin)

/** Comparação em tempo constante; tamanhos diferentes nunca batem. */
export const tokensMatch = (received: string | null, expected: string): boolean => {
  if (received === null) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const readValidToken = (path: string): string | null => {
  if (!existsSync(path)) return null
  const token = readFileSync(path, 'utf8').trim()
  return TOKEN_PATTERN.test(token) ? token : null
}

/** Lê o token salvo em `dir`; se faltar ou estiver inválido, gera um novo (64 hex, modo 0o600). */
export const loadOrCreateToken = (dir: string): string => {
  const path = join(dir, TOKEN_FILE)
  const existing = readValidToken(path)
  if (existing) return existing
  const token = randomBytes(32).toString('hex')
  mkdirSync(dir, { recursive: true })
  writeFileSync(path, token, { mode: 0o600 })
  return token
}
