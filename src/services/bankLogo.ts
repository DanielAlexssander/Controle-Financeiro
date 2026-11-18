import { banksData } from 'react-bancos/data';
import incoLogo from '../assets/inco.png';
import steamLogo from '../assets/steam.svg';

const icons = import.meta.glob<string>('/node_modules/react-bancos/icons/*.svg', {
  eager: true,
  import: 'default',
  query: '?url&no-inline',
});

const normalize = (name: string) => name.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  .replace(/\s+s\.?\s*a\.?$/, '').replace(/[^a-z0-9]+/g, '');

const logos = new Map<string, string>([
  ['valve', steamLogo],
  ['inco', incoLogo],
]);
for (const bank of banksData) {
  const url = icons[`/node_modules/react-bancos/icons/${bank.slug}.svg`];
  if (url && bank.slug !== 'outros') {
    logos.set(normalize(bank.name), url);
    logos.set(bank.slug, url);
    if (bank.compe) logos.set(bank.compe, url);
  }
}

const aliases = new Map(Object.entries({
  bb: 'bancodobrasil', cef: 'caixa', c6: 'c6bank', btg: 'btgpactual',
  nu: 'nubank', nupagamentos: 'nubank', santanderbrasil: 'santander', xpinvestimentos: 'xp',
  steam: 'valve', incoinvestimentos: 'inco', incosep: 'inco',
}));

export function getBankLogo(name: string) {
  const key = normalize(name);
  const shortName = key.replace(/^banco/, '');
  return logos.get(key) ?? logos.get(aliases.get(shortName) ?? shortName);
}
