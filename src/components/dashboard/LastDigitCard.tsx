"use client";

import { useTradingData } from "@/context/TradingDataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LastDigitCard() {
  const { analysis } = useTradingData();
  const { lastDigit } = analysis;
  const isEven = lastDigit !== null && lastDigit % 2 === 0;

  const colorClass = lastDigit === null 
    ? "text-muted-foreground" 
    : isEven ? "text-primary" : "text-accent";
    
  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium text-muted-foreground">
          Last Digit
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        {lastDigit !== null ? (
          <div className={`text-7xl font-bold font-code ${colorClass} transition-colors duration-200`}>
            {lastDigit}
          </div>
        ) : (
          <Skeleton className="h-[72px] w-[48px]" />
        )}
      </CardContent>
    </Card>
  );
}
