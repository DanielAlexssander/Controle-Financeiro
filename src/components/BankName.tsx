import { getBankLogo } from '../services/bankLogo';

export function BankName({ name }: { name: string }) {
  const logo = getBankLogo(name);
  if (!logo) return <>{name}</>;

  return (
    <span className="bank-name">
      <img key={logo} src={logo} width="26" height="26" alt="" loading="lazy"
        onError={event => { event.currentTarget.hidden = true; }} />
      <span>{name}</span>
    </span>
  );
}
