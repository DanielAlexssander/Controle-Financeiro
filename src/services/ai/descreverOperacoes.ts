import type { FinanceData } from '../../types/index';
import type { Operacao } from './chatProtocol';

// Linhas do cartão de confirmação, em linguagem de gente, com antes → depois nas edições.
// Descreve contra os dados atuais (antes de aplicar). Item que não existe aparece marcado.

export type LinhaProposta = { tipo: 'adicionar' | 'editar' | 'apagar'; texto: string };

type Op<A extends Operacao['alvo']> = Extract<Operacao, { alvo: A }>;

const decimal = (n: number): string => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl = (n: number): string => `R$ ${decimal(n)}`;
const usd = (n: number): string => `US$ ${decimal(n)}`;
const qtd = (n: number): string => n.toLocaleString('pt-BR', { maximumFractionDigits: 8 });
const pct = (n: number): string => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
const data = (iso: string): string => iso.split('-').reverse().join('/');

const SINAL = { adicionar: '+', editar: '~', apagar: '−' } as const;

const linha = (tipo: LinhaProposta['tipo'], texto: string): LinhaProposta => ({ tipo, texto: `${SINAL[tipo]} ${texto}` });

const naoEncontrado = (tipo: LinhaProposta['tipo'], rotulo: string, chave: string): LinhaProposta =>
  linha(tipo, `${rotulo} ${chave} (não encontrado)`);

/** "campo antes → depois" só para os campos enviados na edição. */
const mudancas = (pares: readonly [string, string, string | undefined][]): string =>
  pares.filter(([, , depois]) => depois !== undefined).map(([campo, antes, depois]) => `${campo} ${antes} → ${depois}`).join('; ');

const opcional = <T,>(v: T | undefined, formatar: (x: T) => string): string | undefined => (v === undefined ? undefined : formatar(v));

const plural = (n: number, palavra: string): string => `${n} ${palavra}${n === 1 ? '' : 's'}`;

const banco = (d: FinanceData, op: Op<'banco'>): LinhaProposta => {
  if (op.acao === 'adicionar') {
    const invs = op.dados.investimentos ?? [];
    const com = invs.length > 0 ? `, com ${invs.map((i) => `${i.nome} (${brl(i.valorBrl)})`).join(', ')}` : '';
    return linha('adicionar', `Banco ${op.dados.nome}: saldo ${brl(op.dados.saldoBrl)}${com}`);
  }
  const b = d.banks.find((x) => x.id === op.id);
  if (!b) return naoEncontrado(op.acao, 'Banco', op.id);
  if (op.acao === 'apagar') {
    const invs = b.investments.length > 0 ? ` e ${plural(b.investments.length, 'investimento')}` : '';
    return linha('apagar', `Banco ${b.name} (saldo ${brl(b.balance)}${invs})`);
  }
  return linha('editar', `Banco ${b.name}: ${mudancas([
    ['nome', b.name, op.dados.nome],
    ['saldo', brl(b.balance), opcional(op.dados.saldoBrl, brl)],
  ])}`);
};

const investimento = (d: FinanceData, op: Op<'investimento'>): LinhaProposta => {
  const b = d.banks.find((x) => x.id === op.bancoId);
  if (op.acao === 'adicionar') {
    if (!b) return naoEncontrado('adicionar', 'Banco', op.bancoId);
    return linha('adicionar', `Investimento ${op.dados.nome} (${op.dados.tipo}) no ${b.name}: ${brl(op.dados.valorBrl)}`);
  }
  const i = b?.investments.find((x) => x.id === op.id);
  if (!b || !i) return naoEncontrado(op.acao, 'Investimento', op.id);
  if (op.acao === 'apagar') return linha('apagar', `Investimento ${i.name} no ${b.name} (${brl(i.amount)})`);
  return linha('editar', `Investimento ${i.name} no ${b.name}: ${mudancas([
    ['nome', i.name, op.dados.nome],
    ['tipo', i.type, op.dados.tipo],
    ['valor', brl(i.amount), opcional(op.dados.valorBrl, brl)],
  ])}`);
};

const cripto = (d: FinanceData, op: Op<'cripto'>): LinhaProposta => {
  if (op.acao === 'adicionar') {
    return linha('adicionar', `Cripto ${op.dados.simbolo}: ${qtd(op.dados.quantidade)} a ${usd(op.dados.precoCompraUsd)}`);
  }
  const c = d.cryptos.find((x) => x.id === op.id);
  if (!c) return naoEncontrado(op.acao, 'Cripto', op.id);
  if (op.acao === 'apagar') return linha('apagar', `Cripto ${c.symbol} (${qtd(c.amount)})`);
  return linha('editar', `Cripto ${c.symbol}: ${mudancas([
    ['símbolo', c.symbol, op.dados.simbolo],
    ['quantidade', qtd(c.amount), opcional(op.dados.quantidade, qtd)],
    ['preço de compra', usd(c.purchasePrice), opcional(op.dados.precoCompraUsd, usd)],
  ])}`);
};

const emprestimo = (d: FinanceData, op: Op<'emprestimo'>): LinhaProposta => {
  if (op.acao === 'adicionar') {
    const { nome, valorBrl, taxaJurosPct, vencimento } = op.dados;
    return linha('adicionar', `Empréstimo "${nome}": ${brl(valorBrl)} a ${pct(taxaJurosPct)}, vence ${data(vencimento)}`);
  }
  const l = d.loans.find((x) => x.id === op.id);
  if (!l) return naoEncontrado(op.acao, 'Empréstimo', op.id);
  if (op.acao === 'apagar') return linha('apagar', `Empréstimo "${l.name}" (${brl(l.amount)})`);
  return linha('editar', `Empréstimo "${l.name}": ${mudancas([
    ['nome', l.name, op.dados.nome],
    ['valor', brl(l.amount), opcional(op.dados.valorBrl, brl)],
    ['juros', pct(l.interestRate), opcional(op.dados.taxaJurosPct, pct)],
    ['vencimento', data(l.dueDate), opcional(op.dados.vencimento, data)],
  ])}`);
};

const mes = (d: FinanceData, op: Op<'mes'>): LinhaProposta => {
  const g = d.monthlyGrowth.find((x) => x.month === op.mes);
  if (op.acao === 'apagar') return g ? linha('apagar', `Mês ${op.mes} (${brl(g.totalPatrimony)})`) : naoEncontrado('apagar', 'Mês', op.mes);
  const novo = brl(op.dados.patrimonioBrl);
  return g
    ? linha('editar', `Mês ${op.mes}: patrimônio ${brl(g.totalPatrimony)} → ${novo}`)
    : linha('adicionar', `Mês ${op.mes}: patrimônio ${novo}`);
};

const descrever = (d: FinanceData, op: Operacao): LinhaProposta => {
  switch (op.alvo) {
    case 'banco':
      return banco(d, op);
    case 'investimento':
      return investimento(d, op);
    case 'cripto':
      return cripto(d, op);
    case 'emprestimo':
      return emprestimo(d, op);
    case 'mes':
      return mes(d, op);
  }
};

export const descreverOperacoes = (dados: FinanceData, operacoes: readonly Operacao[]): LinhaProposta[] =>
  operacoes.map((op) => descrever(dados, op));
