import {
  DEFAULT_BRIDGE_PORT,
  MAX_HISTORICO,
  type ClientMessage,
  type HistoricoMensagem,
  type Proposta,
  type ServerMessage,
} from './chatProtocol';
import { validarOperacoes } from './operacoes';
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

const AUTORES: readonly unknown[] = ['voce', 'claude'];
const ESTADOS: readonly unknown[] = ['escrevendo', 'pronta', 'erro'];

const ehMensagemDoHistorico = (v: unknown): v is HistoricoMensagem =>
  isObject(v) && AUTORES.includes(v.autor) && typeof v.texto === 'string' && ESTADOS.includes(v.estado);

const MAX_ID_PROPOSTA = 100;
const MAX_RESUMO = 300;

const textoAte = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** Proposta de alteração vinda do canal: validada de novo aqui (nunca confiar no que chega). */
const parseProposta = (v: unknown): Proposta | null => {
  if (!isObject(v) || !textoAte(v.id, MAX_ID_PROPOSTA) || !textoAte(v.resumo, MAX_RESUMO)) return null;
  const validacao = validarOperacoes(v.operacoes);
  return validacao.ok ? { id: v.id, resumo: v.resumo.trim(), operacoes: validacao.operacoes } : null;
};

/** Histórico guardado no `financas`: só as mensagens válidas, no máximo MAX_HISTORICO (as mais recentes). */
const parseHistorico = (mensagens: unknown[]): HistoricoMensagem[] =>
  mensagens
    .filter(ehMensagemDoHistorico)
    .slice(-MAX_HISTORICO)
    .map(({ autor, texto, estado }) => ({ autor, texto, estado }));

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
  if (m.type === 'sessao' && isObject(m.sessao)) {
    const { modelo, esforco } = m.sessao;
    if (typeof modelo === 'string' && typeof esforco === 'string') return { type: 'sessao', sessao: { modelo, esforco } };
  }
  if (m.type === 'historico' && Array.isArray(m.mensagens)) return { type: 'historico', mensagens: parseHistorico(m.mensagens) };
  if (m.type === 'proposta') {
    const proposta = parseProposta(m.proposta);
    return proposta ? { type: 'proposta', proposta } : null;
  }
  if (m.type === 'proposta_encerrada' && textoAte(m.id, MAX_ID_PROPOSTA) && m.motivo === 'expirou') {
    return { type: 'proposta_encerrada', id: m.id, motivo: 'expirou' };
  }
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
