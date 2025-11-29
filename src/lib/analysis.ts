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
  
  const digitCounts = Array(10).fill(0);
  ticks.forEach(tick => {
      const digit = getLastDigit(tick.quote);
      digitCounts[digit]++;
  });

  const total = ticks.length;
  const evenWinRate = total > 0 ? (digits.filter(d => d % 2 === 0).length / total) * 100 : 0;
  const oddWinRate = total > 0 ? (digits.filter(d => d % 2 !== 0).length / total) * 100 : 0;

  const evenOddPercentage = {
    even: evenWinRate,
    odd: oddWinRate,
  };
  
  const patternHistory = digits.slice(0, 20).map(d => (d % 2 === 0 ? 'E' : 'O')).join(' ');
  
  const analysisTicks = digits.slice(0, 30);
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

  const totalDigits = digitCounts.reduce((a, b) => a + b, 0);
  const digitPercentages = digitCounts.map(count => totalDigits > 0 ? (count / totalDigits) * 100 : 0);

  if (strategy === 'strategy1') {
    // ✅ EVEN STRATEGY (Strategy 1)
    const evenDigits = [0, 2, 4, 6, 8];
    const evenDigitPercentages = evenDigits.map(d => digitPercentages[d]);
    const maxEvenPercentage = Math.max(...evenDigitPercentages);
    const maxOverallPercentage = Math.max(...digitPercentages);
    const evenDigitWithHighestPercentage = maxEvenPercentage === maxOverallPercentage && maxEvenPercentage > 0;
    
    const twoEvenDigitsAbove11 = evenDigits.filter(d => digitPercentages[d] > 11).length >= 2;
    const last20patterns = digits.slice(0, 20);
    const evenDominatingLast20 = last20patterns.filter(d => d % 2 === 0).length > last20patterns.filter(d => d % 2 !== 0).length;
    
    // Entry point rule: Wait for 3+ 'O', then enter on first 'E'
    const last4ticks = digits.slice(0, 4);
    const isEntryPointTriggered = 
        last4ticks[0] % 2 === 0 && // current is EVEN
        last4ticks[1] % 2 !== 0 && // previous 3 were ODD
        last4ticks[2] % 2 !== 0 &&
        last4ticks[3] % 2 !== 0;

    if (
        evenWinRate >= 55 &&
        evenDominatingLast20 &&
        evenDigitWithHighestPercentage &&
        twoEvenDigitsAbove11 &&
        isEntryPointTriggered
    ) {
        entryCondition = 'ENTER EVEN NOW';
    }

    const dominancePercentage = evenWinRate;
    if (dominancePercentage > 60) signalStrength = 'medium';
    if (dominancePercentage > 70) signalStrength = 'strong';

  } else if (strategy === 'strategy2') {
    // ✅ ODD STRATEGY (Strategy 2)
    const oddDigits = [1, 3, 5, 7, 9];
    const oddDigitPercentages = oddDigits.map(d => digitPercentages[d]);
    const maxOddPercentage = Math.max(...oddDigitPercentages);
    const maxOverallPercentage = Math.max(...digitPercentages);
    const oddDigitWithHighestPercentage = maxOddPercentage === maxOverallPercentage && maxOddPercentage > 0;

    const twoOddDigitsAbove11 = oddDigits.filter(d => digitPercentages[d] > 11).length >= 2;
    const last20patterns = digits.slice(0, 20);
    const oddDominatingLast20 = last20patterns.filter(d => d % 2 !== 0).length > last20patterns.filter(d => d % 2 === 0).length;

    // Entry point rule: Wait for 3+ 'E', then enter on first 'O'
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
