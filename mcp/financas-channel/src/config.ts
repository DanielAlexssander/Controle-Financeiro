import { homedir } from 'node:os'
import { join } from 'node:path'

export const BRIDGE_HOST = '127.0.0.1'

export const ALLOWED_ORIGINS: readonly string[] = [
  'http://localhost:5173',
  'https://danielalexssander.github.io',
]

export const TOKEN_DIR = join(homedir(), '.claude', 'channels', 'financas')

export const RESPOSTA_TIMEOUT_MS = 300_000
