
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useDerivWebSocket } from '@/hooks/useDerivWebSocket';
import { useAuth } from './AuthProvider';
import type { TickResponse, BalanceResponse, AuthorizeResponse, OpenContract, PortfolioResponse, BuyResponse, TransactionResponse, SimulatedContract } from '@/types/deriv';
import { analyzeDigits, type DigitAnalysis, type Strategy, getLastDigit } from '@/lib/analysis';
import { useToast } from '@/hooks/use-toast';

const MAX_TICKS = 100;
const SIMULATION_STARTING_BALANCE = 10000;
const SIMULATED_PAYOUT_PERCENTAGE = 0.95; // 95% payout for simulated wins

interface TradingDataContextType {
  isConnected: boolean;
  symbol: string;
  setSymbol: (symbol: string) => void;
  strategy: Strategy;
  setStrategy: (strategy: Strategy) => void;
  stake: string;
  setStake: (stake: string) => void;
  ticks: TickResponse['tick'][];
  analysis: DigitAnalysis;
  balance: number;
  currency: string;
  activeContracts: OpenContract[];
  buyContract: (contractType: 'DIGITEVEN' | 'DIGITODD', stake: number) => void;
  lastTradeResult: { status: 'won' | 'lost', profit: number } | null;
}

const TradingDataContext = createContext<TradingDataContextType | undefined>(undefined);

export function TradingDataProvider({ children }: { children: ReactNode }) {
  const { isConnected, sendMessage, subscribe } = useDerivWebSocket();
  const { selectedAccount, token, isLoggedIn, isSimulationMode } = useAuth();
  const [symbol, setSymbolState] = useState('R_100');
  const [strategy, setStrategy] = useState<Strategy>('strategy1');
  const [stake, setStake] = useState('1');
  const [ticks, setTicks] = useState<TickResponse['tick'][]>([]);
  const [analysis, setAnalysis] = useState<DigitAnalysis>({
    lastDigit: null,
    evenOddPercentage: { even: 0, odd: 0 },
    digitCounts: Array(10).fill(0),
    patternHistory: '',
    patternDominance: 'None',
    signalStrength: 'weak',
    entryCondition: 'NO ENTRY',
  });
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [activeContracts, setActiveContracts] = useState<OpenContract[]>([]);
  const [lastTradeResult, setLastTradeResult] = useState<{ status: 'won' | 'lost', profit: number } | null>(null);

  const [simulatedContracts, setSimulatedContracts] = useState<SimulatedContract[]>([]);
  const { toast } = useToast();

  const setSymbol = useCallback((newSymbol: string) => {
    if (newSymbol === symbol) return;
    sendMessage({ forget_all: 'ticks' });
    setTicks([]);
    setSymbolState(newSymbol);
  }, [symbol, sendMessage]);
  
  // Set initial balance for simulation mode
  useEffect(() => {
    if (isSimulationMode) {
      const storedSimBalance = localStorage.getItem('deriv_sim_balance');
      if (storedSimBalance) {
        setBalance(parseFloat(storedSimBalance));
      } else {
        setBalance(SIMULATION_STARTING_BALANCE);
      }
      setCurrency('USD');
    }
  }, [isSimulationMode]);


  // Subscribe to public ticks data as soon as connected
  useEffect(() => {
    if (isConnected) {
        sendMessage({ ticks: symbol });
    }
  }, [isConnected, symbol, sendMessage]);

  // Subscribe to private, authenticated data only when logged in
  useEffect(() => {
    if (isConnected && isLoggedIn) {
        sendMessage({ balance: 1, subscribe: 1 });
        sendMessage({ portfolio: 1 });
        sendMessage({ transaction: 1, subscribe: 1 });
    }
  }, [isConnected, isLoggedIn, sendMessage]);

  // Handle incoming WebSocket messages for REAL mode
  useEffect(() => {
    if (isSimulationMode) return;

    subscribe('authorize', (msg) => {
      const authMsg = msg as AuthorizeResponse;
      setBalance(authMsg.authorize.balance);
      setCurrency(authMsg.authorize.currency);
    });
    
    subscribe('balance', (msg) => {
        const balanceMsg = msg as BalanceResponse;
        if (balanceMsg.balance.loginid === selectedAccount?.loginid) {
            setBalance(balanceMsg.balance.balance);
            setCurrency(balanceMsg.balance.currency);
        }
    });

    subscribe('tick', (msg) => {
      const tickMsg = msg as TickResponse;
      if (tickMsg.tick && tickMsg.tick.symbol === symbol) {
        setTicks(prev => [tickMsg.tick, ...prev.slice(0, MAX_TICKS - 1)]);
      }
    });

    subscribe('portfolio', (msg) => {
        const portfolioMsg = msg as PortfolioResponse;
        if (portfolioMsg.portfolio) {
            setActiveContracts(portfolioMsg.portfolio.contracts);
        }
    });
    
    subscribe('transaction', (msg) => {
        const transactionMsg = msg as TransactionResponse;
        if (transactionMsg.transaction.action === 'sell') {
             const contract = activeContracts.find(c => c.contract_id === transactionMsg.transaction.contract_id);
             if (contract) {
                const profit = transactionMsg.transaction.amount - contract.buy_price;
                setLastTradeResult({
                    status: profit >= 0 ? 'won' : 'lost',
                    profit,
                });
             }
             sendMessage({ portfolio: 1 }); // Refresh portfolio
        }
    });

  }, [subscribe, sendMessage, selectedAccount, activeContracts, symbol, isSimulationMode, isLoggedIn]);


  // Handle incoming WebSocket messages for SIMULATION mode
  useEffect(() => {
    if (!isSimulationMode) return;

    const handleTick = (msg: any) => {
      const tickMsg = msg as TickResponse;
      if (tickMsg.tick && tickMsg.tick.symbol === symbol) {
        const newTick = tickMsg.tick;
        setTicks(prev => [newTick, ...prev.slice(0, MAX_TICKS - 1)]);

        // Settle simulated contracts
        setSimulatedContracts(prevContracts => {
          const stillOpen: SimulatedContract[] = [];
          let totalPayout = 0;
          let newTradeResult = null;

          prevContracts.forEach(contract => {
            if (newTick.epoch > contract.entry_tick_time) {
              const exitDigit = getLastDigit(newTick.quote);
              const isWin = (contract.contract_type === 'DIGITEVEN' && exitDigit % 2 === 0) ||
                              (contract.contract_type === 'DIGITODD' && exitDigit % 2 !== 0);

              const profit = isWin ? contract.payout - contract.buy_price : -contract.buy_price;
              if(isWin) {
                  totalPayout += contract.payout;
              }
              newTradeResult = { status: isWin ? 'won' : 'lost', profit };
            } else {
              stillOpen.push(contract);
            }
          });
          
          if(newTradeResult) {
            setLastTradeResult(newTradeResult);
          }

          if (totalPayout > 0) {
            setBalance(prev => {
                const newBalance = prev + totalPayout;
                localStorage.setItem('deriv_sim_balance', newBalance.toString());
                return newBalance;
            });
          }
          return stillOpen;
        });
      }
    };
    
    subscribe('tick', handleTick);

  }, [isSimulationMode, symbol, subscribe]);


  useEffect(() => {
    const newAnalysis = analyzeDigits(ticks, strategy);
    setAnalysis(newAnalysis);
  }, [ticks, strategy]);
  
  const buyContract = useCallback((contractType: 'DIGITEVEN' | 'DIGITODD', stake: number) => {
      if (isSimulationMode) {
            const currentTick = ticks[0];
            if (!currentTick) {
                toast({ title: "Waiting for market data...", variant: "destructive" });
                return;
            }
            const newBalance = balance - stake;
            if (newBalance < 0) {
                toast({ title: "Insufficient simulated funds", variant: "destructive" });
                return;
            }
            setBalance(newBalance);
            localStorage.setItem('deriv_sim_balance', newBalance.toString());

            const newContract: SimulatedContract = {
                contract_id: Date.now(),
                buy_price: stake,
                payout: stake * SIMULATED_PAYOUT_PERCENTAGE, // Payout is stake + profit
                contract_type: contractType,
                entry_tick_time: currentTick.epoch,
                shortcode: `SIM_${contractType}_${symbol}_${stake.toFixed(2)}`,
                status: 'open',
            };
            setSimulatedContracts(prev => [...prev, newContract]);
            return;
      }

      if (!isLoggedIn) {
          toast({ title: "Please log in to trade.", variant: "destructive" });
          return;
      }
      sendMessage({
          buy: "1",
          price: stake,
          parameters: {
              amount: stake,
              basis: 'stake',
              contract_type: contractType,
              currency: currency,
              duration: 1,
              duration_unit: 't',
              symbol: symbol,
          }
      });
  }, [sendMessage, currency, symbol, isLoggedIn, isSimulationMode, balance, ticks, toast]);

  const displayedContracts = isSimulationMode 
    ? simulatedContracts.map(c => ({
        ...c, 
        profit: 0, // profit is unknown until settled
        currency: 'USD',
        is_valid_to_sell: 0,
        is_settleable: 0,
        is_expired: 0,
        longcode: c.shortcode,
    } as OpenContract)) 
    : activeContracts;


  const value = {
    isConnected,
    symbol,
    setSymbol,
    strategy,
    setStrategy,
    stake,
    setStake,
    ticks,
    analysis,
    balance,
    currency,
    activeContracts: displayedContracts,
    buyContract,
    lastTradeResult,
  };

  return <TradingDataContext.Provider value={value}>{children}</TradingDataContext.Provider>;
}

export const useTradingData = () => {
  const context = useContext(TradingDataContext);
  if (context === undefined) {
    throw new Error('useTradingData must be used within a TradingDataProvider');
  }
  return context;
};
