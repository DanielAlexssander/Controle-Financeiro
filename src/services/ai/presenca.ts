import type { SocketLike } from './bridgeClient';
import { DEFAULT_BRIDGE_PORT, type PresencaMessage } from './chatProtocol';

// Conexão leve que avisa ao canal local que esta aba do site está aberta (mesmo com o chat fechado).
// Ao rodar o `financas`, ele pede ao canal para abrir o chat aqui em vez de abrir outra aba.
// Só existe para quem tem o token do chat (visitantes do site não se conectam a nada).

const CLOSE_TOKEN_INVALIDO = 4001;
/** Curto de propósito: o `financas` espera ~5 s por uma aba aberta antes de abrir outra. */
const DEFAULT_RETRY_DELAYS_MS = [1000, 2000, 3000] as const;

export const presencaUrl = (token: string): string =>
  `ws://127.0.0.1:${DEFAULT_BRIDGE_PORT}/presenca?token=${encodeURIComponent(token)}`;

const ehPedidoDeAbrir = (data: unknown): boolean => {
  if (typeof data !== 'string') return false;
  try {
    const msg = JSON.parse(data) as Partial<PresencaMessage> | null;
    return msg?.type === 'abrir';
  } catch {
    return false;
  }
};

export type PresencaOptions = {
  url: string;
  createSocket?: (url: string) => SocketLike;
  onAbrir(): void;
  retryDelaysMs?: readonly number[];
};

export type Presenca = { connect(): void; close(): void };

const defaultSocket = (url: string): SocketLike => new WebSocket(url) as unknown as SocketLike;

export const createPresenca = (opts: PresencaOptions): Presenca => {
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

  function conectar() {
    timer = null;
    const s = createSocket(opts.url);
    socket = s;
    s.onopen = () => { tentativa = 0; };
    s.onmessage = (ev) => { if (ehPedidoDeAbrir(ev.data)) opts.onAbrir(); };
    s.onclose = (ev) => {
      socket = null;
      if (!encerrado && ev.code !== CLOSE_TOKEN_INVALIDO) agendar();
    };
  }

  return {
    connect: () => {
      encerrado = false;
      conectar();
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
