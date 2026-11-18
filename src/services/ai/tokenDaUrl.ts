import { saveAiToken } from './aiSettings';

// O comando `financas` abre o site com `#ia=<token>`. O fragmento (#) nunca é enviado ao servidor.
const PARAM = 'ia';
const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

const params = (hash: string) => new URLSearchParams(hash.replace(/^#/, ''));

/** Token do fragmento, só se tiver o formato exato (64 hex). */
export const lerTokenDaUrl = (hash: string): string | null => {
  const token = params(hash).get(PARAM);
  return token && TOKEN_PATTERN.test(token) ? token : null;
};

/** Fragmento sem o token (vazio se não sobrar nada). */
export const hashSemToken = (hash: string): string => {
  const p = params(hash);
  p.delete(PARAM);
  const resto = p.toString();
  return resto ? `#${resto}` : '';
};

type LocalAtual = Pick<Location, 'hash' | 'pathname' | 'search'>;
type Historico = Pick<History, 'replaceState'>;

/**
 * Se a URL trouxe o token: salva, tira da barra de endereço e devolve true (abrir o chat).
 * Roda uma vez, antes de o React montar.
 */
export const consumirTokenDaUrl = (local: LocalAtual, historico: Historico, storage: Storage): boolean => {
  const token = lerTokenDaUrl(local.hash);
  if (!token) return false;
  saveAiToken(token, storage);
  historico.replaceState(null, '', `${local.pathname}${local.search}${hashSemToken(local.hash)}`);
  return true;
};
