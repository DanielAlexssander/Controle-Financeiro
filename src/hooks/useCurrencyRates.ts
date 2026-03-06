import { useState, useEffect } from 'react';
import { getCryptoPrice, getExchangeRate } from '../services/api';

export const useCurrencyRates = () => {
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [usdToBrl, setUsdToBrl] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      const [btc, rate] = await Promise.all([
        getCryptoPrice('BTC', 'USD'),
        getExchangeRate()
      ]);
      setBtcPrice(btc);
      setUsdToBrl(rate);
      setLoading(false);
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  return { btcPrice, usdToBrl, loading };
};

export const useCryptoPrice = (symbol: string, convertTo: string = 'USD') => {
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      const p = await getCryptoPrice(symbol, convertTo);
      setPrice(p);
      setLoading(false);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [symbol, convertTo]);

  return { price, loading };
};
