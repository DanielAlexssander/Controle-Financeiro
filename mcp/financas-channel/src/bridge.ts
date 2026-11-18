import type { Server, ServerWebSocket } from 'bun'
import type { ClientMessage, ServerMessage } from '../../../src/services/ai/chatProtocol.ts'
import { isAllowedOrigin, tokensMatch } from './auth'
import { BRIDGE_HOST } from './config'
import { HOOK_PATHS, parseHookPayload, type HookEvent } from './hookPayload'
import { parseClientMessage } from './protocol'

export const CLOSE_SUBSTITUIDA = 4000
export const CLOSE_TOKEN_INVALIDO = 4001
const MAX_HOOK_BODY_BYTES = 1_000_000

export type BridgeOptions = {
  port: number
  token: string
  allowedOrigins: readonly string[]
  onConnect(): void
  onClientMessage(msg: ClientMessage): void
  onHook(ev: HookEvent): void
}

export type BridgeHandle = { port: number; send(msg: ServerMessage): void; stop(): void }

type WsData = { autorizado: boolean }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const handleHook = async (req: Request, path: string, opts: BridgeOptions): Promise<Response> => {
  const auth = req.headers.get('Authorization')
  if (!tokensMatch(auth?.startsWith('Bearer ') ? auth.slice(7) : null, opts.token)) {
    return new Response('unauthorized', { status: 401 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('invalid json', { status: 400 })
  }
  const ev = parseHookPayload(path, body)
  if (ev === null) return new Response('invalid payload', { status: 400 })
  opts.onHook(ev)
  return json({})
}

/** Servidor local: WebSocket do site em /chat e rotas dos hooks http do Claude Code. */
export const startBridge = (opts: BridgeOptions): BridgeHandle => {
  let atual: ServerWebSocket<WsData> | null = null

  const server: Server<WsData> = Bun.serve<WsData>({
    hostname: BRIDGE_HOST,
    port: opts.port,
    maxRequestBodySize: MAX_HOOK_BODY_BYTES,
    fetch(req, srv) {
      const url = new URL(req.url)
      if (req.method === 'GET' && url.pathname === '/chat') {
        if (!isAllowedOrigin(req.headers.get('Origin'), opts.allowedOrigins)) {
          return new Response('forbidden', { status: 403 })
        }
        const autorizado = tokensMatch(url.searchParams.get('token'), opts.token)
        return srv.upgrade(req, { data: { autorizado } }) ? undefined : new Response('upgrade failed', { status: 400 })
      }
      if (req.method === 'POST' && (HOOK_PATHS as readonly string[]).includes(url.pathname)) {
        return handleHook(req, url.pathname, opts)
      }
      return new Response('not found', { status: 404 })
    },
    websocket: {
      idleTimeout: 960,
      open(ws) {
        if (!ws.data.autorizado) {
          ws.close(CLOSE_TOKEN_INVALIDO, 'token inválido')
          return
        }
        atual?.close(CLOSE_SUBSTITUIDA, 'aberto em outra aba')
        atual = ws
        opts.onConnect()
      },
      message(ws, raw) {
        if (ws !== atual) return
        const msg = parseClientMessage(typeof raw === 'string' ? raw : raw.toString())
        if (msg === null) {
          ws.send(JSON.stringify({ type: 'erro', mensagem: 'Mensagem inválida.' } satisfies ServerMessage))
          return
        }
        opts.onClientMessage(msg)
      },
      close(ws) {
        if (ws === atual) atual = null
      },
    },
  })

  return {
    port: server.port ?? opts.port,
    send: (msg) => { atual?.send(JSON.stringify(msg)) },
    stop: () => { server.stop(true) },
  }
}
