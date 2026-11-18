// Protocolo do chat de IA, compartilhado entre o site e o canal MCP (mcp/financas-channel).
// Só tipos e constantes: nenhum código de runtime aqui.

export const DEFAULT_BRIDGE_PORT = 8790;
export const MAX_PERGUNTA_CHARS = 4000;
export const MAX_SNAPSHOT_BYTES = 200_000;

export type IaId = 'claude';

export const MODELOS = ['sonnet', 'opus', 'haiku'] as const;
export type Modelo = (typeof MODELOS)[number];
export const ESFORCOS = ['low', 'medium', 'high'] as const;
export type Esforco = (typeof ESFORCOS)[number];
export type Preferencias = { modelo: Modelo; esforco: Esforco };
export const PREFERENCIAS_PADRAO: Preferencias = { modelo: 'sonnet', esforco: 'medium' };

/** Modelo e esforço com que a sessão aberta foi iniciada. */
export type Sessao = { modelo: string; esforco: string };

export type FinanceSnapshot = {
  cotacaoUsdBrl: number;
  totais: {
    bancosBrl: number;
    investimentosBrl: number;
    criptoUsd: number;
    criptoBrl: number;
    emprestimosBrl: number;
    patrimonioBrl: number;
  };
  bancos: {
    nome: string;
    saldoBrl: number;
    investimentos: { nome: string; tipo: string; valorBrl: number }[];
  }[];
  criptos: {
    simbolo: string;
    quantidade: number;
    precoCompraUsd: number;
    precoAtualUsd: number | null;
    valorAtualUsd: number | null;
    variacaoPct: number | null;
  }[];
  emprestimos: { nome: string; valorBrl: number; taxaJuros: number; vencimento: string }[];
  historicoMensal: { mes: string; patrimonioBrl: number }[];
  diversificacaoPct: { acoes: number; cripto: number; rendaFixa: number; caixa: number };
  observacoes: string[];
};

export type ClientMessage =
  | { type: 'snapshot'; data: FinanceSnapshot }
  | { type: 'pergunta'; ia: IaId; texto: string }
  | { type: 'preferencias'; preferencias: Preferencias };

export type ServerMessage =
  | { type: 'status'; estado: 'pronto' | 'ocupado' }
  | { type: 'sessao'; sessao: Sessao }
  | { type: 'parcial'; texto: string }
  | { type: 'final'; texto: string }
  | { type: 'erro'; mensagem: string };
