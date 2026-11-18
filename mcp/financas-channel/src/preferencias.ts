import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Preferencias } from '../../../src/services/ai/chatProtocol.ts'
import { parsePreferencias } from './protocol'

// Preferência de modelo escolhida no site. O canal salva; o `financas` lê no próximo início.
const ARQUIVO = 'preferencias.json'

export const salvarPreferencias = (dir: string, prefs: Preferencias): void => {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, ARQUIVO), JSON.stringify(prefs), { mode: 0o600 })
}

/** Lê as preferências salvas; arquivo ausente, corrompido ou inválido devolve null. */
export const lerPreferencias = (dir: string): Preferencias | null => {
  const path = join(dir, ARQUIVO)
  if (!existsSync(path)) return null
  try {
    return parsePreferencias(JSON.parse(readFileSync(path, 'utf8')))
  } catch {
    return null
  }
}
