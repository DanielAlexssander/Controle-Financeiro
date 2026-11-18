import { describe, expect, it } from 'vitest';
import type { FinanceData } from '../../types/index';
import { aplicarOperacoes } from './aplicarOperacoes';
import type { Operacao } from './chatProtocol';

const DADOS: FinanceData = {
  banks: [{ id: 'b1', name: 'Nubank', balance: 1000, investments: [{ id: 'i1', name: 'CDB', amount: 500, type: 'Renda fixa' }] }],
  cryptos: [{ id: 'c1', symbol: 'BTC', amount: 0.1, purchasePrice: 60000 }],
  loans: [{ id: 'e1', name: 'João', amount: 500, interestRate: 2, dueDate: '2026-12-31' }],
  monthlyGrowth: [{ month: '10/2026', totalPatrimony: 100000 }],
  diversification: { stocks: 0, crypto: 0, fixedIncome: 0, cash: 0 },
};

const ids = () => {
  let n = 0;
  return () => `novo${++n}`;
};

const aplicar = (...ops: Operacao[]) => {
  const r = aplicarOperacoes(DADOS, ops, ids());
  if (!r.ok) throw new Error(r.erro);
  return r;
};

describe('aplicarOperacoes', () => {
  it('banco: adicionar (com investimentos), editar e apagar', () => {
    const add = aplicar({ alvo: 'banco', acao: 'adicionar', dados: { nome: 'Inter', saldoBrl: 2000, investimentos: [{ nome: 'LCI', tipo: 'Renda fixa', valorBrl: 300 }] } });
    expect(add.dados.banks.at(-1)).toEqual({ id: 'novo1', name: 'Inter', balance: 2000, investments: [{ id: 'novo2', name: 'LCI', amount: 300, type: 'Renda fixa' }] });
    expect(add.criados).toEqual([{ alvo: 'banco', id: 'novo1', nome: 'Inter' }, { alvo: 'investimento', id: 'novo2', nome: 'LCI' }]);
    expect(aplicar({ alvo: 'banco', acao: 'editar', id: 'b1', dados: { saldoBrl: 1500 } }).dados.banks[0])
      .toEqual({ ...DADOS.banks[0], balance: 1500 });
    expect(aplicar({ alvo: 'banco', acao: 'apagar', id: 'b1' }).dados.banks).toEqual([]);
  });

  it('investimento: adicionar, editar e apagar dentro do banco', () => {
    expect(aplicar({ alvo: 'investimento', acao: 'adicionar', bancoId: 'b1', dados: { nome: 'PETR4', tipo: 'Ações', valorBrl: 100 } }).dados.banks[0].investments)
      .toEqual([DADOS.banks[0].investments[0], { id: 'novo1', name: 'PETR4', amount: 100, type: 'Ações' }]);
    expect(aplicar({ alvo: 'investimento', acao: 'editar', bancoId: 'b1', id: 'i1', dados: { valorBrl: 700 } }).dados.banks[0].investments[0])
      .toEqual({ id: 'i1', name: 'CDB', amount: 700, type: 'Renda fixa' });
    expect(aplicar({ alvo: 'investimento', acao: 'apagar', bancoId: 'b1', id: 'i1' }).dados.banks[0].investments).toEqual([]);
  });

  it('cripto: adicionar, editar e apagar', () => {
    const add = aplicar({ alvo: 'cripto', acao: 'adicionar', dados: { simbolo: 'ETH', quantidade: 2, precoCompraUsd: 3000 } });
    expect(add.dados.cryptos.at(-1)).toEqual({ id: 'novo1', symbol: 'ETH', amount: 2, purchasePrice: 3000 });
    expect(add.criados).toEqual([{ alvo: 'cripto', id: 'novo1', nome: 'ETH' }]);
    expect(aplicar({ alvo: 'cripto', acao: 'editar', id: 'c1', dados: { quantidade: 0.15 } }).dados.cryptos[0])
      .toEqual({ id: 'c1', symbol: 'BTC', amount: 0.15, purchasePrice: 60000 });
    expect(aplicar({ alvo: 'cripto', acao: 'apagar', id: 'c1' }).dados.cryptos).toEqual([]);
  });

  it('empréstimo: adicionar, editar e apagar', () => {
    expect(aplicar({ alvo: 'emprestimo', acao: 'adicionar', dados: { nome: 'Ana', valorBrl: 300, taxaJurosPct: 1, vencimento: '2027-01-10' } }).dados.loans.at(-1))
      .toEqual({ id: 'novo1', name: 'Ana', amount: 300, interestRate: 1, dueDate: '2027-01-10' });
    expect(aplicar({ alvo: 'emprestimo', acao: 'editar', id: 'e1', dados: { vencimento: '2027-02-01' } }).dados.loans[0].dueDate).toBe('2027-02-01');
    expect(aplicar({ alvo: 'emprestimo', acao: 'apagar', id: 'e1' }).dados.loans).toEqual([]);
  });

  it('mês: definir cria ou substitui; apagar remove', () => {
    expect(aplicar({ alvo: 'mes', acao: 'definir', mes: '11/2026', dados: { patrimonioBrl: 120000 } }).dados.monthlyGrowth)
      .toEqual([...DADOS.monthlyGrowth, { month: '11/2026', totalPatrimony: 120000 }]);
    expect(aplicar({ alvo: 'mes', acao: 'definir', mes: '10/2026', dados: { patrimonioBrl: 90000 } }).dados.monthlyGrowth)
      .toEqual([{ month: '10/2026', totalPatrimony: 90000 }]);
    expect(aplicar({ alvo: 'mes', acao: 'apagar', mes: '10/2026' }).dados.monthlyGrowth).toEqual([]);
  });

  it('não altera os dados originais', () => {
    const copia = structuredClone(DADOS);
    aplicar({ alvo: 'banco', acao: 'editar', id: 'b1', dados: { nome: 'X' } }, { alvo: 'cripto', acao: 'apagar', id: 'c1' });
    expect(DADOS).toEqual(copia);
  });

  it('item inexistente: falha citando a operação e não aplica nada (tudo ou nada)', () => {
    const r = aplicarOperacoes(DADOS, [
      { alvo: 'cripto', acao: 'apagar', id: 'c1' },
      { alvo: 'banco', acao: 'editar', id: 'b9', dados: { saldoBrl: 1 } },
    ], ids());
    expect(r).toEqual({ ok: false, erro: 'operação 2: banco b9 não existe' });
  });

  it.each([
    [{ alvo: 'investimento', acao: 'apagar', bancoId: 'b9', id: 'i1' }, 'operação 1: banco b9 não existe'],
    [{ alvo: 'investimento', acao: 'apagar', bancoId: 'b1', id: 'i9' }, 'operação 1: investimento i9 não existe no banco Nubank'],
    [{ alvo: 'emprestimo', acao: 'apagar', id: 'e9' }, 'operação 1: empréstimo e9 não existe'],
    [{ alvo: 'mes', acao: 'apagar', mes: '01/2020' }, 'operação 1: mês 01/2020 não existe'],
  ] as [Operacao, string][])('%o → %s', (op, erro) => expect(aplicarOperacoes(DADOS, [op], ids())).toEqual({ ok: false, erro }));
});
