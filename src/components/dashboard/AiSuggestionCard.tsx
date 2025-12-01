
"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTradingData } from "@/context/TradingDataProvider";
import type { AutomatedTradeSuggestionsOutput } from "@/ai/flows/automated-trade-suggestions";
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
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [isAutoTradingEnabled, setIsAutoTradingEnabled] = useState(false);
  const prevSignalState = useRef(false);

  const isTradeSignalActive = (strategy === 'strategy1' && suggestion?.tradeSuggestion !== 'NO ENTRY') || (strategy === 'strategy2' && analysis.entryCondition !== 'NO ENTRY');

  const createAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
      }
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }

  const toggleSound = () => {
    if (!isSoundEnabled) {
      createAudioContext();
    }
    setIsSoundEnabled(!isSoundEnabled);
  };

  const toggleAutoTrading = () => {
    setIsAutoTradingEnabled(!isAutoTradingEnabled);
    if (!isAutoTradingEnabled) {
      toast({
        title: "Auto-Trading Enabled",
        description: "Trades will be executed automatically when a signal is detected. Use with caution!",
        className: "bg-yellow-600 text-white border-none",
      });
    } else {
      toast({
        title: "Auto-Trading Disabled",
        description: "Manual trade execution only.",
      });
    }
  };

  const playSound = () => {
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
      return;
    }

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime); // A6 note
      gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);

      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.5);
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    } catch (e) {
      console.error("Could not play sound:", e);
    }
  };

  const handleTrade = () => {
    // This is the user gesture that allows the AudioContext to start
    createAudioContext();

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
      toast({
        title: "Trade Executed",
        description: `Buying ${contractType} contract for ${stake} USD`,
        className: "bg-blue-600 text-white border-none",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Trade Error",
        description: "No valid trade signal to execute.",
      });
    }
  }

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
        const response = await fetch('/api/ai/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Details:", errorData);
          throw new Error(errorData.error || 'Failed to get AI suggestion');
        }

        const result = await response.json();
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
      if (isSoundEnabled) {
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        playSound();
      }

      // Visual notification
      toast({
        title: "Trade Signal Active!",
        description: strategy === 'strategy1' ? suggestion?.tradeSuggestion : analysis.entryCondition,
        className: "bg-green-500 text-white border-none",
      });

      // Auto-Trading Logic
      if (isAutoTradingEnabled) {
        handleTrade();
      }
    }
    prevSignalState.current = isTradeSignalActive;
  }, [isTradeSignalActive, isSoundEnabled, strategy, suggestion, analysis, toast, isAutoTradingEnabled]);

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
    switch (suggestion.confidenceLevel.toLowerCase()) {
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-primary" />
            <span>Trade Signal</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAutoTrading}
              className={isAutoTradingEnabled ? "text-green-500 animate-pulse" : "text-muted-foreground"}
              title={isAutoTradingEnabled ? "Disable Auto-Trading" : "Enable Auto-Trading"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className={isSoundEnabled ? "text-primary" : "text-muted-foreground"}
              title={isSoundEnabled ? "Mute Alerts" : "Enable Sound Alerts"}
            >
              {isSoundEnabled ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          {strategy === 'strategy1' ? 'Powered by Shakes FX' : 'Manual Signal based on Strategy 2'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
        <Button
          onClick={handleTrade}
          disabled={!isTradeSignalActive}
          className={`w-full mt-4 font-bold transition-all text-white ${isTradeSignalActive
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
