import type { FinanceSnapshot } from '../../../src/services/ai/chatProtocol.ts'

export const snap: FinanceSnapshot = {
  cotacaoUsdBrl: 5,
  totais: { bancosBrl: 1000, investimentosBrl: 500, criptoUsd: 100, criptoBrl: 500, emprestimosBrl: 0, patrimonioBrl: 1500 },
  bancos: [{ nome: 'Banco', saldoBrl: 1000, investimentos: [{ nome: 'CDB', tipo: 'Renda fixa', valorBrl: 500 }] }],
  criptos: [],
  emprestimos: [],
  historicoMensal: [],
  diversificacaoPct: { acoes: 0, cripto: 0, rendaFixa: 0, caixa: 0 },
  observacoes: [],
}
