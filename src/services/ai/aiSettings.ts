export const AI_SETTINGS_KEY = 'ai-chat-settings';

/** Lê o token do chat. Qualquer falha (storage bloqueado, JSON inválido) devolve ''. */
export const loadAiToken = (storage: Storage = localStorage): string => {
  try {
    const raw = storage.getItem(AI_SETTINGS_KEY);
    if (!raw) return '';
    const parsed: unknown = JSON.parse(raw);
    const token = (parsed as { token?: unknown } | null)?.token;
    return typeof token === 'string' ? token : '';
  } catch {
    return '';
  }
};

/** Salva o token (sem espaços nas pontas). Devolve false se o storage falhar. */
export const saveAiToken = (token: string, storage: Storage = localStorage): boolean => {
  try {
    storage.setItem(AI_SETTINGS_KEY, JSON.stringify({ token: token.trim() }));
    return true;
  } catch {
    return false;
  }
};
