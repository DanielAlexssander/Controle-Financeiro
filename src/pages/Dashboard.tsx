import { useState } from 'react';
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuBitcoin,
  LuChartPie,
  LuChartNoAxesCombined,
  LuCoins,
  LuLandmark,
  LuPlus,
  LuWallet,
  LuHandCoins,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { useFinance } from '../context/FinanceContext';
import { useCurrencyRates } from '../hooks/useCurrencyRates';
import { useAllCryptoPrices } from '../hooks/useAllCryptoPrices';
import { AllocationChart, HistoryChart } from '../components/FinanceCharts';
import { CoinArtwork } from '../components/CoinArtwork';
import { BankName } from '../components/BankName';
import { PageHeader } from '../components/PageHeader';
import type { Currency } from '../types/index.js';

function Metric({
  icon: Icon,
  title,
  amount,
  detail,
  tone,
}: {
  icon: IconType;
  title: string;
  amount: string;
  detail: string;
  tone: string;
}) {
  return (
    <section className={'metric ' + tone}>
      <div className="metric-title">
        <span className="metric-icon">
          <Icon size={19} />
        </span>
        <h2>{title}</h2>
      </div>
      <strong>{amount}</strong>
      <small>{detail}</small>
    </section>
  );
}

export function Dashboard({ onManage }: { onManage: () => void }) {
  const { data } = useFinance();
  const { usdToBrl } = useCurrencyRates();
  const { getTotalValue, getCryptoValue } = useAllCryptoPrices(data.cryptos);
  const [currency, setCurrency] = useState<Currency>('BRL');
  const usd = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency });
  const convert = (brl: number) => (currency === 'BRL' ? brl : brl / usdToBrl);
  const format = (brl: number) => money.format(convert(brl));
  const investments = data.banks.flatMap((b) => b.investments);
  const banks = data.banks.reduce((sum, b) => sum + b.balance, 0);
  const invested = investments.reduce((sum, i) => sum + i.amount, 0);
  const cryptoUSD = getTotalValue();
  const cryptoBRL = cryptoUSD * usdToBrl;
  const loans = data.loans.reduce((sum, l) => sum + l.amount, 0);
  const grouped = investments.reduce((acc, i) => {
    const type = i.type || 'Outros';
    acc.set(type, (acc.get(type) || 0) + i.amount);
    return acc;
  }, new Map<string, number>());
  const allocation = Array.from(grouped, ([name, value]) => ({ name, value }));
  if (cryptoBRL > 0) allocation.push({ name: 'Criptomoedas', value: cryptoBRL });
  const cryptoGroups = new Map<string, number>();
  for (const item of data.cryptos) {
    cryptoGroups.set(
      item.symbol,
      Number(
        ((cryptoGroups.get(item.symbol) || 0) + getCryptoValue(item.symbol, item.amount)).toFixed(
          2,
        ),
      ),
    );
  }
  const cryptoColors: Record<string, string> = { BTC: '#de9a46', ETH: '#8698ce', USDT: '#499579' };
  const cryptoAllocation = Array.from(cryptoGroups, ([name, value]) => ({
    name,
    value,
    color: cryptoColors[name.toUpperCase()],
  }));
  const cryptoTotal = cryptoAllocation.reduce((sum, c) => sum + c.value, 0);
  const monthKey = (m: string) => {
    const [month, year] = m.split('/').map(Number);
    return year * 12 + month;
  };
  const history = [...data.monthlyGrowth].sort((a, b) => monthKey(a.month) - monthKey(b.month));
  const changes = history
    .slice(1)
    .map(
      (r, i) => ((r.totalPatrimony - history[i].totalPatrimony) / history[i].totalPatrimony) * 100,
    );
  const percent = (value: number) =>
    value.toLocaleString('pt-BR', { maximumFractionDigits: 2, signDisplay: 'exceptZero' }) + '%';
  return (
    <div className="page dashboard">
      <PageHeader
        title="Visão geral"
        description="Acompanhe seu patrimônio e a composição da sua carteira."
      >
        <div className="currency-control" role="group" aria-label="Moeda de exibição">
          {(['BRL', 'USD'] as const).map((c) => (
            <button key={c} aria-pressed={currency === c} onClick={() => setCurrency(c)}>
              {c}
            </button>
          ))}
        </div>
      </PageHeader>
      <section className="balance-card">
        <div className="balance-copy">
          <h2>
            <LuWallet size={17} /> Patrimônio total
          </h2>
          <strong>{format(banks + cryptoBRL + loans)}</strong>
          <p>Saldo em bancos, criptomoedas e empréstimos.</p>
        </div>
        <CoinArtwork />
      </section>
      <div className="metrics">
        <Metric
          icon={LuChartNoAxesCombined}
          title="Investimentos"
          amount={format(invested)}
          detail={
            investments.length +
            (investments.length === 1 ? ' ativo cadastrado' : ' ativos cadastrados')
          }
          tone="sage"
        />
        <Metric
          icon={LuBitcoin}
          title="Criptomoedas"
          amount={currency === 'USD' ? usd.format(cryptoUSD) : format(cryptoBRL)}
          detail={
            data.cryptos.length +
            (data.cryptos.length === 1 ? ' posição na carteira' : ' posições na carteira')
          }
          tone="sand"
        />
        <Metric
          icon={LuHandCoins}
          title="Empréstimos"
          amount={format(loans)}
          detail={
            data.loans.length +
            (data.loans.length === 1 ? ' empréstimo concedido' : ' empréstimos concedidos')
          }
          tone="lilac"
        />
      </div>
      <div className="overview-grid">
        <section className="panel">
          <header className="panel-heading">
            <h2>
              <LuLandmark />
              Bancos
            </h2>
            <span className="count">{data.banks.length}</span>
          </header>
          {data.banks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <LuLandmark />
              </span>
              <strong>Nenhum banco cadastrado</strong>
              <button className="text-action" onClick={onManage}>
                <LuPlus size={15} /> Adicionar banco
              </button>
            </div>
          ) : (
            <div className="record-list">
              {data.banks.map((b) => (
                <article key={b.id}>
                  <div className="record-line">
                    <strong><BankName name={b.name} /></strong>
                    <b>{format(b.balance)}</b>
                  </div>
                  {b.investments.map((i) => (
                    <div className="investment-line" key={i.id}>
                      <span>
                        {i.name} <small>{i.type}</small>
                      </span>
                      <span>{format(i.amount)}</span>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="panel allocation-panel">
          <header className="panel-heading">
            <h2>
              <LuChartPie />
              Diversificação
            </h2>
          </header>
          <AllocationChart
            items={allocation}
            total={invested + cryptoBRL}
            format={format}
            emptyText="Cadastre investimentos para ver a distribuição."
          />
        </section>
      </div>
      {history.length > 0 && (
        <section className="panel history-panel">
          <header className="panel-heading">
            <h2>
              <LuChartNoAxesCombined />
              Crescimento mensal
            </h2>
          </header>
          {changes.length > 0 && (
            <div className="growth-details">
              <span>
                Variação <b>{percent(changes[changes.length - 1])}</b>
              </span>
              <span>
                Média <b>{percent(changes.reduce((a, b) => a + b, 0) / changes.length)}</b>
              </span>
            </div>
          )}
          <HistoryChart
            months={history.map((r) => r.month)}
            values={history.map((r) => Number(convert(r.totalPatrimony).toFixed(2)))}
            currency={currency}
          />
        </section>
      )}
      {data.cryptos.length > 0 && (
        <div className="overview-grid">
          <section className="panel">
            <header className="panel-heading">
              <h2>
                <LuCoins />
                Carteira de criptomoedas
              </h2>
              <span className="count">{data.cryptos.length}</span>
            </header>
            <div className="record-list" role="region" aria-label="Posições em criptomoedas" tabIndex={0}>
              {data.cryptos.map((c) => {
                const value = Number(getCryptoValue(c.symbol, c.amount).toFixed(2));
                const cost = Number((c.purchasePrice * c.amount).toFixed(2));
                const profit = Number((value - cost).toFixed(2));
                const variation = cost > 0 ? (profit / cost) * 100 : 0;
                return (
                  <article key={c.id}>
                    <div className="record-line">
                      <strong>{c.symbol}</strong>
                      <b>{usd.format(value)}</b>
                    </div>
                    <div className="investment-line">
                      <span>{c.amount} unidade(s)</span>
                      <span>Compra {usd.format(c.purchasePrice)}/un</span>
                    </div>
                    <span className={variation >= 0 ? 'gain' : 'loss'}>
                      {variation >= 0 ? <LuArrowUpRight /> : <LuArrowDownLeft />}
                      {percent(variation)}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="panel allocation-panel">
            <header className="panel-heading">
              <h2>
                <LuChartPie />
                Distribuição de criptomoedas
              </h2>
            </header>
            <AllocationChart
              items={cryptoAllocation}
              total={cryptoTotal}
              format={usd.format}
              emptyText="Nenhuma posição na carteira."
            />
          </section>
        </div>
      )}
    </div>
  );
}
