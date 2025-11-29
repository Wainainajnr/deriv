"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/context/TradingDataProvider";
import { automatedTradeSuggestions, type AutomatedTradeSuggestionsOutput } from "@/ai/flows/automated-trade-suggestions";
import { Loader2, Zap } from "lucide-react";

export function AiSuggestionCard() {
  const { analysis, buyContract } = useTradingData();
  const [suggestion, setSuggestion] = useState<AutomatedTradeSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getSuggestion = async () => {
      if (analysis.lastDigit === null) return;
      setIsLoading(true);
      try {
        const input = {
          evenOddPercentage: analysis.evenOddPercentage.even,
          patternDominance: analysis.patternDominance,
          lastTenPatterns: analysis.patternHistory.split(' ').slice(0, 10).join(' '),
          signalStrength: analysis.signalStrength,
        };
        const result = await automatedTradeSuggestions(input);
        setSuggestion(result);
      } catch (error) {
        console.error("Error getting AI suggestion:", error);
        setSuggestion(null);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(getSuggestion, 1000); // Debounce AI calls
    return () => clearTimeout(timer);
  }, [analysis]);
  
  const handleTrade = () => {
    if (!suggestion) return;
    
    // This is a simplified logic. A real app should get stake from an input.
    const stake = 1; 
    
    if (suggestion.tradeSuggestion === 'ENTER EVEN NOW') {
      buyContract('DIGITMATCH', stake); // Simplified: Assume DIGITMATCH = EVEN
    } else if (suggestion.tradeSuggestion === 'ENTER ODD NOW') {
      buyContract('DIGITDIFF', stake); // Simplified: Assume DIGITDIFF = ODD
    }
  }

  const getSuggestionColor = () => {
    if (!suggestion) return "text-muted-foreground";
    if (suggestion.tradeSuggestion.includes("EVEN")) return "text-primary";
    if (suggestion.tradeSuggestion.includes("ODD")) return "text-accent";
    return "text-muted-foreground";
  };
  
  const getConfidenceColor = () => {
    if (!suggestion) return "bg-gray-500";
    switch(suggestion.confidenceLevel.toLowerCase()) {
        case 'high': return 'bg-green-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
  }

  return (
    <Card className="glass-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-primary" />
          <span>AI Trade Signal</span>
        </CardTitle>
        <CardDescription>Powered by Google AI</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
        {isLoading ? (
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        ) : suggestion ? (
          <>
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getConfidenceColor()}`}></span>
                <span className="text-xs uppercase font-medium">{suggestion.confidenceLevel} Confidence</span>
            </div>
            <p className={`text-2xl font-bold ${getSuggestionColor()}`}>
              {suggestion.tradeSuggestion}
            </p>
            <p className="text-sm text-muted-foreground px-4">
              {suggestion.reasoning}
            </p>
            <Button 
                onClick={handleTrade}
                disabled={suggestion.tradeSuggestion === 'NO ENTRY'}
                className="w-full mt-4"
            >
              Execute Trade
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground">Waiting for market data...</p>
        )}
      </CardContent>
    </Card>
  );
}
