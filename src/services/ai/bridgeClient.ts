import { DEFAULT_BRIDGE_PORT, type ClientMessage, type ServerMessage } from './chatProtocol';
import type { Conexao } from './chatReducer';

export type SocketLike = {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: (() => void) | null;
  onclose: ((ev: { code: number }) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
};

export type BridgeClientOptions = {
  url: string;
  createSocket?: (url: string) => SocketLike;
  onServerMessage(m: ServerMessage): void;
  onConexao(c: Conexao): void;
  retryDelaysMs?: readonly number[];
};

export type BridgeClient = { connect(): void; send(m: ClientMessage): boolean; close(): void };

const OPEN = 1;
const CLOSE_SUBSTITUIDA = 4000;
const CLOSE_TOKEN_INVALIDO = 4001;
const DEFAULT_RETRY_DELAYS_MS = [1000, 2000, 5000, 10000] as const;

export const bridgeUrl = (token: string): string =>
  `ws://127.0.0.1:${DEFAULT_BRIDGE_PORT}/chat?token=${encodeURIComponent(token)}`;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Valida o que vem do canal. Qualquer coisa fora do protocolo vira null. */
export const parseServerMessage = (raw: string): ServerMessage | null => {
  let m: unknown;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(m)) return null;
  if (m.type === 'status' && (m.estado === 'pronto' || m.estado === 'ocupado')) return { type: 'status', estado: m.estado };
  if ((m.type === 'parcial' || m.type === 'final') && typeof m.texto === 'string') return { type: m.type, texto: m.texto };
  if (m.type === 'erro' && typeof m.mensagem === 'string') return { type: 'erro', mensagem: m.mensagem };
  return null;
};

const defaultSocket = (url: string): SocketLike => new WebSocket(url) as unknown as SocketLike;

/** Conexão com o canal local, com reconexão automática. Não fala com o modelo: só com o canal. */
export const createBridgeClient = (opts: BridgeClientOptions): BridgeClient => {
  const createSocket = opts.createSocket ?? defaultSocket;
  const delays = opts.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  let socket: SocketLike | null = null;
  let tentativa = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let encerrado = false;

  const agendar = () => {
    const atraso = delays[Math.min(tentativa, delays.length - 1)];
    tentativa += 1;
    timer = setTimeout(conectar, atraso);
  };

  const aoFechar = (code: number) => {
    socket = null;
    if (encerrado) return;
    if (code === CLOSE_TOKEN_INVALIDO) return opts.onConexao('recusada');
    if (code === CLOSE_SUBSTITUIDA) return opts.onConexao('substituida');
    opts.onConexao('desconectada');
    agendar();
  };

  function conectar() {
    timer = null;
    opts.onConexao('conectando');
    const s = createSocket(opts.url);
    socket = s;
    s.onopen = () => {
      tentativa = 0;
      opts.onConexao('conectada');
    };
    s.onmessage = (ev) => {
      const msg = typeof ev.data === 'string' ? parseServerMessage(ev.data) : null;
      if (msg) opts.onServerMessage(msg);
    };
    s.onclose = (ev) => aoFechar(ev.code);
  }

  return {
    connect: () => {
      encerrado = false;
      conectar();
    },
    send: (m) => {
      if (!socket || socket.readyState !== OPEN) return false;
      socket.send(JSON.stringify(m));
      return true;
    },
    close: () => {
      encerrado = true;
      if (timer) clearTimeout(timer);
      timer = null;
      socket?.close();
      socket = null;
    },
  };
};
