// Validação das mudanças propostas pela IA (ferramenta `propor_alteracoes` do financas).
// Cópia: mantenha igual a src/operacoes.ts do repositório mcp-financas.
import { MAX_OPERACOES, type InvestimentoNovo, type Operacao } from './chatProtocol';

export type ResultadoValidacao = { ok: true; operacoes: Operacao[] } | { ok: false; erro: string };

const MAX_TEXTO = 100;
const MAX_ID = 100;
const MAX_VALOR = 1e12;
const RE_SIMBOLO = /^[A-Z0-9]{1,10}$/;
const RE_DATA = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const RE_MES = /^(0[1-9]|1[0-2])\/\d{4}$/;

type Campos = Record<string, unknown>;

class ErroOperacao extends Error {}

const falha = (mensagem: string): never => {
  throw new ErroOperacao(mensagem);
};

const ehObjeto = (v: unknown): v is Campos => typeof v === 'object' && v !== null && !Array.isArray(v);

const lerTexto = (o: Campos, campo: string): string => {
  const v = o[campo];
  const texto = typeof v === 'string' ? v.trim() : '';
  if (texto.length === 0 || texto.length > MAX_TEXTO) falha(`${campo} deve ser um texto de 1 a ${MAX_TEXTO} caracteres`);
  return texto;
};

const lerId = (o: Campos, campo: string): string => {
  const v = o[campo];
  const id = typeof v === 'string' ? v.trim() : '';
  if (id.length === 0 || id.length > MAX_ID) falha(`${campo} deve ser o id de um item existente`);
  return id;
};

const lerNumero = (o: Campos, campo: string): number => {
  const v = o[campo];
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > MAX_VALOR) falha(`${campo} deve ser um número ≥ 0`);
  return v as number;
};

const lerPositivo = (o: Campos, campo: string): number => {
  const v = lerNumero(o, campo);
  if (v === 0) falha(`${campo} deve ser maior que 0`);
  return v;
};

const lerSimbolo = (o: Campos, campo: string): string => {
  const simbolo = lerTexto(o, campo).toUpperCase();
  if (!RE_SIMBOLO.test(simbolo)) falha(`${campo} deve ter só letras e números (até 10), como BTC`);
  return simbolo;
};

const lerData = (o: Campos, campo: string): string => {
  const data = lerTexto(o, campo);
  if (!RE_DATA.test(data)) falha(`${campo} deve estar no formato AAAA-MM-DD`);
  return data;
};

const lerMes = (o: Campos, campo: string): string => {
  const mes = lerTexto(o, campo);
  if (!RE_MES.test(mes)) falha(`${campo} deve estar no formato MM/AAAA`);
  return mes;
};

const lerDados = (op: Campos): Campos => (ehObjeto(op.dados) ? op.dados : falha('dados deve ser um objeto'));

type Leitor<T> = (o: Campos, campo: string) => T;
const opcional = <T>(o: Campos, campo: string, ler: Leitor<T>): T | undefined =>
  o[campo] === undefined ? undefined : ler(o, campo);

/** Edição: só os campos enviados; pelo menos um. */
const semVazios = <T extends Record<string, unknown>>(campos: T): { [K in keyof T]?: Exclude<T[K], undefined> } => {
  const presentes = Object.entries(campos).filter(([, v]) => v !== undefined);
  if (presentes.length === 0) falha('dados deve ter pelo menos um campo para editar');
  return Object.fromEntries(presentes) as { [K in keyof T]?: Exclude<T[K], undefined> };
};

const lerInvestimento = (d: Campos): InvestimentoNovo => ({
  nome: lerTexto(d, 'nome'),
  tipo: lerTexto(d, 'tipo'),
  valorBrl: lerNumero(d, 'valorBrl'),
});

const lerInvestimentos = (v: unknown): InvestimentoNovo[] =>
  Array.isArray(v) && v.length <= MAX_OPERACOES
    ? v.map((item) => lerInvestimento(ehObjeto(item) ? item : falha('investimentos deve ter só objetos')))
    : falha(`investimentos deve ser uma lista de até ${MAX_OPERACOES} itens`);

const banco = (op: Campos): Operacao => {
  if (op.acao === 'apagar') return { alvo: 'banco', acao: 'apagar', id: lerId(op, 'id') };
  const d = lerDados(op);
  if (op.acao === 'editar') {
    return { alvo: 'banco', acao: 'editar', id: lerId(op, 'id'), dados: semVazios({ nome: opcional(d, 'nome', lerTexto), saldoBrl: opcional(d, 'saldoBrl', lerNumero) }) };
  }
  if (op.acao !== 'adicionar') return falha(`acao inválida para banco: ${String(op.acao)}`);
  const investimentos = d.investimentos === undefined ? undefined : lerInvestimentos(d.investimentos);
  return {
    alvo: 'banco',
    acao: 'adicionar',
    dados: { nome: lerTexto(d, 'nome'), saldoBrl: lerNumero(d, 'saldoBrl'), ...(investimentos ? { investimentos } : {}) },
  };
};

const investimento = (op: Campos): Operacao => {
  const bancoId = lerId(op, 'bancoId');
  if (op.acao === 'apagar') return { alvo: 'investimento', acao: 'apagar', bancoId, id: lerId(op, 'id') };
  const d = lerDados(op);
  if (op.acao === 'adicionar') return { alvo: 'investimento', acao: 'adicionar', bancoId, dados: lerInvestimento(d) };
  if (op.acao !== 'editar') return falha(`acao inválida para investimento: ${String(op.acao)}`);
  const dados = semVazios({ nome: opcional(d, 'nome', lerTexto), tipo: opcional(d, 'tipo', lerTexto), valorBrl: opcional(d, 'valorBrl', lerNumero) });
  return { alvo: 'investimento', acao: 'editar', bancoId, id: lerId(op, 'id'), dados };
};

const cripto = (op: Campos): Operacao => {
  if (op.acao === 'apagar') return { alvo: 'cripto', acao: 'apagar', id: lerId(op, 'id') };
  const d = lerDados(op);
  if (op.acao === 'adicionar') {
    const dados = { simbolo: lerSimbolo(d, 'simbolo'), quantidade: lerPositivo(d, 'quantidade'), precoCompraUsd: lerNumero(d, 'precoCompraUsd') };
    return { alvo: 'cripto', acao: 'adicionar', dados };
  }
  if (op.acao !== 'editar') return falha(`acao inválida para cripto: ${String(op.acao)}`);
  const dados = semVazios({
    simbolo: opcional(d, 'simbolo', lerSimbolo),
    quantidade: opcional(d, 'quantidade', lerPositivo),
    precoCompraUsd: opcional(d, 'precoCompraUsd', lerNumero),
  });
  return { alvo: 'cripto', acao: 'editar', id: lerId(op, 'id'), dados };
};

const emprestimo = (op: Campos): Operacao => {
  if (op.acao === 'apagar') return { alvo: 'emprestimo', acao: 'apagar', id: lerId(op, 'id') };
  const d = lerDados(op);
  if (op.acao === 'adicionar') {
    const dados = { nome: lerTexto(d, 'nome'), valorBrl: lerNumero(d, 'valorBrl'), taxaJurosPct: lerNumero(d, 'taxaJurosPct'), vencimento: lerData(d, 'vencimento') };
    return { alvo: 'emprestimo', acao: 'adicionar', dados };
  }
  if (op.acao !== 'editar') return falha(`acao inválida para emprestimo: ${String(op.acao)}`);
  const dados = semVazios({
    nome: opcional(d, 'nome', lerTexto),
    valorBrl: opcional(d, 'valorBrl', lerNumero),
    taxaJurosPct: opcional(d, 'taxaJurosPct', lerNumero),
    vencimento: opcional(d, 'vencimento', lerData),
  });
  return { alvo: 'emprestimo', acao: 'editar', id: lerId(op, 'id'), dados };
};

const mes = (op: Campos): Operacao => {
  if (op.acao === 'apagar') return { alvo: 'mes', acao: 'apagar', mes: lerMes(op, 'mes') };
  if (op.acao !== 'definir') return falha(`acao inválida para mes: ${String(op.acao)}`);
  return { alvo: 'mes', acao: 'definir', mes: lerMes(op, 'mes'), dados: { patrimonioBrl: lerPositivo(lerDados(op), 'patrimonioBrl') } };
};

const POR_ALVO: Readonly<Record<string, (op: Campos) => Operacao>> = { banco, investimento, cripto, emprestimo, mes };

const lerOperacao = (item: unknown): Operacao => {
  if (!ehObjeto(item)) return falha('cada operação deve ser um objeto');
  const ler = typeof item.alvo === 'string' ? POR_ALVO[item.alvo] : undefined;
  return ler ? ler(item) : falha(`alvo inválido: ${String(item.alvo)}`);
};

/** Valida e normaliza a lista de operações (textos aparados, símbolo em maiúsculas, só campos conhecidos). */
export const validarOperacoes = (valor: unknown): ResultadoValidacao => {
  if (!Array.isArray(valor) || valor.length === 0 || valor.length > MAX_OPERACOES) {
    return { ok: false, erro: `operacoes deve ser uma lista de 1 a ${MAX_OPERACOES} operações` };
  }
  try {
    return {
      ok: true,
      operacoes: valor.map((item, i) => {
        try {
          return lerOperacao(item);
        } catch (err) {
          if (err instanceof ErroOperacao) throw new ErroOperacao(`operação ${i + 1}: ${err.message}`);
          throw err;
        }
      }),
    };
  } catch (err) {
    if (err instanceof ErroOperacao) return { ok: false, erro: err.message };
    throw err;
  }
};
