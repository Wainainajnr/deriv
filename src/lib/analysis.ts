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

  // Use last 20-30 ticks for analysis, up to the max available (100)
  const analysisTicks = digits.slice(0, 30);

  let evenCount = 0;
  let oddCount = 0;
  const digitCounts = Array(10).fill(0);

  analysisTicks.forEach(digit => {
    if (digit % 2 === 0) {
      evenCount++;
    } else {
      oddCount++;
    }
    digitCounts[digit]++; // This is still based on all 100 ticks for overall frequency
  });

  digits.forEach(d => {
      digitCounts[d]++;
  });

  const total = analysisTicks.length;
  const evenWinRate = total > 0 ? (evenCount / total) * 100 : 0;
  const oddWinRate = total > 0 ? (oddCount / total) * 100 : 0;

  const evenOddPercentage = {
    even: evenWinRate,
    odd: oddWinRate,
  };
  
  const patternHistory = digits.slice(0, 20).map(d => (d % 2 === 0 ? 'E' : 'O')).join(' ');
  
  let patternDominance = 'None';
  if (evenWinRate > oddWinRate) {
    patternDominance = 'Evens';
  } else if (oddWinRate > evenWinRate) {
    patternDominance = 'Odds';
  }

  // Signal Strength
  let signalStrength: 'weak' | 'medium' | 'strong' = 'weak';
  const dominancePercentage = Math.max(evenWinRate, oddWinRate);
  if (dominancePercentage > 60) signalStrength = 'medium';
  if (dominancePercentage > 70) signalStrength = 'strong';

  // Entry Conditions
  let entryCondition: 'ENTER EVEN NOW' | 'ENTER ODD NOW' | 'NO ENTRY' = 'NO ENTRY';

  // Trend Stability Check (last 5 ticks)
  const lastFiveTicks = digits.slice(0, 5);
  const lastFiveAreEven = lastFiveTicks.every(d => d % 2 === 0);
  const lastFiveAreOdd = lastFiveTicks.every(d => d % 2 !== 0);

  // ✅ EVEN STRATEGY
  if (
    evenWinRate >= 55 && // 1. Even win rate is 55%+
    patternDominance === 'Evens' && // 2. Even ("E") dominates visually in the pattern
    evenCount > oddCount && // 3. The last 20-30 ticks show higher occurrence of Even
    lastFiveTicks.filter(d => d % 2 === 0).length >= 4 // 4. Trend stability (at least 4 of last 5)
  ) {
    entryCondition = 'ENTER EVEN NOW';
  }
  // ✅ ODD STRATEGY
  else if (
    oddWinRate >= 55 && // 1. Odd win rate is 55%+
    patternDominance === 'Odds' && // 2. Odd ("O") pattern dominates
    oddCount > evenCount && // 3. Last 20-30 ticks show higher frequency of Odd
    lastFiveTicks.filter(d => d % 2 !== 0).length >= 4 // 4. Trend stability (at least 4 of last 5)
  ) {
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
