export type Investment = {
  id: string;
  name: string;
  amount: number;
  type: string;
};

export type Bank = {
  id: string;
  name: string;
  balance: number;
  investments: Investment[];
};

export type Crypto = {
  id: string;
  symbol: string;
  amount: number;
  purchasePrice: number;
};

export type Loan = {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  dueDate: string;
};

export type MonthlyGrowth = {
  month: string;
  totalPatrimony: number;
};

export type FinanceData = {
  banks: Bank[];
  cryptos: Crypto[];
  loans: Loan[];
  monthlyGrowth: MonthlyGrowth[];
  diversification: {
    stocks: number;
    crypto: number;
    fixedIncome: number;
    cash: number;
  };
};

export type Currency = 'BRL' | 'USD';
