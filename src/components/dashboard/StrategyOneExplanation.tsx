"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, BarChart2, Target } from "lucide-react";
import { useTradingData } from "@/context/TradingDataProvider";

export function StrategyOneExplanation() {
  const { analysis } = useTradingData();
  const { digitCounts } = analysis;

  const totalDigits = digitCounts.reduce((a, b) => a + b, 0);
  const digitPercentages = digitCounts.map(count => totalDigits > 0 ? (count / totalDigits) * 100 : 0);
  const evenDigits = [0, 2, 4, 6, 8];

  const last20patterns = analysis.patternHistory.split(' ').slice(0, 20);

  // Condition checks based on current analysis state
  const condition1 = analysis.evenOddPercentage.even >= 55;
  const condition2 = last20patterns.filter(p => p === 'E').length > last20patterns.filter(p => p === 'O').length;
  const evenDigitWithHighestPercentage = Math.max(...evenDigits.map(d => digitPercentages[d])) === Math.max(...digitPercentages);
  const condition3 = evenDigitWithHighestPercentage;
  const condition4 = evenDigits.filter(d => digitPercentages[d] > 11).length >= 2;

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
          <CardTitle>Strategy 1: The Even Dominator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground">This strategy focuses on identifying a strong dominance of EVEN digits and entering on a specific pattern trigger.</p>
            <div>
                <h4 className="font-bold mb-2">Even Digits</h4>
                <div className="flex flex-wrap gap-2">
                    {evenDigits.map(d => <Badge key={d} variant="outline" className="text-primary border-primary">{d}</Badge>)}
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
                    55%+ EVEN win rate (Current: {analysis.evenOddPercentage.even.toFixed(2)}%)
                </ConditionPill>
                <ConditionPill passed={condition2}>
                    EVEN digits dominate last 20 pattern
                </ConditionPill>
                <ConditionPill passed={condition3}>
                    An EVEN digit has the highest %
                </ConditionPill>
                <ConditionPill passed={condition4}>
                    Two or more EVEN digits have 11%+ occurrence
                </ConditionPill>
            </CardContent>
        </Card>
        <Card className={`glass-card border-2 ${analysis.entryCondition === 'ENTER EVEN NOW' ? 'border-primary' : 'border-card'}`}>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2"><Target className="text-primary"/> Entry Point Rule</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-muted-foreground">When all strategy conditions are met, the entry signal appears.</p>
                <div className="font-code text-center p-4 bg-black/30 rounded-md text-lg">
                    Wait for: <span className="text-accent">O</span> <span className="text-accent">O</span> <span className="text-accent">O</span> ... then ENTER after first <span className="text-primary">E</span>
                </div>
                 {analysis.entryCondition === 'ENTER EVEN NOW' && (
                    <div className="p-4 bg-primary/20 text-primary rounded-md text-center font-bold text-xl animate-pulse">
                        ENTRY SIGNAL: ENTER EVEN NOW
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
