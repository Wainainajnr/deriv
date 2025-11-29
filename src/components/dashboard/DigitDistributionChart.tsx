"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTradingData } from "@/context/TradingDataProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const chartConfig = {
  count: {
    label: "Count",
  },
} satisfies ChartConfig;


export function DigitDistributionChart() {
  const { analysis } = useTradingData();
  const { digitCounts } = analysis;

  const chartData = digitCounts.map((count, index) => ({
    digit: index.toString(),
    count: count,
    fill: index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent))",
  }));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Digit Frequency</CardTitle>
        <CardDescription>Distribution of the last digit from the most recent 100 ticks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="digit" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--card))' }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
