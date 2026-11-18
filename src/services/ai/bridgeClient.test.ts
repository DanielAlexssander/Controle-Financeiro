import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bridgeUrl, createBridgeClient, parseServerMessage, type SocketLike } from './bridgeClient';
import type { Conexao } from './chatReducer';
import type { ServerMessage } from './chatProtocol';

class FakeSocket implements SocketLike {
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: ((ev: { code: number }) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; }
  abrir() { this.readyState = 1; this.onopen?.(); }
  fechar(code: number) { this.readyState = 3; this.onclose?.({ code }); }
}

const setup = () => {
  const sockets: FakeSocket[] = [];
  const conexoes: Conexao[] = [];
  const recebidas: ServerMessage[] = [];
  const client = createBridgeClient({
    url: 'ws://x',
    createSocket: () => { const s = new FakeSocket(); sockets.push(s); return s; },
    onServerMessage: (m) => { recebidas.push(m); },
    onConexao: (c) => { conexoes.push(c); },
  });
  client.connect();
  return { client, sockets, conexoes, recebidas };
};

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('createBridgeClient', () => {
  it('abre → conectada; mensagens válidas vão para onServerMessage; inválidas são ignoradas', () => {
    const { sockets, conexoes, recebidas } = setup();
    expect(conexoes).toEqual(['conectando']);
    sockets[0].abrir();
    sockets[0].onmessage?.({ data: '{"type":"parcial","texto":"a"}' });
    sockets[0].onmessage?.({ data: '{"type":"outro"}' });
    sockets[0].onmessage?.({ data: '{' });
    expect(conexoes).toEqual(['conectando', 'conectada']);
    expect(recebidas).toEqual([{ type: 'parcial', texto: 'a' }]);
  });

  it('queda comum → desconectada e nova tentativa após 1000 ms, depois 2000 ms', () => {
    const { sockets, conexoes } = setup();
    sockets[0].fechar(1006);
    expect(conexoes.at(-1)).toBe('desconectada');
    vi.advanceTimersByTime(999);
    expect(sockets.length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(sockets.length).toBe(2);
    sockets[1].fechar(1006);
    vi.advanceTimersByTime(1999);
    expect(sockets.length).toBe(2);
    vi.advanceTimersByTime(1);
    expect(sockets.length).toBe(3);
  });

  it('conectar com sucesso zera o atraso das tentativas', () => {
    const { sockets } = setup();
    sockets[0].fechar(1006);
    vi.advanceTimersByTime(1000);
    sockets[1].abrir();
    sockets[1].fechar(1006);
    vi.advanceTimersByTime(1000);
    expect(sockets.length).toBe(3);
  });

  it('fechamento 4001 → recusada e não tenta de novo', () => {
    const { sockets, conexoes } = setup();
    sockets[0].fechar(4001);
    vi.advanceTimersByTime(60_000);
    expect(conexoes.at(-1)).toBe('recusada');
    expect(sockets.length).toBe(1);
  });

  it('fechamento 4000 → substituida e não tenta de novo', () => {
    const { sockets, conexoes } = setup();
    sockets[0].abrir();
    sockets[0].fechar(4000);
    vi.advanceTimersByTime(60_000);
    expect(conexoes.at(-1)).toBe('substituida');
    expect(sockets.length).toBe(1);
  });

  it('close() não agenda nova tentativa', () => {
    const { client, sockets } = setup();
    sockets[0].abrir();
    client.close();
    sockets[0].fechar(1000);
    vi.advanceTimersByTime(60_000);
    expect(sockets.length).toBe(1);
  });

  it('send com socket aberto envia JSON; fechado devolve false', () => {
    const { client, sockets } = setup();
    expect(client.send({ type: 'pergunta', ia: 'claude', texto: 'oi' })).toBe(false);
    sockets[0].abrir();
    expect(client.send({ type: 'pergunta', ia: 'claude', texto: 'oi' })).toBe(true);
    expect(sockets[0].sent).toEqual(['{"type":"pergunta","ia":"claude","texto":"oi"}']);
  });
});

describe('helpers', () => {
  it('bridgeUrl codifica o token', () =>
    expect(bridgeUrl('a b')).toBe('ws://127.0.0.1:8790/chat?token=a%20b'));

  it('parseServerMessage aceita os 4 tipos e rejeita o resto', () => {
    expect(parseServerMessage('{"type":"status","estado":"pronto"}')).toEqual({ type: 'status', estado: 'pronto' });
    expect(parseServerMessage('{"type":"final","texto":"x"}')).toEqual({ type: 'final', texto: 'x' });
    expect(parseServerMessage('{"type":"erro","mensagem":"m"}')).toEqual({ type: 'erro', mensagem: 'm' });
    expect(parseServerMessage('{"type":"status","estado":"outro"}')).toBeNull();
    expect(parseServerMessage('{"type":"parcial","texto":1}')).toBeNull();
    expect(parseServerMessage('null')).toBeNull();
  });
});
