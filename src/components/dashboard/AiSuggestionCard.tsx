
"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/context/TradingDataProvider";
import { automatedTradeSuggestions, type AutomatedTradeSuggestionsOutput } from "@/ai/flows/automated-trade-suggestions";
import { Loader2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthProvider";

export function AiSuggestionCard() {
  const { analysis, buyContract, strategy, stake } = useTradingData();
  const { isLoggedIn, login } = useAuth();
  const [suggestion, setSuggestion] = useState<AutomatedTradeSuggestionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const isTradeSignalActive = (strategy === 'strategy1' && suggestion?.tradeSuggestion !== 'NO ENTRY') || (strategy === 'strategy2' && analysis.entryCondition !== 'NO ENTRY');
  const prevSignalState = useRef(false);
  
  const playSound = () => {
    // Defer AudioContext creation until the first user gesture (sound playback).
    if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error("Web Audio API is not supported in this browser.", e);
          return;
        }
    }

    const audioContext = audioContextRef.current;
    
    // Resume the context if it's suspended (common in modern browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    if (!audioContext || audioContext.state !== 'running') {
      console.warn("AudioContext is not available or not running. Cannot play sound.");
      return;
    }
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A6 note
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.error("Could not play sound:", e);
    }
  };

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

    if (strategy === 'strategy1') {
        const timer = setTimeout(getSuggestion, 2000); 
        return () => clearTimeout(timer);
    }
  }, [analysis, strategy]);

  useEffect(() => {
    if (isTradeSignalActive && !prevSignalState.current) {
        playSound();
    }
    prevSignalState.current = isTradeSignalActive;
  }, [isTradeSignalActive]);
  
  const handleTrade = () => {
    if (!isLoggedIn) {
        toast({
            title: "Please Log In",
            description: "You must connect your Deriv account to execute a trade.",
            action: <Button onClick={login}>Login</Button>
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
    
    let contractType: 'DIGITEVEN' | 'DIGITODD' | null = null;
    
    if (strategy === 'strategy1') {
        if (suggestion && suggestion.tradeSuggestion === 'ENTER EVEN NOW') {
            contractType = 'DIGITEVEN';
        } else if (suggestion && suggestion.tradeSuggestion === 'ENTER ODD NOW') {
            contractType = 'DIGITODD';
        }
    } else if (strategy === 'strategy2') {
        if (analysis.entryCondition === 'ENTER EVEN NOW') {
            contractType = 'DIGITEVEN';
        } else if (analysis.entryCondition === 'ENTER ODD NOW') {
            contractType = 'DIGITODD';
        }
    }

    if (contractType) {
        buyContract(contractType, parseFloat(stake));
    } else {
        toast({
            variant: "destructive",
            title: "Trade Error",
            description: "No valid trade signal to execute.",
        });
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
            <div className="flex flex-col items-center justify-center gap-4 text-center min-h-[150px]">
                <p className="text-muted-foreground">Strategy 2 uses explicit entry rules based on the conditions below.</p>
                {analysis.entryCondition === 'NO ENTRY' && analysis.lastDigit !== null && <p className="text-muted-foreground">Waiting for signal...</p>}
                {analysis.lastDigit === null && <p className="text-muted-foreground">Waiting for market data...</p>}
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
        <Button 
            onClick={handleTrade}
            disabled={!isTradeSignalActive}
            className={`w-full mt-4 font-bold transition-all text-white ${
                isTradeSignalActive 
                    ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                    : 'bg-gray-500/20 text-muted-foreground cursor-not-allowed hover:bg-gray-500/20'
            }`}
            size="lg"
        >
            Execute Trade
        </Button>
      </CardContent>
    </Card>
  );
}
