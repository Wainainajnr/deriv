"use client";

import { useState } from "react";
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

const volatilityIndices = [
  { value: "R_10", label: "Volatility 10 Index" },
  { value: "R_25", label: "Volatility 25 Index" },
  { value: "R_50", label: "Volatility 50 Index" },
  { value: "R_75", label: "Volatility 75 Index" },
  { value: "R_100", label: "Volatility 100 Index" },
];

export function ControlPanel() {
  const { symbol, setSymbol } = useTradingData();
  const [stake, setStake] = useState("1"); // Local state for input

  // In a real app, this stake would be passed to a buy function in context.
  // For now, it's a UI element.

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Trade Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="symbol-select">Market</Label>
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger id="symbol-select" className="w-full">
              <SelectValue placeholder="Select a symbol" />
            </SelectTrigger>
            <SelectContent>
              {volatilityIndices.map((index) => (
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
