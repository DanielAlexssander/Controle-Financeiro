import { describe, expect, it } from 'vitest';
import { AI_SETTINGS_KEY, loadAiPreferencias, loadAiToken, saveAiPreferencias, saveAiToken } from './aiSettings';
import { descreverSessao } from './sessaoInfo';

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

describe('preferências no navegador', () => {
  it('sem nada salvo usa o padrão (sonnet, medium)', () =>
    expect(loadAiPreferencias(memoryStorage())).toEqual({ modelo: 'sonnet', esforco: 'medium' }));

  it('salvar a preferência mantém o token', () => {
    const st = memoryStorage();
    saveAiToken('abc', st);
    expect(saveAiPreferencias({ modelo: 'opus', esforco: 'high' }, st)).toBe(true);
    expect(loadAiToken(st)).toBe('abc');
    expect(loadAiPreferencias(st)).toEqual({ modelo: 'opus', esforco: 'high' });
  });

  it('salvar o token mantém a preferência', () => {
    const st = memoryStorage();
    saveAiPreferencias({ modelo: 'haiku', esforco: 'low' }, st);
    saveAiToken('xyz', st);
    expect(loadAiPreferencias(st)).toEqual({ modelo: 'haiku', esforco: 'low' });
  });

  it('valor inválido salvo volta ao padrão', () =>
    expect(loadAiPreferencias(memoryStorage({ [AI_SETTINGS_KEY]: '{"preferencias":{"modelo":"gpt","esforco":"high"}}' })))
      .toEqual({ modelo: 'sonnet', esforco: 'medium' }));
});

describe('descreverSessao', () => {
  const prefs = { modelo: 'sonnet', esforco: 'medium' } as const;

  it('sem informação da sessão não mostra nada', () =>
    expect(descreverSessao(null, prefs)).toEqual({ atual: null, aviso: null }));

  it('sessão igual à preferência: só o modelo atual', () =>
    expect(descreverSessao({ modelo: 'sonnet', esforco: 'medium' }, prefs))
      .toEqual({ atual: 'Sonnet · esforço médio', aviso: null }));

  it('sessão diferente: avisa que a preferência vale ao reiniciar', () =>
    expect(descreverSessao({ modelo: 'sonnet', esforco: 'medium' }, { modelo: 'opus', esforco: 'high' }))
      .toEqual({
        atual: 'Sonnet · esforço médio',
        aviso: 'Sua preferência (Opus · esforço alto) vale ao reiniciar o financas.',
      }));

  it('valores desconhecidos aparecem como vieram', () =>
    expect(descreverSessao({ modelo: 'claude-x', esforco: 'xhigh' }, prefs).atual).toBe('claude-x · esforço xhigh'));
});
