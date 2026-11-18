import { ChakraProvider } from '@chakra-ui/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StatusProposta } from '../../services/ai/chatReducer';
import { PropostaCard } from './PropostaCard';

const PROPOSTA = { id: 'P1', resumo: 'Organizar a carteira', operacoes: [] };
const LINHAS = [
  { tipo: 'adicionar' as const, texto: '+ Banco Inter: saldo R$ 2.000,00' },
  { tipo: 'apagar' as const, texto: '− Cripto BTC (0,1)' },
];

const html = (status: StatusProposta, extra: { detalhe?: string; podeDecidir?: boolean } = {}) =>
  renderToStaticMarkup(
    <ChakraProvider>
      <PropostaCard item={{ proposta: PROPOSTA, status, detalhe: extra.detalhe }} linhas={LINHAS} podeDecidir={extra.podeDecidir ?? true}
        onConfirmar={() => {}} onRecusar={() => {}} />
    </ChakraProvider>,
  );

describe('PropostaCard', () => {
  it('pendente: mostra o resumo, as linhas e os dois botões', () => {
    const out = html('pendente');
    expect(out).toContain('A IA quer alterar seus dados');
    expect(out).toContain('Organizar a carteira');
    expect(out).toContain('+ Banco Inter: saldo R$ 2.000,00');
    expect(out).toContain('− Cripto BTC (0,1)');
    expect(out).toContain('Confirmar tudo');
    expect(out).toContain('Recusar');
  });

  it('sem conexão: botões desativados; conectado: ativos', () => {
    expect(html('pendente', { podeDecidir: false }).match(/disabled=""/g)).toHaveLength(2);
    expect(html('pendente')).not.toContain('disabled=""');
  });

  it.each([
    ['aplicada', 'Alterações aplicadas.'],
    ['recusada', 'Recusada. Nada foi alterado.'],
    ['expirou', 'Expirou sem resposta. Nada foi alterado.'],
  ] as [StatusProposta, string][])('%s: mostra o resultado e esconde os botões', (status, texto) => {
    const out = html(status);
    expect(out).toContain(texto);
    expect(out).not.toContain('Confirmar tudo');
  });

  it('falhou: mostra o motivo', () => expect(html('falhou', { detalhe: 'banco b9 não existe' })).toContain('Não aplicada: banco b9 não existe. Nada foi alterado.'));
});
