// Contrato do chat entre o site e o canal MCP (repositório Mcp-Financas: src/chatProtocol.ts).
// Cópia: mantenha os dois arquivos iguais.
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

/**
 * Mensagem do histórico do chat. Fica só na memória do `financas`: volta ao reabrir o chat ou
 * recarregar a página e some quando o terminal fecha. Nada é salvo no navegador.
 */
export type HistoricoMensagem = { autor: 'voce' | 'claude'; texto: string; estado: 'escrevendo' | 'pronta' | 'erro' };
export const MAX_HISTORICO = 100;

/**
 * Canal → aba do site conectada em /presenca (aberta mesmo com o chat fechado). Ao rodar o `financas`
 * com uma aba já aberta, ele pede ao canal para abrir o chat nela em vez de abrir outra aba.
 */
export type PresencaMessage = { type: 'abrir' };

/**
 * Mudanças que a IA propõe nos dados do site (ferramenta `propor_alteracoes`). Nada é aplicado sem o
 * usuário clicar em "Confirmar tudo" no site. Validação em `operacoes.ts` (cópia nos dois repositórios).
 */
export const MAX_OPERACOES = 20;
export type AlvoOperacao = 'banco' | 'investimento' | 'cripto' | 'emprestimo' | 'mes';
export type InvestimentoNovo = { nome: string; tipo: string; valorBrl: number };
export type Operacao =
  | { alvo: 'banco'; acao: 'adicionar'; dados: { nome: string; saldoBrl: number; investimentos?: InvestimentoNovo[] } }
  | { alvo: 'banco'; acao: 'editar'; id: string; dados: { nome?: string; saldoBrl?: number } }
  | { alvo: 'banco'; acao: 'apagar'; id: string }
  | { alvo: 'investimento'; acao: 'adicionar'; bancoId: string; dados: InvestimentoNovo }
  | { alvo: 'investimento'; acao: 'editar'; bancoId: string; id: string; dados: Partial<InvestimentoNovo> }
  | { alvo: 'investimento'; acao: 'apagar'; bancoId: string; id: string }
  | { alvo: 'cripto'; acao: 'adicionar'; dados: { simbolo: string; quantidade: number; precoCompraUsd: number } }
  | { alvo: 'cripto'; acao: 'editar'; id: string; dados: { simbolo?: string; quantidade?: number; precoCompraUsd?: number } }
  | { alvo: 'cripto'; acao: 'apagar'; id: string }
  | { alvo: 'emprestimo'; acao: 'adicionar'; dados: { nome: string; valorBrl: number; taxaJurosPct: number; vencimento: string } }
  | {
      alvo: 'emprestimo';
      acao: 'editar';
      id: string;
      dados: { nome?: string; valorBrl?: number; taxaJurosPct?: number; vencimento?: string };
    }
  | { alvo: 'emprestimo'; acao: 'apagar'; id: string }
  | { alvo: 'mes'; acao: 'definir'; mes: string; dados: { patrimonioBrl: number } }
  | { alvo: 'mes'; acao: 'apagar'; mes: string };
export type Proposta = { id: string; resumo: string; operacoes: Operacao[] };
export type ItemCriado = { alvo: AlvoOperacao; id: string; nome: string };
export type ResultadoDecisao = 'aplicada' | 'recusada' | 'falhou';

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
    id: string;
    nome: string;
    saldoBrl: number;
    investimentos: { id: string; nome: string; tipo: string; valorBrl: number }[];
  }[];
  criptos: {
    id: string;
    simbolo: string;
    quantidade: number;
    precoCompraUsd: number;
    precoAtualUsd: number | null;
    valorAtualUsd: number | null;
    variacaoPct: number | null;
  }[];
  emprestimos: { id: string; nome: string; valorBrl: number; taxaJuros: number; vencimento: string }[];
  historicoMensal: { mes: string; patrimonioBrl: number }[];
  diversificacaoPct: { acoes: number; cripto: number; rendaFixa: number; caixa: number };
  observacoes: string[];
};

export type ClientMessage =
  | { type: 'snapshot'; data: FinanceSnapshot }
  | { type: 'pergunta'; ia: IaId; texto: string }
  | { type: 'preferencias'; preferencias: Preferencias }
  | { type: 'limpar' }
  | { type: 'decisao'; id: string; resultado: ResultadoDecisao; detalhe?: string; criados?: ItemCriado[] };

export type ServerMessage =
  | { type: 'status'; estado: 'pronto' | 'ocupado' }
  | { type: 'sessao'; sessao: Sessao }
  | { type: 'parcial'; texto: string }
  | { type: 'final'; texto: string }
  | { type: 'erro'; mensagem: string }
  | { type: 'historico'; mensagens: HistoricoMensagem[] }
  | { type: 'proposta'; proposta: Proposta }
  | { type: 'proposta_encerrada'; id: string; motivo: 'expirou' };
