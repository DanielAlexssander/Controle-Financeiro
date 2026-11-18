import { describe, it, expect } from 'vitest';
import { buildSnapshot } from './buildSnapshot';
import type { FinanceData } from '../../types/index';

const data: FinanceData = {
  banks: [{ id: 'b1', name: 'Banco', balance: 1000, investments: [{ id: 'i1', name: 'CDB', amount: 500, type: 'Renda fixa' }] }],
  cryptos: [
    { id: 'c1', symbol: 'BTC', amount: 0.1, purchasePrice: 30000 },
    { id: 'c2', symbol: 'ETH', amount: 1, purchasePrice: 2000 },
  ],
  loans: [{ id: 'l1', name: 'Empréstimo', amount: 200, interestRate: 1.5, dueDate: '2026-12-01' }],
  monthlyGrowth: [{ month: '2026-10', totalPatrimony: 25000 }],
  diversification: { stocks: 10, crypto: 50, fixedIncome: 30, cash: 10 },
};

describe('buildSnapshot', () => {
  it('totais seguem a conta do Dashboard', () => {
    const s = buildSnapshot(data, { BTC: 50000, ETH: 0 }, 5);
    expect(s.totais).toEqual({ bancosBrl: 1000, investimentosBrl: 500, criptoUsd: 5000, criptoBrl: 25000, emprestimosBrl: 200, patrimonioBrl: 26200 });
  });

  it('cripto com preço 0 vai como null e fica fora dos totais', () => {
    const eth = buildSnapshot(data, { BTC: 50000, ETH: 0 }, 5).criptos.find(c => c.simbolo === 'ETH');
    expect(eth).toEqual({ id: 'c2', simbolo: 'ETH', quantidade: 1, precoCompraUsd: 2000, precoAtualUsd: null, valorAtualUsd: null, variacaoPct: null });
  });

  it('cripto sem preço na tabela também vai como null', () =>
    expect(buildSnapshot(data, { BTC: 50000 }, 5).criptos[1].precoAtualUsd).toBeNull());

  it('variação percentual arredondada em 2 casas', () =>
    expect(buildSnapshot(data, { BTC: 50000 }, 5).criptos[0].variacaoPct).toBe(66.67));

  it('mapeia bancos, empréstimos, histórico e diversificação', () => {
    const s = buildSnapshot(data, {}, 5);
    expect(s.cotacaoUsdBrl).toBe(5);
    expect(s.bancos).toEqual([{ id: 'b1', nome: 'Banco', saldoBrl: 1000, investimentos: [{ id: 'i1', nome: 'CDB', tipo: 'Renda fixa', valorBrl: 500 }] }]);
    expect(s.emprestimos).toEqual([{ id: 'l1', nome: 'Empréstimo', valorBrl: 200, taxaJuros: 1.5, vencimento: '2026-12-01' }]);
    expect(s.historicoMensal).toEqual([{ mes: '2026-10', patrimonioBrl: 25000 }]);
    expect(s.diversificacaoPct).toEqual({ acoes: 10, cripto: 50, rendaFixa: 30, caixa: 10 });
  });

  it('explica a conta do patrimônio em observacoes', () =>
    expect(buildSnapshot(data, {}, 5).observacoes).toContain(
      'patrimonioBrl = saldo dos bancos + cripto em BRL + empréstimos (mesma conta do Dashboard)'));

  it('não altera os dados de entrada', () => {
    const copia = structuredClone(data);
    buildSnapshot(data, { BTC: 50000 }, 5);
    expect(data).toEqual(copia);
  });
});
