import { describe, it, expect } from 'vitest';
import { AI_SETTINGS_KEY, loadAiToken, saveAiToken } from './aiSettings';

const memoryStorage = (inicial: Record<string, string> = {}): Storage => {
  const dados = new Map(Object.entries(inicial));
  return {
    get length() { return dados.size; },
    clear: () => dados.clear(),
    getItem: (k) => dados.get(k) ?? null,
    key: (i) => [...dados.keys()][i] ?? null,
    removeItem: (k) => { dados.delete(k); },
    setItem: (k, v) => { dados.set(k, v); },
  };
};

const quebrado = (): Storage => ({
  ...memoryStorage(),
  getItem: () => { throw new Error('bloqueado'); },
  setItem: () => { throw new Error('bloqueado'); },
});

describe('aiSettings', () => {
  it('salva e lê o token', () => {
    const st = memoryStorage();
    expect(saveAiToken('  abc  ', st)).toBe(true);
    expect(st.getItem(AI_SETTINGS_KEY)).toBe('{"token":"abc"}');
    expect(loadAiToken(st)).toBe('abc');
  });
  it('sem nada salvo devolve ""', () => expect(loadAiToken(memoryStorage())).toBe(''));
  it('JSON corrompido devolve ""', () =>
    expect(loadAiToken(memoryStorage({ [AI_SETTINGS_KEY]: '{' }))).toBe(''));
  it('token não-string devolve ""', () =>
    expect(loadAiToken(memoryStorage({ [AI_SETTINGS_KEY]: '{"token":1}' }))).toBe(''));
  it('storage que lança: leitura "" e escrita false', () => {
    expect(loadAiToken(quebrado())).toBe('');
    expect(saveAiToken('x', quebrado())).toBe(false);
  });
});
