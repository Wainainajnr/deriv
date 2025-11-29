"use client";

import { useTradingData } from "@/context/TradingDataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function EvenOddGauge() {
  const { analysis } = useTradingData();
  const { evenOddPercentage } = analysis;

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium text-muted-foreground">
          Even/Odd Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span className="font-medium text-primary">Even</span>
            <span className="text-muted-foreground">{evenOddPercentage.even.toFixed(2)}%</span>
          </div>
          <Progress value={evenOddPercentage.even} className="h-3 [&>div]:bg-primary" />
        </div>
        <div>
          <div className="flex justify-between mb-1 text-sm">
            <span className="font-medium text-accent">Odd</span>
            <span className="text-muted-foreground">{evenOddPercentage.odd.toFixed(2)}%</span>
          </div>
          <Progress value={evenOddPercentage.odd} className="h-3 [&>div]:bg-accent" />
        </div>
      </CardContent>
    </Card>
  );
}
