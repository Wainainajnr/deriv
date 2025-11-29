
"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTradingData } from "@/context/TradingDataProvider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Strategy } from "@/lib/analysis";

const allVolatilityIndices = [
  { value: "R_10", label: "Volatility 10 Index" },
  { value: "R_25", label: "Volatility 25 Index" },
  { value: "R_50", label: "Volatility 50 Index" },
  { value: "R_75", label: "Volatility 75 Index" },
  { value: "R_100", label: "Volatility 100 Index" },
  { value: "1HZ10V", label: "Volatility 10 (1s) Index" },
  { value: "1HZ25V", label: "Volatility 25 (1s) Index" },
  { value: "1HZ50V", label: "Volatility 50 (1s) Index" },
  { value: "1HZ75V", label: "Volatility 75 (1s) Index" },
  { value: "1HZ100V", label: "Volatility 100 (1s) Index" },
];

const strategy2Indices = ["1HZ10V", "1HZ25V", "R_50"];

export function ControlPanel() {
  const { symbol, setSymbol, strategy, setStrategy, stake, setStake } = useTradingData();

  const availableIndices = strategy === 'strategy2'
    ? allVolatilityIndices.filter(index => strategy2Indices.includes(index.value))
    : allVolatilityIndices;

  useEffect(() => {
    // If the selected strategy is 2 and the current symbol is not in the allowed list,
    // switch to the first available symbol for strategy 2.
    if (strategy === 'strategy2' && !strategy2Indices.includes(symbol)) {
      setSymbol(strategy2Indices[0]);
    }
  }, [strategy, symbol, setSymbol]);


  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Trade Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Strategy</Label>
          <RadioGroup 
            defaultValue="strategy1" 
            className="flex items-center pt-2 space-x-4" 
            value={strategy}
            onValueChange={(value) => setStrategy(value as Strategy)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="strategy1" id="s1" />
              <Label htmlFor="s1">Strategy 1</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="strategy2" id="s2" />
              <Label htmlFor="s2">Strategy 2</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="symbol-select">Market</Label>
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger id="symbol-select" className="w-full">
              <SelectValue placeholder="Select a symbol" />
            </SelectTrigger>
            <SelectContent>
              {availableIndices.map((index) => (
                <SelectItem key={index.value} value={index.value}>
                  {index.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="stake-input">Stake Amount</Label>
          <Input
            id="stake-input"
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            min="0.35"
            step="0.01"
          />
        </div>
      </CardContent>
    </Card>
  );
}
