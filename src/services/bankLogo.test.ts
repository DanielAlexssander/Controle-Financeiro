import { describe, expect, it } from 'vitest';
import { getBankLogo } from './bankLogo';

describe('logos nos cadastros de bancos', () => {
  it.each([
    ['BB', 'Banco do Brasil'],
    ['CEF', 'Caixa Econômica Federal'],
    ['Banco C6 S.A.', 'C6 Bank'],
    ['BTG', 'BTG Pactual'],
    ['341', 'Itaú'],
    ['Nu Pagamentos', 'Nubank'],
    ['Steam', 'Valve'],
    ['Banco Inco', 'INCO'],
    ['INCO Investimentos', 'Inco'],
  ])('reconhece %s como %s', (cadastro, banco) => {
    const logo = getBankLogo(banco);
    expect(logo).toBeTruthy();
    expect(getBankLogo(cadastro)).toBe(logo);
  });

  it.each(['Banco Inventado', 'Outros', 'Banco Internacional Inventado', ''])(
    'exibe apenas o texto para "%s"',
    nome => expect(getBankLogo(nome)).toBeUndefined(),
  );
});
