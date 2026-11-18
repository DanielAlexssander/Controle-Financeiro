import { describe, expect, it } from 'vitest';
import type { FinanceData } from '../../types/index';
import type { Operacao } from './chatProtocol';
import { descreverOperacoes } from './descreverOperacoes';

const DADOS: FinanceData = {
  banks: [{ id: 'b1', name: 'Nubank', balance: 1000, investments: [{ id: 'i1', name: 'CDB', amount: 500, type: 'Renda fixa' }] }],
  cryptos: [{ id: 'c1', symbol: 'BTC', amount: 0.1, purchasePrice: 60000 }],
  loans: [{ id: 'e1', name: 'João', amount: 500, interestRate: 2, dueDate: '2026-12-31' }],
  monthlyGrowth: [{ month: '10/2026', totalPatrimony: 100000 }],
  diversification: { stocks: 0, crypto: 0, fixedIncome: 0, cash: 0 },
};

const linha = (op: Operacao) => descreverOperacoes(DADOS, [op])[0];

describe('descreverOperacoes', () => {
  it.each([
    [{ alvo: 'banco', acao: 'adicionar', dados: { nome: 'Inter', saldoBrl: 2000 } }, '+ Banco Inter: saldo R$ 2.000,00'],
    [{ alvo: 'banco', acao: 'adicionar', dados: { nome: 'Inter', saldoBrl: 0, investimentos: [{ nome: 'LCI', tipo: 'Renda fixa', valorBrl: 300 }] } },
      '+ Banco Inter: saldo R$ 0,00, com LCI (R$ 300,00)'],
    [{ alvo: 'banco', acao: 'editar', id: 'b1', dados: { nome: 'Nu', saldoBrl: 1500.5 } }, '~ Banco Nubank: nome Nubank → Nu; saldo R$ 1.000,00 → R$ 1.500,50'],
    [{ alvo: 'banco', acao: 'apagar', id: 'b1' }, '− Banco Nubank (saldo R$ 1.000,00 e 1 investimento)'],
    [{ alvo: 'investimento', acao: 'adicionar', bancoId: 'b1', dados: { nome: 'PETR4', tipo: 'Ações', valorBrl: 100 } }, '+ Investimento PETR4 (Ações) no Nubank: R$ 100,00'],
    [{ alvo: 'investimento', acao: 'editar', bancoId: 'b1', id: 'i1', dados: { valorBrl: 600 } }, '~ Investimento CDB no Nubank: valor R$ 500,00 → R$ 600,00'],
    [{ alvo: 'investimento', acao: 'apagar', bancoId: 'b1', id: 'i1' }, '− Investimento CDB no Nubank (R$ 500,00)'],
    [{ alvo: 'cripto', acao: 'adicionar', dados: { simbolo: 'ETH', quantidade: 2, precoCompraUsd: 3000 } }, '+ Cripto ETH: 2 a US$ 3.000,00'],
    [{ alvo: 'cripto', acao: 'editar', id: 'c1', dados: { quantidade: 0.15 } }, '~ Cripto BTC: quantidade 0,1 → 0,15'],
    [{ alvo: 'cripto', acao: 'apagar', id: 'c1' }, '− Cripto BTC (0,1)'],
    [{ alvo: 'emprestimo', acao: 'adicionar', dados: { nome: 'Ana', valorBrl: 300, taxaJurosPct: 1.5, vencimento: '2027-01-10' } },
      '+ Empréstimo "Ana": R$ 300,00 a 1,5%, vence 10/01/2027'],
    [{ alvo: 'emprestimo', acao: 'editar', id: 'e1', dados: { vencimento: '2027-02-01' } }, '~ Empréstimo "João": vencimento 31/12/2026 → 01/02/2027'],
    [{ alvo: 'emprestimo', acao: 'apagar', id: 'e1' }, '− Empréstimo "João" (R$ 500,00)'],
    [{ alvo: 'mes', acao: 'definir', mes: '11/2026', dados: { patrimonioBrl: 120000 } }, '+ Mês 11/2026: patrimônio R$ 120.000,00'],
    [{ alvo: 'mes', acao: 'definir', mes: '10/2026', dados: { patrimonioBrl: 90000 } }, '~ Mês 10/2026: patrimônio R$ 100.000,00 → R$ 90.000,00'],
    [{ alvo: 'mes', acao: 'apagar', mes: '10/2026' }, '− Mês 10/2026 (R$ 100.000,00)'],
  ] as [Operacao, string][])('%o', (op, texto) => expect(linha(op).texto).toBe(texto));

  it('item que não existe aparece marcado', () => {
    expect(linha({ alvo: 'cripto', acao: 'apagar', id: 'c9' }).texto).toBe('− Cripto c9 (não encontrado)');
    expect(linha({ alvo: 'banco', acao: 'editar', id: 'b9', dados: { saldoBrl: 1 } }).texto).toBe('~ Banco b9 (não encontrado)');
  });

  it('informa a ação de cada linha (para colorir)', () =>
    expect(descreverOperacoes(DADOS, [
      { alvo: 'mes', acao: 'definir', mes: '11/2026', dados: { patrimonioBrl: 1 } },
      { alvo: 'cripto', acao: 'apagar', id: 'c1' },
    ]).map((l) => l.tipo)).toEqual(['adicionar', 'apagar']));
});
