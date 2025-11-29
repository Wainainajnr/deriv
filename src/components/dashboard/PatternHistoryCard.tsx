"use client";

import { useTradingData } from "@/context/TradingDataProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";

export function PatternHistoryCard() {
  const { analysis } = useTradingData();
  const { patternHistory, patternDominance } = analysis;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Pattern Analysis</CardTitle>
        <CardDescription>
          Dominance: <span className="text-foreground font-medium">{patternDominance}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="font-code text-lg p-4 bg-black/20 rounded-md tracking-widest overflow-x-auto">
          {patternHistory ? (
             patternHistory.split(' ').map((char, index) => (
                <span key={index} className={char === 'E' ? 'text-primary' : 'text-accent'}>
                  {char}{' '}
                </span>
              ))
          ) : (
            <Skeleton className="w-full h-8" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
