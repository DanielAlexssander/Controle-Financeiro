import { afterEach, describe, expect, test } from 'bun:test'
import { startBridge, type BridgeOptions } from '../src/bridge'
import type { HookEvent } from '../src/hookPayload'
import type { ClientMessage } from '../../../src/services/ai/chatProtocol.ts'

const TOKEN = 'a'.repeat(64)
const ORIGIN = 'http://localhost:5173'

type Recorder = { connects: number; client: ClientMessage[]; hooks: HookEvent[] }

let handle: ReturnType<typeof startBridge> | null = null
afterEach(() => { handle?.stop(); handle = null })

const start = (): Recorder => {
  const rec: Recorder = { connects: 0, client: [], hooks: [] }
  const opts: BridgeOptions = {
    port: 0, token: TOKEN, allowedOrigins: [ORIGIN],
    onConnect: () => { rec.connects++ },
    onClientMessage: (m) => { rec.client.push(m) },
    onHook: (e) => { rec.hooks.push(e) },
  }
  handle = startBridge(opts)
  return rec
}

const base = () => `127.0.0.1:${handle!.port}`

type Opened = { ws: WebSocket; msgs: unknown[]; closed: Promise<number> }
const open = (token = TOKEN): Promise<Opened> => new Promise((resolve, reject) => {
  const ws = new WebSocket(`ws://${base()}/chat?token=${token}`, { headers: { Origin: ORIGIN } } as unknown as string[])
  const msgs: unknown[] = []
  const closed = new Promise<number>((r) => ws.addEventListener('close', (ev) => r(ev.code)))
  ws.addEventListener('message', (ev) => msgs.push(JSON.parse(String(ev.data))))
  ws.addEventListener('open', () => resolve({ ws, msgs, closed }))
  ws.addEventListener('error', reject)
})

const tick = (ms = 50) => new Promise((r) => setTimeout(r, ms))

const postHook = (path: string, body: string, auth?: string) =>
  fetch(`http://${base()}${path}`, {
    method: 'POST', body,
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
  })

describe('WebSocket /chat', () => {
  test('origem não permitida → 403', async () => {
    start()
    const res = await fetch(`http://${base()}/chat?token=${TOKEN}`, { headers: { Origin: 'http://evil.com' } })
    expect(res.status).toBe(403)
  })

  test('token errado → conexão fechada com 4001', async () => {
    const rec = start()
    const { closed } = await open('b'.repeat(64))
    expect(await closed).toBe(4001)
    expect(rec.connects).toBe(0)
  })

  test('mensagem válida chega em onClientMessage; inválida recebe erro', async () => {
    const rec = start()
    const { ws, msgs } = await open()
    ws.send(JSON.stringify({ type: 'pergunta', ia: 'claude', texto: 'oi' }))
    ws.send('{')
    await tick()
    expect(rec.client).toEqual([{ type: 'pergunta', ia: 'claude', texto: 'oi' }])
    expect(msgs).toEqual([{ type: 'erro', mensagem: 'Mensagem inválida.' }])
    ws.close()
  })

  test('segunda conexão fecha a primeira com 4000', async () => {
    const rec = start()
    const first = await open()
    const second = await open()
    expect(await first.closed).toBe(4000)
    expect(rec.connects).toBe(2)
    second.ws.close()
  })

  test('send() entrega ao socket atual', async () => {
    start()
    const { ws, msgs } = await open()
    await tick()
    handle!.send({ type: 'parcial', texto: 'x' })
    await tick()
    expect(msgs).toEqual([{ type: 'parcial', texto: 'x' }])
    ws.close()
  })
})

describe('POST /hooks/*', () => {
  test('sem Authorization → 401 e onHook não é chamado', async () => {
    const rec = start()
    const res = await postHook('/hooks/display', JSON.stringify({ delta: 'a' }))
    expect(res.status).toBe(401)
    expect(rec.hooks).toEqual([])
  })

  test('Bearer correto → 200 "{}" e onHook chamado', async () => {
    const rec = start()
    const res = await postHook('/hooks/display', JSON.stringify({ delta: 'a\n' }), `Bearer ${TOKEN}`)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('{}')
    expect(rec.hooks).toEqual([{ tipo: 'display', delta: 'a\n' }])
  })

  test('JSON inválido → 400', async () => {
    start()
    const res = await postHook('/hooks/stop', '{', `Bearer ${TOKEN}`)
    expect(res.status).toBe(400)
  })

  test('rota desconhecida → 404', async () => {
    start()
    const res = await fetch(`http://${base()}/nada`)
    expect(res.status).toBe(404)
  })
})
