import { ESFORCOS, MODELOS, PREFERENCIAS_PADRAO, type Preferencias } from './chatProtocol';

export const AI_SETTINGS_KEY = 'ai-chat-settings';

type Salvo = { token?: unknown; preferencias?: unknown };

const ler = (storage: Storage): Salvo => {
  try {
    const raw = storage.getItem(AI_SETTINGS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? (parsed as Salvo) : {};
  } catch {
    return {};
  }
};

/** Mescla com o que já está salvo (token e preferências convivem no mesmo registro). */
const gravar = (mudanca: Salvo, storage: Storage): boolean => {
  try {
    storage.setItem(AI_SETTINGS_KEY, JSON.stringify({ ...ler(storage), ...mudanca }));
    return true;
  } catch {
    return false;
  }
};

/** Lê o token do chat. Qualquer falha (storage bloqueado, JSON inválido) devolve ''. */
export const loadAiToken = (storage: Storage = localStorage): string => {
  const { token } = ler(storage);
  return typeof token === 'string' ? token : '';
};

/** Salva o token (sem espaços nas pontas). Devolve false se o storage falhar. */
export const saveAiToken = (token: string, storage: Storage = localStorage): boolean =>
  gravar({ token: token.trim() }, storage);

const ehPreferencias = (v: unknown): v is Preferencias => {
  if (typeof v !== 'object' || v === null) return false;
  const { modelo, esforco } = v as Record<string, unknown>;
  return (MODELOS as readonly unknown[]).includes(modelo) && (ESFORCOS as readonly unknown[]).includes(esforco);
};

/** Modelo e esforço escolhidos para o `financas`; inválido ou ausente volta ao padrão. */
export const loadAiPreferencias = (storage: Storage = localStorage): Preferencias => {
  const { preferencias } = ler(storage);
  return ehPreferencias(preferencias) ? { ...preferencias } : { ...PREFERENCIAS_PADRAO };
};

export const saveAiPreferencias = (preferencias: Preferencias, storage: Storage = localStorage): boolean =>
  gravar({ preferencias }, storage);
