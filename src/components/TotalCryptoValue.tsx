import { useEffect, useState } from 'react';
import { getCryptoPrice } from '../services/api';
import type { Crypto } from '../types/index.js';

interface TotalCryptoValueProps {
  cryptos: Crypto[];
}

export const TotalCryptoValue = ({ cryptos }: TotalCryptoValueProps) => {
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const fetchTotal = async () => {
      const prices = await Promise.all(
        cryptos.map(async (crypto) => {
          const price = await getCryptoPrice(crypto.symbol, 'USD');
          return crypto.amount * price;
        })
      );
      setTotal(prices.reduce((sum, val) => sum + val, 0));
    };

    fetchTotal();
    const interval = setInterval(fetchTotal, 60000);
    return () => clearInterval(interval);
  }, [cryptos]);

  return total;
};
