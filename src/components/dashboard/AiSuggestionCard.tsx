"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/context/TradingDataProvider";
import { automatedTradeSuggestions, type AutomatedTradeSuggestionsOutput } from "@/ai/flows/automated-trade-suggestions";
import { Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AiSuggestionCard() {
  const { analysis, buyContract, strategy, isLoggedIn } = useTradingData();
  const [suggestion, setSuggestion] = useState<AutomatedTradeSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // For Strategy 2, we don't use the LLM, we use the explicit entry condition.
    if (strategy === 'strategy2') {
        setSuggestion(null);
        return;
    }

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

    const timer = setTimeout(getSuggestion, 10000); // Debounce AI calls
    return () => clearTimeout(timer);
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

    // This is a simplified logic. A real app should get stake from an input.
    const stake = 1; 
    
    let tradeType: 'ENTER EVEN NOW' | 'ENTER ODD NOW' | 'NO ENTRY' = 'NO ENTRY';

    if (strategy === 'strategy1' && suggestion) {
        tradeType = suggestion.tradeSuggestion as any;
    } else if (strategy === 'strategy2') {
        tradeType = analysis.entryCondition;
    }

    if (tradeType === 'ENTER EVEN NOW') {
      buyContract('DIGITEVEN'); 
    } else if (tradeType === 'ENTER ODD NOW') {
      buyContract('DIGITODD');
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

  const renderContent = () => {
     if (strategy === 'strategy2') {
        return (
            <>
                <p className="text-muted-foreground">Strategy 2 uses explicit entry rules. See explanation below.</p>
                {analysis.entryCondition !== 'NO ENTRY' && (
                     <div className="p-4 bg-primary/20 text-primary rounded-md text-center font-bold text-xl animate-pulse">
                        ENTRY SIGNAL: {analysis.entryCondition}
                    </div>
                )}
                 <Button 
                    onClick={handleTrade}
                    disabled={analysis.entryCondition === 'NO ENTRY'}
                    className="w-full mt-4"
                >
                    Execute Trade
                </Button>
            </>
        )
     }
      
    if (isLoading) {
      return <Loader2 className="h-10 w-10 animate-spin text-primary" />;
    }

    if (suggestion) {
      return (
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
      );
    }
    
    return <p className="text-muted-foreground">Waiting for market data...</p>;
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
      <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}
