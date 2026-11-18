import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SocketLike } from './bridgeClient';
import { createPresenca, presencaUrl } from './presenca';

class FakeSocket implements SocketLike {
  readyState = 0;
  fechadoPeloCliente = false;
  onopen: (() => void) | null = null;
  onclose: ((ev: { code: number }) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  send() {}
  close() { this.readyState = 3; this.fechadoPeloCliente = true; }
  abrir() { this.readyState = 1; this.onopen?.(); }
  fechar(code: number) { this.readyState = 3; this.onclose?.({ code }); }
}

const setup = () => {
  const sockets: FakeSocket[] = [];
  const urls: string[] = [];
  let aberturas = 0;
  const presenca = createPresenca({
    url: 'ws://x/presenca',
    createSocket: (url) => { urls.push(url); const s = new FakeSocket(); sockets.push(s); return s; },
    onAbrir: () => { aberturas += 1; },
  });
  presenca.connect();
  return { presenca, sockets, urls, aberturas: () => aberturas };
};

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('createPresenca', () => {
  it('conecta na URL e abre o chat só com {type:"abrir"}', () => {
    const { sockets, urls, aberturas } = setup();
    expect(urls).toEqual(['ws://x/presenca']);
    sockets[0].abrir();
    sockets[0].onmessage?.({ data: '{"type":"final","texto":"x"}' });
    sockets[0].onmessage?.({ data: '{' });
    sockets[0].onmessage?.({ data: 42 });
    expect(aberturas()).toBe(0);
    sockets[0].onmessage?.({ data: '{"type":"abrir"}' });
    expect(aberturas()).toBe(1);
  });

  it('canal fora do ar: tenta de novo em 1 s, 2 s e depois a cada 3 s', () => {
    const { sockets } = setup();
    sockets[0].fechar(1006);
    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);
    sockets[1].fechar(1006);
    vi.advanceTimersByTime(2000);
    expect(sockets).toHaveLength(3);
    sockets[2].fechar(1006);
    vi.advanceTimersByTime(3000);
    expect(sockets).toHaveLength(4);
    sockets[3].fechar(1006);
    vi.advanceTimersByTime(3000);
    expect(sockets).toHaveLength(5);
  });

  it('depois de conectar, a espera volta para 1 s', () => {
    const { sockets } = setup();
    sockets[0].fechar(1006);
    vi.advanceTimersByTime(1000);
    sockets[1].fechar(1006);
    vi.advanceTimersByTime(2000);
    sockets[2].abrir();
    sockets[2].fechar(1006);
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(4);
  });

  it('token inválido (4001): não tenta de novo', () => {
    const { sockets } = setup();
    sockets[0].fechar(4001);
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });

  it('close() fecha o socket e não reconecta', () => {
    const { presenca, sockets } = setup();
    sockets[0].abrir();
    presenca.close();
    expect(sockets[0].fechadoPeloCliente).toBe(true);
    sockets[0].fechar(1000);
    vi.advanceTimersByTime(60_000);
    expect(sockets).toHaveLength(1);
  });
});

describe('presencaUrl', () => {
  it('aponta para /presenca no canal local com o token codificado', () =>
    expect(presencaUrl('a b')).toBe('ws://127.0.0.1:8790/presenca?token=a%20b'));
});
