import type { ServerMessage } from './chatProtocol';

export type Conexao = 'sem_token' | 'conectando' | 'conectada' | 'desconectada' | 'recusada' | 'substituida';

export type ChatMensagem = {
  id: number;
  autor: 'voce' | 'claude';
  texto: string;
  estado: 'escrevendo' | 'pronta' | 'erro';
};

export type ChatState = {
  conexao: Conexao;
  ocupado: boolean;
  mensagens: readonly ChatMensagem[];
  proximoId: number;
};

export type ChatAction =
  | { tipo: 'conexao'; conexao: Conexao }
  | { tipo: 'enviada'; texto: string }
  | { tipo: 'servidor'; mensagem: ServerMessage }
  | { tipo: 'limpar' };

export const CHAT_INICIAL: ChatState = { conexao: 'sem_token', ocupado: false, mensagens: [], proximoId: 1 };

const MSG_CONEXAO_CAIU = 'A conexão com a IA caiu.';

const emAndamento = (s: ChatState): ChatMensagem | undefined =>
  s.mensagens.find((m) => m.autor === 'claude' && m.estado === 'escrevendo');

const atualizar = (s: ChatState, id: number, mudanca: Partial<ChatMensagem>): ChatState => ({
  ...s,
  mensagens: s.mensagens.map((m) => (m.id === id ? { ...m, ...mudanca } : m)),
});

const adicionar = (s: ChatState, autor: ChatMensagem['autor'], texto: string, estado: ChatMensagem['estado']): ChatState => ({
  ...s,
  mensagens: [...s.mensagens, { id: s.proximoId, autor, texto, estado }],
  proximoId: s.proximoId + 1,
});

/** Conclui a resposta em andamento (ou cria uma nova, se a conexão voltou no meio) e libera o envio. */
const concluir = (s: ChatState, texto: string, estado: 'pronta' | 'erro'): ChatState => {
  const atual = emAndamento(s);
  const base = atual ? atualizar(s, atual.id, { texto, estado }) : adicionar(s, 'claude', texto, estado);
  return { ...base, ocupado: false };
};

const aplicarServidor = (s: ChatState, msg: ServerMessage): ChatState => {
  switch (msg.type) {
    case 'status':
      return { ...s, ocupado: msg.estado === 'ocupado' };
    case 'parcial': {
      const atual = emAndamento(s);
      return atual ? atualizar(s, atual.id, { texto: atual.texto + msg.texto }) : s;
    }
    case 'final':
      return concluir(s, msg.texto, 'pronta');
    case 'erro':
      return concluir(s, msg.mensagem, 'erro');
  }
};

export const chatReducer = (s: ChatState, action: ChatAction): ChatState => {
  switch (action.tipo) {
    case 'conexao': {
      const caiu = action.conexao !== 'conectada' && emAndamento(s) !== undefined;
      const base = caiu ? concluir(s, MSG_CONEXAO_CAIU, 'erro') : s;
      return { ...base, conexao: action.conexao };
    }
    case 'enviada': {
      const comPergunta = adicionar(s, 'voce', action.texto, 'pronta');
      return { ...adicionar(comPergunta, 'claude', '', 'escrevendo'), ocupado: true };
    }
    case 'servidor':
      return aplicarServidor(s, action.mensagem);
    case 'limpar':
      return { ...s, mensagens: [] };
  }
};
