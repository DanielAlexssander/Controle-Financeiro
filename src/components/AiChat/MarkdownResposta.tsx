import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Markdown no formato do GitHub (tabelas, tachado, listas de tarefa). Sem plugin de HTML bruto:
// HTML vindo da resposta nunca é interpretado. Elementos HTML simples; o visual vem do container.
const PLUGINS = [remarkGfm];

const COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="md-tabela">
      <table>{children}</table>
    </div>
  ),
};

export const MarkdownResposta = ({ texto }: { texto: string }) => (
  <Markdown remarkPlugins={PLUGINS} components={COMPONENTS}>
    {texto}
  </Markdown>
);
