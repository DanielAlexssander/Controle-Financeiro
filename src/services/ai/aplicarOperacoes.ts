import type { Bank, FinanceData } from '../../types/index';
import type { ItemCriado, Operacao } from './chatProtocol';

// Aplica as mudanças confirmadas pelo usuário. Tudo ou nada: qualquer item inexistente cancela a
// proposta inteira e os dados originais ficam como estavam (nada é mutado).

export type ResultadoAplicacao = { ok: true; dados: FinanceData; criados: ItemCriado[] } | { ok: false; erro: string };

type Op<A extends Operacao['alvo']> = Extract<Operacao, { alvo: A }>;
type Efeito = { dados: FinanceData; criados: readonly ItemCriado[] };

class ItemInexistente extends Error {}

const naoExiste = (mensagem: string): never => {
  throw new ItemInexistente(mensagem);
};

const exigirBanco = (d: FinanceData, id: string): Bank => d.banks.find((b) => b.id === id) ?? naoExiste(`banco ${id} não existe`);

const trocarBanco = (d: FinanceData, id: string, mudar: (b: Bank) => Bank): FinanceData => ({
  ...d,
  banks: d.banks.map((b) => (b.id === id ? mudar(b) : b)),
});

/** Só os campos enviados na edição entram (os demais ficam como estão). */
const definidos = <T extends object>(campos: T): Partial<T> =>
  Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined)) as Partial<T>;

const banco = (d: FinanceData, op: Op<'banco'>, novoId: () => string): Efeito => {
  if (op.acao === 'adicionar') {
    const id = novoId();
    const investments = (op.dados.investimentos ?? []).map((i) => ({ id: novoId(), name: i.nome, amount: i.valorBrl, type: i.tipo }));
    const criados: ItemCriado[] = [
      { alvo: 'banco', id, nome: op.dados.nome },
      ...investments.map((i): ItemCriado => ({ alvo: 'investimento', id: i.id, nome: i.name })),
    ];
    return { dados: { ...d, banks: [...d.banks, { id, name: op.dados.nome, balance: op.dados.saldoBrl, investments }] }, criados };
  }
  exigirBanco(d, op.id);
  if (op.acao === 'apagar') return { dados: { ...d, banks: d.banks.filter((b) => b.id !== op.id) }, criados: [] };
  const mudanca = definidos({ name: op.dados.nome, balance: op.dados.saldoBrl });
  return { dados: trocarBanco(d, op.id, (b) => ({ ...b, ...mudanca })), criados: [] };
};

const investimento = (d: FinanceData, op: Op<'investimento'>, novoId: () => string): Efeito => {
  const dono = exigirBanco(d, op.bancoId);
  if (op.acao === 'adicionar') {
    const novo = { id: novoId(), name: op.dados.nome, amount: op.dados.valorBrl, type: op.dados.tipo };
    return { dados: trocarBanco(d, dono.id, (b) => ({ ...b, investments: [...b.investments, novo] })), criados: [{ alvo: 'investimento', id: novo.id, nome: novo.name }] };
  }
  if (!dono.investments.some((i) => i.id === op.id)) naoExiste(`investimento ${op.id} não existe no banco ${dono.name}`);
  if (op.acao === 'apagar') {
    return { dados: trocarBanco(d, dono.id, (b) => ({ ...b, investments: b.investments.filter((i) => i.id !== op.id) })), criados: [] };
  }
  const mudanca = definidos({ name: op.dados.nome, type: op.dados.tipo, amount: op.dados.valorBrl });
  const editar = (b: Bank): Bank => ({ ...b, investments: b.investments.map((i) => (i.id === op.id ? { ...i, ...mudanca } : i)) });
  return { dados: trocarBanco(d, dono.id, editar), criados: [] };
};

const cripto = (d: FinanceData, op: Op<'cripto'>, novoId: () => string): Efeito => {
  if (op.acao === 'adicionar') {
    const novo = { id: novoId(), symbol: op.dados.simbolo, amount: op.dados.quantidade, purchasePrice: op.dados.precoCompraUsd };
    return { dados: { ...d, cryptos: [...d.cryptos, novo] }, criados: [{ alvo: 'cripto', id: novo.id, nome: novo.symbol }] };
  }
  if (!d.cryptos.some((c) => c.id === op.id)) naoExiste(`cripto ${op.id} não existe`);
  if (op.acao === 'apagar') return { dados: { ...d, cryptos: d.cryptos.filter((c) => c.id !== op.id) }, criados: [] };
  const mudanca = definidos({ symbol: op.dados.simbolo, amount: op.dados.quantidade, purchasePrice: op.dados.precoCompraUsd });
  return { dados: { ...d, cryptos: d.cryptos.map((c) => (c.id === op.id ? { ...c, ...mudanca } : c)) }, criados: [] };
};

const emprestimo = (d: FinanceData, op: Op<'emprestimo'>, novoId: () => string): Efeito => {
  if (op.acao === 'adicionar') {
    const { nome, valorBrl, taxaJurosPct, vencimento } = op.dados;
    const novo = { id: novoId(), name: nome, amount: valorBrl, interestRate: taxaJurosPct, dueDate: vencimento };
    return { dados: { ...d, loans: [...d.loans, novo] }, criados: [{ alvo: 'emprestimo', id: novo.id, nome }] };
  }
  if (!d.loans.some((l) => l.id === op.id)) naoExiste(`empréstimo ${op.id} não existe`);
  if (op.acao === 'apagar') return { dados: { ...d, loans: d.loans.filter((l) => l.id !== op.id) }, criados: [] };
  const { nome, valorBrl, taxaJurosPct, vencimento } = op.dados;
  const mudanca = definidos({ name: nome, amount: valorBrl, interestRate: taxaJurosPct, dueDate: vencimento });
  return { dados: { ...d, loans: d.loans.map((l) => (l.id === op.id ? { ...l, ...mudanca } : l)) }, criados: [] };
};

const mes = (d: FinanceData, op: Op<'mes'>): Efeito => {
  const existe = d.monthlyGrowth.some((g) => g.month === op.mes);
  if (op.acao === 'apagar') {
    if (!existe) naoExiste(`mês ${op.mes} não existe`);
    return { dados: { ...d, monthlyGrowth: d.monthlyGrowth.filter((g) => g.month !== op.mes) }, criados: [] };
  }
  const registro = { month: op.mes, totalPatrimony: op.dados.patrimonioBrl };
  const monthlyGrowth = existe ? d.monthlyGrowth.map((g) => (g.month === op.mes ? registro : g)) : [...d.monthlyGrowth, registro];
  return { dados: { ...d, monthlyGrowth }, criados: [] };
};

const aplicarUma = (d: FinanceData, op: Operacao, novoId: () => string): Efeito => {
  switch (op.alvo) {
    case 'banco':
      return banco(d, op, novoId);
    case 'investimento':
      return investimento(d, op, novoId);
    case 'cripto':
      return cripto(d, op, novoId);
    case 'emprestimo':
      return emprestimo(d, op, novoId);
    case 'mes':
      return mes(d, op);
  }
};

export const aplicarOperacoes = (
  dados: FinanceData,
  operacoes: readonly Operacao[],
  novoId: () => string,
): ResultadoAplicacao => {
  try {
    const final = operacoes.reduce<Efeito>((acc, op, i) => {
      try {
        const efeito = aplicarUma(acc.dados, op, novoId);
        return { dados: efeito.dados, criados: [...acc.criados, ...efeito.criados] };
      } catch (err) {
        if (err instanceof ItemInexistente) throw new ItemInexistente(`operação ${i + 1}: ${err.message}`);
        throw err;
      }
    }, { dados, criados: [] });
    return { ok: true, dados: final.dados, criados: [...final.criados] };
  } catch (err) {
    if (err instanceof ItemInexistente) return { ok: false, erro: err.message };
    throw err;
  }
};
