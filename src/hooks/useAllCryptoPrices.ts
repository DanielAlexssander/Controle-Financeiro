import { useEffect, useState } from 'react';
import { getCryptoPrice } from '../services/api';
import type { Crypto } from '../types/index.js';

export const useAllCryptoPrices = (cryptos: Crypto[]) => {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      const priceMap: Record<string, number> = {};
      
      await Promise.all(
        cryptos.map(async (crypto) => {
          const price = await getCryptoPrice(crypto.symbol, 'USD');
          priceMap[crypto.symbol] = price;
        })
      );
      
      setPrices(priceMap);
      setLoading(false);
    };

    if (cryptos.length > 0) {
      fetchPrices();
      const interval = setInterval(fetchPrices, 60000);
      return () => clearInterval(interval);
    }
  }, [cryptos.length]);

  const getTotalValue = () => {
    return cryptos.reduce((sum, crypto) => {
      const price = prices[crypto.symbol] || 0;
      return sum + (crypto.amount * price);
    }, 0);
  };

  const getCryptoValue = (symbol: string, amount: number) => {
    return (prices[symbol] || 0) * amount;
  };

  return { prices, loading, getTotalValue, getCryptoValue };
};
