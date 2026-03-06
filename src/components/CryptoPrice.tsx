import { useEffect, useState } from 'react';
import { getCryptoPrice } from '../services/api';

interface CryptoPriceProps {
  symbol: string;
  amount: number;
}

export const CryptoPrice = ({ symbol, amount }: CryptoPriceProps) => {
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    const fetchPrice = async () => {
      const p = await getCryptoPrice(symbol, 'USD');
      setPrice(p);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  return <>${(amount * price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>;
};
