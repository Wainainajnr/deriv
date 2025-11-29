
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/context/TradingDataProvider";
import { automatedTradeSuggestions, type AutomatedTradeSuggestionsOutput } from "@/ai/flows/automated-trade-suggestions";
import { Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AiSuggestionCard() {
  const { analysis, buyContract, strategy, isLoggedIn, stake } = useTradingData();
  const [suggestion, setSuggestion] = useState<AutomatedTradeSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (strategy === 'strategy2') {
        setSuggestion(null);
        return;
    }

    const getSuggestion = async () => {
      if (analysis.lastDigit === null || strategy !== 'strategy1') return;
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

    // Only run for strategy 1 and when analysis is available
    if (strategy === 'strategy1') {
        const timer = setTimeout(getSuggestion, 10000); // Debounce AI calls
        return () => clearTimeout(timer);
    }
  }, [analysis, strategy]);
  
  const handleTrade = () => {
    if (!isLoggedIn) {
        toast({
            variant: "destructive",
            title: "Not Logged In",
            description: "Please connect your Deriv account to trade.",
        });
        return;
    }

    if (parseFloat(stake) < 0.35) {
        toast({
            variant: "destructive",
            title: "Invalid Stake",
            description: "Minimum stake amount is 0.35.",
        });
        return;
    }
    
    let tradeType: 'ENTER EVEN NOW' | 'ENTER ODD NOW' | 'NO ENTRY' = 'NO ENTRY';

    if (strategy === 'strategy1' && suggestion) {
        tradeType = suggestion.tradeSuggestion as any;
    } else if (strategy === 'strategy2') {
        tradeType = analysis.entryCondition;
    }

    if (tradeType === 'ENTER EVEN NOW') {
      buyContract('DIGITEVEN', parseFloat(stake)); 
    } else if (tradeType === 'ENTER ODD NOW') {
      buyContract('DIGITODD', parseFloat(stake));
    }
  }

  const getSuggestionColor = () => {
    if (strategy === 'strategy1' && suggestion) {
        if (suggestion.tradeSuggestion.includes("EVEN")) return "text-primary";
        if (suggestion.tradeSuggestion.includes("ODD")) return "text-accent";
    }
    if (strategy === 'strategy2') {
        if (analysis.entryCondition.includes("EVEN")) return "text-primary";
        if (analysis.entryCondition.includes("ODD")) return "text-accent";
    }
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

  const isTradeSignalActive = (strategy === 'strategy1' && suggestion?.tradeSuggestion !== 'NO ENTRY') || (strategy === 'strategy2' && analysis.entryCondition !== 'NO ENTRY');

  const renderContent = () => {
     if (strategy === 'strategy2') {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-center min-h-[150px]">
                <p className="text-muted-foreground">Strategy 2 uses explicit entry rules based on the conditions below.</p>
                {analysis.entryCondition === 'NO ENTRY' && <p className="text-muted-foreground">Waiting for signal...</p>}
            </div>
        )
     }
      
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center min-h-[150px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Shakes FX is analyzing...</p>
        </div>
      );
    }

    if (suggestion) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center min-h-[150px]">
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
        </div>
      );
    }
    
    return (
        <div className="flex flex-col items-center justify-center gap-4 text-center min-h-[150px]">
            <p className="text-muted-foreground">Waiting for market data...</p>
        </div>
    );
  }

  return (
    <Card className="glass-card w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-primary" />
          <span>Trade Signal</span>
        </CardTitle>
        <CardDescription>
            {strategy === 'strategy1' ? 'Powered by Shakes FX' : 'Manual Signal based on Strategy 2'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
        {isTradeSignalActive && (
             <Button 
                onClick={handleTrade}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold animate-pulse"
                size="lg"
            >
                Execute Trade
            </Button>
        )}
      </CardContent>
    </Card>
  );
}
