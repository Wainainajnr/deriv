"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, BarChart2, Target } from "lucide-react";
import { useTradingData } from "@/context/TradingDataProvider";

export function StrategyTwoExplanation() {
  const { analysis } = useTradingData();
  const { digitCounts } = analysis;

  const totalDigits = digitCounts.reduce((a, b) => a + b, 0);
  const digitPercentages = digitCounts.map(count => totalDigits > 0 ? (count / totalDigits) * 100 : 0);
  const oddDigits = [1, 3, 5, 7, 9];

  // Condition checks based on current analysis state
  const condition1 = analysis.evenOddPercentage.odd >= 70;
  const last20patterns = analysis.patternHistory.split(' ').slice(0, 20);
  const condition2 = last20patterns.filter(p => p === 'O').length > last20patterns.filter(p => p === 'E').length;
  const oddDigitWithHighestPercentage = Math.max(...oddDigits.map(d => digitPercentages[d])) === Math.max(...digitPercentages);
  const condition3 = oddDigitWithHighestPercentage;
  const condition4 = oddDigits.filter(d => digitPercentages[d] > 11).length >= 2;

  const allConditionsMet = condition1 && condition2 && condition3 && condition4;

  const ConditionPill = ({ passed, children }: { passed: boolean; children: React.ReactNode }) => (
    <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${passed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
      {passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span>{children}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Strategy 2: The Odd Dominator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground">This strategy focuses on identifying a strong dominance of ODD digits and entering on a specific pattern trigger.</p>
            <div>
                <h4 className="font-bold mb-2">Odd Digits & Recommended Markets</h4>
                <div className="flex flex-wrap gap-2">
                    {[1, 3, 5, 7, 9].map(d => <Badge key={d} variant="outline" className="text-accent border-accent">{d}</Badge>)}
                </div>
                 <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">Volatility 10 (1s)</Badge>
                    <Badge variant="secondary">Volatility 25 (1s)</Badge>
                    <Badge variant="secondary">Volatility 50 Index</Badge>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="text-primary"/> Strategy Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <ConditionPill passed={condition1}>
                    70%+ ODD win rate (Current: {analysis.evenOddPercentage.odd.toFixed(2)}%)
                </ConditionPill>
                <ConditionPill passed={condition2}>
                    ODD digits dominate last 20 pattern
                </ConditionPill>
                <ConditionPill passed={condition3}>
                    An ODD digit has the highest %
                </ConditionPill>
                <ConditionPill passed={condition4}>
                    Two or more ODD digits have 11%+ occurrence
                </ConditionPill>
            </CardContent>
        </Card>
        <Card className={`glass-card border-2 ${analysis.entryCondition === 'ENTER ODD NOW' ? 'border-primary' : 'border-card'}`}>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Target className="text-primary"/> Entry Point Rule</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-muted-foreground">When all strategy conditions are met, the entry signal appears.</p>
                <div className="font-code text-center p-4 bg-black/30 rounded-md text-lg">
                    Wait for: <span className="text-primary">E</span> <span className="text-primary">E</span> <span className="text-primary">E</span> ... then ENTER after first <span className="text-accent">O</span>
                </div>
                 {analysis.entryCondition === 'ENTER ODD NOW' && (
                    <div className="p-4 bg-primary/20 text-primary rounded-md text-center font-bold text-xl animate-pulse">
                        ENTRY SIGNAL: ENTER ODD NOW
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
