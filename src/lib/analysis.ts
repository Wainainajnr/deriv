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

function getLastDigit(price: number): number {
  const priceStr = price.toString();
  return parseInt(priceStr[priceStr.length - 1], 10);
}

export function analyzeDigits(ticks: TickResponse['tick'][]): DigitAnalysis {
  if (ticks.length === 0) {
    return {
      lastDigit: null,
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
  const evenOddPercentage = {
    even: total > 0 ? (evenCount / total) * 100 : 0,
    odd: total > 0 ? (oddCount / total) * 100 : 0,
  };

  const patternHistory = digits.slice(0, 20).map(d => (d % 2 === 0 ? 'E' : 'O')).join(' ');

  let patternDominance = 'None';
  if (evenOddPercentage.even > 55) {
    patternDominance = `Evens by ${evenOddPercentage.even.toFixed(0)}%`;
  } else if (evenOddPercentage.odd > 55) {
    patternDominance = `Odds by ${evenOddPercentage.odd.toFixed(0)}%`;
  }

  // Signal Strength
  let signalStrength: 'weak' | 'medium' | 'strong' = 'weak';
  const dominance = Math.max(evenOddPercentage.even, evenOddPercentage.odd);
  if (dominance > 60) signalStrength = 'medium';
  if (dominance > 70) signalStrength = 'strong';

  // Entry Conditions
  let entryCondition: 'ENTER EVEN NOW' | 'ENTER ODD NOW' | 'NO ENTRY' = 'NO ENTRY';
  
  const last10Patterns = digits.slice(0, 10);
  const evensInLast10 = last10Patterns.filter(d => d % 2 === 0).length;
  const oddsInLast10 = 10 - evensInLast10;

  if (evenOddPercentage.even >= 55 && digitCounts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b) > digits.length / 2 && evensInLast10 >= 6) {
    entryCondition = 'ENTER EVEN NOW';
  } else if (evenOddPercentage.odd >= 55 && digitCounts.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b) > digits.length / 2 && oddsInLast10 >= 6) {
    entryCondition = 'ENTER ODD NOW';
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
