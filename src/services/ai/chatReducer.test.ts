import { describe, it, expect } from 'vitest';
import { CHAT_INICIAL, chatReducer, type ChatState } from './chatReducer';
import type { ServerMessage } from './chatProtocol';

const enviar = (s: ChatState, texto = 'oi') => chatReducer(s, { tipo: 'enviada', texto });
const servidor = (s: ChatState, mensagem: ServerMessage) =>
  chatReducer(s, { tipo: 'servidor', mensagem });

describe('chatReducer', () => {
  it('começa sem token e sem mensagens', () =>
    expect(CHAT_INICIAL).toEqual({ conexao: 'sem_token', ocupado: false, mensagens: [], proximoId: 1 }));

  it('enviada cria a pergunta e uma resposta "escrevendo", e marca ocupado', () => {
    const s = enviar(CHAT_INICIAL, 'Quanto tenho?');
    expect(s.ocupado).toBe(true);
    expect(s.mensagens).toEqual([
      { id: 1, autor: 'voce', texto: 'Quanto tenho?', estado: 'pronta' },
      { id: 2, autor: 'claude', texto: '', estado: 'escrevendo' },
    ]);
    expect(s.proximoId).toBe(3);
  });

  it('parcial concatena na resposta em andamento', () => {
    const s = servidor(servidor(enviar(CHAT_INICIAL), { type: 'parcial', texto: 'a\n' }), { type: 'parcial', texto: 'b\n' });
    expect(s.mensagens[1].texto).toBe('a\nb\n');
  });

  it('final substitui o texto, marca pronta e libera', () => {
    const s = servidor(servidor(enviar(CHAT_INICIAL), { type: 'parcial', texto: 'a' }), { type: 'final', texto: 'Resposta' });
    expect(s.mensagens[1]).toEqual({ id: 2, autor: 'claude', texto: 'Resposta', estado: 'pronta' });
    expect(s.ocupado).toBe(false);
  });

  it('erro com resposta em andamento vira mensagem de erro e libera', () => {
    const s = servidor(enviar(CHAT_INICIAL), { type: 'erro', mensagem: 'Limite' });
    expect(s.mensagens[1]).toEqual({ id: 2, autor: 'claude', texto: 'Limite', estado: 'erro' });
    expect(s.ocupado).toBe(false);
  });

  it('erro sem resposta em andamento vira nova mensagem de erro', () => {
    const s = servidor(CHAT_INICIAL, { type: 'erro', mensagem: 'Mensagem inválida.' });
    expect(s.mensagens).toEqual([{ id: 1, autor: 'claude', texto: 'Mensagem inválida.', estado: 'erro' }]);
  });

  it('conexão cai com resposta em andamento → erro e libera', () => {
    const s = chatReducer(enviar(CHAT_INICIAL), { tipo: 'conexao', conexao: 'desconectada' });
    expect(s.conexao).toBe('desconectada');
    expect(s.mensagens[1]).toMatchObject({ texto: 'A conexão com a IA caiu.', estado: 'erro' });
    expect(s.ocupado).toBe(false);
  });

  it('final sem resposta em andamento (reconectou no meio) → nova mensagem pronta do claude', () => {
    const s = servidor(CHAT_INICIAL, { type: 'final', texto: 'R' });
    expect(s.mensagens.at(-1)).toMatchObject({ autor: 'claude', texto: 'R', estado: 'pronta' });
  });

  it('parcial sem resposta em andamento é ignorado', () =>
    expect(servidor(CHAT_INICIAL, { type: 'parcial', texto: 'x' })).toEqual(CHAT_INICIAL));

  it('status ocupado/pronto ajusta ocupado', () => {
    const s = servidor(CHAT_INICIAL, { type: 'status', estado: 'ocupado' });
    expect(s.ocupado).toBe(true);
    expect(servidor(s, { type: 'status', estado: 'pronto' }).ocupado).toBe(false);
  });

  it('limpar apaga as mensagens e mantém a conexão', () => {
    const conectado = chatReducer(CHAT_INICIAL, { tipo: 'conexao', conexao: 'conectada' });
    const s = chatReducer(enviar(conectado), { tipo: 'limpar' });
    expect(s.mensagens).toEqual([]);
    expect(s.conexao).toBe('conectada');
  });

  it('reducer não muta o estado anterior', () => {
    const antes = enviar(CHAT_INICIAL);
    const copia = structuredClone(antes);
    servidor(antes, { type: 'parcial', texto: 'x' });
    expect(antes).toEqual(copia);
  });
});
