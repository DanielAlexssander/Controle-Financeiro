import type { Preferencias, Sessao } from './chatProtocol';

const MODELO_ROTULO: Readonly<Record<string, string>> = { sonnet: 'Sonnet', opus: 'Opus', haiku: 'Haiku' };
const ESFORCO_ROTULO: Readonly<Record<string, string>> = { low: 'baixo', medium: 'médio', high: 'alto' };

export const rotuloSessao = ({ modelo, esforco }: Sessao): string =>
  `${MODELO_ROTULO[modelo] ?? modelo} · esforço ${ESFORCO_ROTULO[esforco] ?? esforco}`;

/** Texto do modelo em uso e, se a preferência for outra, o aviso de que vale ao reiniciar. */
export const descreverSessao = (
  sessao: Sessao | null,
  prefs: Preferencias,
): { atual: string | null; aviso: string | null } => {
  if (!sessao) return { atual: null, aviso: null };
  const igual = sessao.modelo === prefs.modelo && sessao.esforco === prefs.esforco;
  return {
    atual: rotuloSessao(sessao),
    aviso: igual ? null : `Sua preferência (${rotuloSessao(prefs)}) vale ao reiniciar o financas.`,
  };
};
