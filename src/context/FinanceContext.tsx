import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { FinanceData, Bank, Crypto, Loan, MonthlyGrowth } from '../types/index.js';

interface FinanceContextType {
  data: FinanceData;
  addBank: (bank: Bank) => void;
  updateBank: (id: string, bank: Bank) => void;
  deleteBank: (id: string) => void;
  addCrypto: (crypto: Crypto) => void;
  updateCrypto: (id: string, crypto: Crypto) => void;
  deleteCrypto: (id: string) => void;
  addLoan: (loan: Loan) => void;
  updateLoan: (id: string, loan: Loan) => void;
  deleteLoan: (id: string) => void;
  addMonthlyGrowth: (growth: MonthlyGrowth) => void;
  updateMonthlyGrowth: (month: string, growth: MonthlyGrowth) => void;
  deleteMonthlyGrowth: (month: string) => void;
  updateDiversification: (diversification: FinanceData['diversification']) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = 'finance-data';

const initialData: FinanceData = {
  banks: [],
  cryptos: [],
  loans: [],
  monthlyGrowth: [],
  diversification: { stocks: 0, crypto: 0, fixedIncome: 0, cash: 0 },
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<FinanceData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addBank = (bank: Bank) => setData(d => ({ ...d, banks: [...d.banks, bank] }));
  const updateBank = (id: string, bank: Bank) => setData(d => ({ ...d, banks: d.banks.map(b => b.id === id ? bank : b) }));
  const deleteBank = (id: string) => setData(d => ({ ...d, banks: d.banks.filter(b => b.id !== id) }));

  const addCrypto = (crypto: Crypto) => setData(d => ({ ...d, cryptos: [...d.cryptos, crypto] }));
  const updateCrypto = (id: string, crypto: Crypto) => setData(d => ({ ...d, cryptos: d.cryptos.map(c => c.id === id ? crypto : c) }));
  const deleteCrypto = (id: string) => setData(d => ({ ...d, cryptos: d.cryptos.filter(c => c.id !== id) }));

  const addLoan = (loan: Loan) => setData(d => ({ ...d, loans: [...d.loans, loan] }));
  const updateLoan = (id: string, loan: Loan) => setData(d => ({ ...d, loans: d.loans.map(l => l.id === id ? loan : l) }));
  const deleteLoan = (id: string) => setData(d => ({ ...d, loans: d.loans.filter(l => l.id !== id) }));

  const addMonthlyGrowth = (growth: MonthlyGrowth) => setData(d => ({ ...d, monthlyGrowth: [...d.monthlyGrowth, growth] }));
  const updateMonthlyGrowth = (month: string, growth: MonthlyGrowth) => setData(d => ({ ...d, monthlyGrowth: d.monthlyGrowth.map(g => g.month === month ? growth : g) }));
  const deleteMonthlyGrowth = (month: string) => setData(d => ({ ...d, monthlyGrowth: d.monthlyGrowth.filter(g => g.month !== month) }));
  const updateDiversification = (diversification: FinanceData['diversification']) => setData(d => ({ ...d, diversification }));

  return (
    <FinanceContext.Provider value={{ data, addBank, updateBank, deleteBank, addCrypto, updateCrypto, deleteCrypto, addLoan, updateLoan, deleteLoan, addMonthlyGrowth, updateMonthlyGrowth, deleteMonthlyGrowth, updateDiversification }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
