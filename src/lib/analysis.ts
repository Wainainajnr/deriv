import type { TickResponse } from "@/types/deriv";

export interface DigitAnalysis {
  lastDigit: number | null;
  evenOddPercentage: { even: number; odd: number };
  digitCounts: number[];
  patternHistory: string;
  patternDominance: string;
  signalStrength: 'weak' | 'medium' | 'strong';
  entryCondition: 'ENTER EVEN NOW' | 'ENTER ODD NOW' | 'NO ENTRY';
}

export type Strategy = 'strategy1' | 'strategy2';

function getLastDigit(price: number): number {
  const priceStr = price.toString();
  return parseInt(priceStr[priceStr.length - 1], 10);
}

export function analyzeDigits(ticks: TickResponse['tick'][], strategy: Strategy): DigitAnalysis {
  if (ticks.length < 5) { // Need at least 5 ticks for stability check
    return {
      lastDigit: ticks.length > 0 ? getLastDigit(ticks[0].quote) : null,
      evenOddPercentage: { even: 0, odd: 0 },
      digitCounts: Array(10).fill(0),
      patternHistory: '',
      patternDominance: 'None',
      signalStrength: 'weak',
      entryCondition: 'NO ENTRY',
    };
  }

  const lastDigit = getLastDigit(ticks[0].quote);
  const digits = ticks.map(tick => getLastDigit(tick.quote));
  const analysisTicks = digits.slice(0, 30);
  const totalAnalysisTicks = analysisTicks.length;

  let evenCount = 0;
  let oddCount = 0;
  const digitCounts = Array(10).fill(0);

  digits.forEach(digit => {
    if (digit % 2 === 0) {
      evenCount++;
    } else {
      oddCount++;
    }
    digitCounts[digit]++;
  });

  const total = digits.length;
  const evenWinRate = total > 0 ? (digits.filter(d => d % 2 === 0).length / total) * 100 : 0;
  const oddWinRate = total > 0 ? (digits.filter(d => d % 2 !== 0).length / total) * 100 : 0;

  const evenOddPercentage = {
    even: evenWinRate,
    odd: oddWinRate,
  };
  
  const patternHistory = digits.slice(0, 20).map(d => (d % 2 === 0 ? 'E' : 'O')).join(' ');
  
  let patternDominance = 'None';
  const recentEvenCount = analysisTicks.filter(d => d % 2 === 0).length;
  const recentOddCount = analysisTicks.filter(d => d % 2 !== 0).length;

  if (recentEvenCount > recentOddCount) {
    patternDominance = 'Evens';
  } else if (recentOddCount > recentEvenCount) {
    patternDominance = 'Odds';
  }

  let signalStrength: 'weak' | 'medium' | 'strong' = 'weak';
  let entryCondition: 'ENTER EVEN NOW' | 'ENTER ODD NOW' | 'NO ENTRY' = 'NO ENTRY';

  if (strategy === 'strategy1') {
    // ✅ EVEN STRATEGY (Strategy 1)
    const dominancePercentage = Math.max(evenWinRate, oddWinRate);
    if (dominancePercentage > 60) signalStrength = 'medium';
    if (dominancePercentage > 70) signalStrength = 'strong';
    
    const lastFiveTicks = digits.slice(0, 5);
    if (
      evenWinRate >= 55 &&
      patternDominance === 'Evens' &&
      recentEvenCount > recentOddCount &&
      lastFiveTicks.filter(d => d % 2 === 0).length >= 4
    ) {
      entryCondition = 'ENTER EVEN NOW';
    }
  } else if (strategy === 'strategy2') {
    // ✅ ODD STRATEGY (Strategy 2)
    const oddDigits = [1, 3, 5, 7, 9];
    const totalDigits = digitCounts.reduce((a, b) => a + b, 0);
    const digitPercentages = digitCounts.map(count => (count / totalDigits) * 100);

    const oddDigitWithHighestPercentage = Math.max(...oddDigits.map(d => digitPercentages[d])) === Math.max(...digitPercentages);
    const twoOddDigitsAbove11 = oddDigits.filter(d => digitPercentages[d] > 11).length >= 2;
    
    const last20patterns = digits.slice(0, 20);
    const oddDominatingLast20 = last20patterns.filter(d => d % 2 !== 0).length > last20patterns.filter(d => d % 2 === 0).length;

    // Entry point rule
    const last4ticks = digits.slice(0, 4);
    const isEntryPointTriggered = 
        last4ticks[0] % 2 !== 0 && // current is ODD
        last4ticks[1] % 2 === 0 && // previous 3 were EVEN
        last4ticks[2] % 2 === 0 &&
        last4ticks[3] % 2 === 0;

    if (
        oddWinRate >= 70 &&
        oddDominatingLast20 &&
        oddDigitWithHighestPercentage &&
        twoOddDigitsAbove11 &&
        isEntryPointTriggered
    ) {
        entryCondition = 'ENTER ODD NOW';
    }

    const dominancePercentage = oddWinRate;
    if (dominancePercentage > 75) signalStrength = 'medium';
    if (dominancePercentage > 85) signalStrength = 'strong';
  }
  
  return {
    lastDigit,
    evenOddPercentage,
    digitCounts,
    patternHistory,
    patternDominance,
    signalStrength,
    entryCondition,
  };
}
