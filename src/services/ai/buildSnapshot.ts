import type { Crypto, FinanceData } from '../../types/index';
import type { FinanceSnapshot } from './chatProtocol';

type CriptoSnapshot = FinanceSnapshot['criptos'][number];

const OBSERVACOES = [
  'patrimonioBrl = saldo dos bancos + cripto em BRL + empréstimos (mesma conta do Dashboard)',
  'investimentosBrl é informativo e não entra no patrimonioBrl (o Dashboard também não soma)',
  'criptos com precoAtualUsd null estão sem cotação no momento e ficam fora dos totais',
];

const round2 = (x: number): number => Math.round(x * 100) / 100;

const sum = (values: readonly number[]): number => values.reduce((acc, v) => acc + v, 0);

const criptoSnapshot = (crypto: Crypto, pricesUsd: Readonly<Record<string, number>>): CriptoSnapshot => {
  const preco = pricesUsd[crypto.symbol];
  const temPreco = typeof preco === 'number' && preco > 0;
  return {
    id: crypto.id,
    simbolo: crypto.symbol,
    quantidade: crypto.amount,
    precoCompraUsd: crypto.purchasePrice,
    precoAtualUsd: temPreco ? preco : null,
    valorAtualUsd: temPreco ? round2(crypto.amount * preco) : null,
    variacaoPct: temPreco && crypto.purchasePrice > 0
      ? round2(((preco - crypto.purchasePrice) / crypto.purchasePrice) * 100)
      : null,
  };
};

/** Resumo compacto dos dados do site para a IA. Não altera `data`. */
export const buildSnapshot = (
  data: FinanceData,
  pricesUsd: Readonly<Record<string, number>>,
  usdToBrl: number,
): FinanceSnapshot => {
  const criptos = data.cryptos.map((c) => criptoSnapshot(c, pricesUsd));
  const bancosBrl = round2(sum(data.banks.map((b) => b.balance)));
  const investimentosBrl = round2(sum(data.banks.flatMap((b) => b.investments.map((i) => i.amount))));
  const criptoUsd = round2(sum(criptos.map((c) => c.valorAtualUsd ?? 0)));
  const criptoBrl = round2(criptoUsd * usdToBrl);
  const emprestimosBrl = round2(sum(data.loans.map((l) => l.amount)));

  return {
    cotacaoUsdBrl: usdToBrl,
    totais: {
      bancosBrl,
      investimentosBrl,
      criptoUsd,
      criptoBrl,
      emprestimosBrl,
      patrimonioBrl: round2(bancosBrl + criptoBrl + emprestimosBrl),
    },
    bancos: data.banks.map((b) => ({
      id: b.id,
      nome: b.name,
      saldoBrl: b.balance,
      investimentos: b.investments.map((i) => ({ id: i.id, nome: i.name, tipo: i.type, valorBrl: i.amount })),
    })),
    criptos,
    emprestimos: data.loans.map((l) => ({
      id: l.id,
      nome: l.name,
      valorBrl: l.amount,
      taxaJuros: l.interestRate,
      vencimento: l.dueDate,
    })),
    historicoMensal: data.monthlyGrowth.map((g) => ({ mes: g.month, patrimonioBrl: g.totalPatrimony })),
    diversificacaoPct: {
      acoes: data.diversification.stocks,
      cripto: data.diversification.crypto,
      rendaFixa: data.diversification.fixedIncome,
      caixa: data.diversification.cash,
    },
    observacoes: [...OBSERVACOES],
  };
};
