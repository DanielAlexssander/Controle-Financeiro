import { describe, expect, it } from 'vitest';
import { consumirTokenDaUrl, hashSemToken, lerTokenDaUrl } from './tokenDaUrl';
import { AI_SETTINGS_KEY, loadAiToken } from './aiSettings';

const TOKEN = 'ab12'.repeat(16);

const memoryStorage = (): Storage => {
  const dados = new Map<string, string>();
  return {
    get length() { return dados.size; },
    clear: () => dados.clear(),
    getItem: (k) => dados.get(k) ?? null,
    key: (i) => [...dados.keys()][i] ?? null,
    removeItem: (k) => { dados.delete(k); },
    setItem: (k, v) => { dados.set(k, v); },
  };
};

const fakeHistory = () => {
  const urls: string[] = [];
  return { urls, replaceState: (_: unknown, __: string, url?: string | URL | null) => { urls.push(String(url)); } };
};

const local = (hash: string) => ({ hash, pathname: '/Controle-Financeiro/', search: '' });

describe('lerTokenDaUrl', () => {
  it('lê o token de #ia=', () => expect(lerTokenDaUrl(`#ia=${TOKEN}`)).toBe(TOKEN));
  it('lê junto de outros parâmetros', () => expect(lerTokenDaUrl(`#x=1&ia=${TOKEN}`)).toBe(TOKEN));
  it('sem fragmento devolve null', () => expect(lerTokenDaUrl('')).toBeNull());
  it('formato inválido devolve null', () => {
    expect(lerTokenDaUrl('#ia=curto')).toBeNull();
    expect(lerTokenDaUrl(`#ia=${'Z'.repeat(64)}`)).toBeNull();
  });
});

describe('hashSemToken', () => {
  it('só o token → fragmento vazio', () => expect(hashSemToken(`#ia=${TOKEN}`)).toBe(''));
  it('mantém os outros parâmetros', () => expect(hashSemToken(`#x=1&ia=${TOKEN}`)).toBe('#x=1'));
});

describe('consumirTokenDaUrl', () => {
  it('salva o token, limpa a barra de endereço e pede para abrir o chat', () => {
    const storage = memoryStorage();
    const hist = fakeHistory();
    expect(consumirTokenDaUrl(local(`#ia=${TOKEN}`), hist, storage)).toBe(true);
    expect(loadAiToken(storage)).toBe(TOKEN);
    expect(hist.urls).toEqual(['/Controle-Financeiro/']);
  });

  it('sem token na URL não mexe em nada', () => {
    const storage = memoryStorage();
    const hist = fakeHistory();
    expect(consumirTokenDaUrl(local(''), hist, storage)).toBe(false);
    expect(storage.getItem(AI_SETTINGS_KEY)).toBeNull();
    expect(hist.urls).toEqual([]);
  });

  it('token inválido não sobrescreve o salvo', () => {
    const storage = memoryStorage();
    storage.setItem(AI_SETTINGS_KEY, JSON.stringify({ token: TOKEN }));
    expect(consumirTokenDaUrl(local('#ia=falso'), fakeHistory(), storage)).toBe(false);
    expect(loadAiToken(storage)).toBe(TOKEN);
  });
});
