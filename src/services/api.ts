const COINGECKO_API_KEY = 'CG-VxtRSDPuKGz2Ahb73Uw1tQEr';

export const getCryptoPrice = async (symbol: string, convertTo: string = 'USD') => {
  try {
    const cryptoMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
    };
    
    const cryptoId = cryptoMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const currency = convertTo.toLowerCase();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${currency}`,
      {
        headers: {
          'x-cg-demo-api-key': COINGECKO_API_KEY,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const price = data[cryptoId]?.[currency];
      return price ? parseFloat(price.toFixed(2)) : 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    return 0;
  }
};

export const getExchangeRate = async () => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    return data.rates.BRL || 5.0;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 5.0;
  }
};
