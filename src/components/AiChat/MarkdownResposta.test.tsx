import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownResposta } from './MarkdownResposta';

const html = (texto: string) => renderToStaticMarkup(<MarkdownResposta texto={texto} />);

const TABELA = [
  '| Ativo | Valor |',
  '|---|---:|',
  '| BTC | R$ 4.177,58 |',
  '| CDB | R$ 3.370,00 |',
].join('\n');

describe('MarkdownResposta', () => {
  it('renderiza tabela no formato do GitHub', () => {
    const out = html(TABELA);
    expect(out).toContain('<table>');
    expect(out).toContain('<th>Ativo</th>');
    expect(out).toContain('<td>BTC</td>');
  });

  it('mantém o alinhamento à direita das colunas numéricas', () =>
    expect(html(TABELA)).toContain('<td style="text-align:right">R$ 4.177,58</td>'));

  it('envolve a tabela num contêiner com rolagem horizontal', () =>
    expect(html(TABELA)).toMatch(/<div class="md-tabela"><table>/));

  it('renderiza tachado do GitHub', () => expect(html('~~antigo~~')).toContain('<del>antigo</del>'));

  it('não interpreta HTML bruto', () => {
    const out = html('<script>alert(1)</script><b>x</b>');
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('<b>x</b>');
  });

  it('links abrem em nova aba com rel seguro', () => {
    const out = html('[site](https://exemplo.com)');
    expect(out).toContain('href="https://exemplo.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('neutraliza link javascript:', () =>
    expect(html('[x](javascript:alert(1))')).not.toContain('javascript:'));
});
