import type { HistoricoMensagem, Proposta, ServerMessage, Sessao } from './chatProtocol';

export type Conexao = 'sem_token' | 'conectando' | 'conectada' | 'desconectada' | 'recusada' | 'substituida';

export type StatusProposta = 'pendente' | 'aplicada' | 'recusada' | 'expirou' | 'falhou';

/** Proposta de alteração dos dados mostrada como cartão dentro da resposta da IA. */
export type PropostaNaTela = { proposta: Proposta; status: StatusProposta; detalhe?: string };

export type ChatMensagem = {
  id: number;
  autor: 'voce' | 'claude';
  texto: string;
  estado: 'escrevendo' | 'pronta' | 'erro';
  proposta?: PropostaNaTela;
};

export type ChatState = {
  conexao: Conexao;
  ocupado: boolean;
  mensagens: readonly ChatMensagem[];
  proximoId: number;
  /** Modelo/esforço com que a sessão aberta foi iniciada (informado pelo canal). */
  sessao: Sessao | null;
};

export type ChatAction =
  | { tipo: 'conexao'; conexao: Conexao }
  | { tipo: 'enviada'; texto: string }
  | { tipo: 'servidor'; mensagem: ServerMessage }
  | { tipo: 'limpar' }
  | { tipo: 'proposta_status'; id: string; status: StatusProposta; detalhe?: string };

export const CHAT_INICIAL: ChatState = {
  conexao: 'sem_token',
  ocupado: false,
  mensagens: [],
  proximoId: 1,
  sessao: null,
};

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

/** O `financas` manda o histórico ao conectar: ele é a fonte da verdade e substitui o que está na tela. */
const restaurar = (s: ChatState, mensagens: readonly HistoricoMensagem[]): ChatState => ({
  ...s,
  mensagens: mensagens.map((m, i) => ({ id: i + 1, ...m })),
  proximoId: mensagens.length + 1,
});

const comProposta = (s: ChatState, id: string): ChatMensagem | undefined =>
  s.mensagens.find((m) => m.proposta?.proposta.id === id);

/** Mostra a proposta na resposta em andamento (ou numa nova). Reenvio da mesma proposta não duplica. */
const receberProposta = (s: ChatState, proposta: Proposta): ChatState => {
  if (comProposta(s, proposta.id)) return s;
  const naTela: PropostaNaTela = { proposta, status: 'pendente' };
  const atual = emAndamento(s);
  if (atual) return atualizar(s, atual.id, { proposta: naTela });
  const nova = adicionar(s, 'claude', '', 'escrevendo');
  return atualizar(nova, s.proximoId, { proposta: naTela });
};

const mudarStatusProposta = (s: ChatState, id: string, status: StatusProposta, detalhe?: string): ChatState => {
  const m = comProposta(s, id);
  if (!m?.proposta) return s;
  const proposta: PropostaNaTela = detalhe === undefined ? { ...m.proposta, status } : { ...m.proposta, status, detalhe };
  return atualizar(s, m.id, { proposta });
};

const aplicarServidor = (s: ChatState, msg: ServerMessage): ChatState => {
  switch (msg.type) {
    case 'status':
      return { ...s, ocupado: msg.estado === 'ocupado' };
    case 'sessao':
      return { ...s, sessao: { ...msg.sessao } };
    case 'historico':
      return restaurar(s, msg.mensagens);
    case 'proposta':
      return receberProposta(s, msg.proposta);
    case 'proposta_encerrada':
      return comProposta(s, msg.id)?.proposta?.status === 'pendente' ? mudarStatusProposta(s, msg.id, 'expirou') : s;
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
    case 'proposta_status':
      return mudarStatusProposta(s, action.id, action.status, action.detalhe);
  }
};
