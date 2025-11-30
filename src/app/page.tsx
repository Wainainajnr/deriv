
"use client";

import { AnalysisGrid } from "@/components/dashboard/AnalysisGrid";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { TradeLog } from "@/components/dashboard/TradeLog";
import { AiSuggestionCard } from "@/components/dashboard/AiSuggestionCard";
import { Disclaimer } from "@/components/dashboard/Disclaimer";
import { TermsAndConditions } from "@/components/dashboard/TermsAndConditions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { AlertTriangle, FileText } from "lucide-react";
import { useTradingData } from "@/context/TradingDataProvider";
import { StrategyTwoExplanation } from "@/components/dashboard/StrategyTwoExplanation";
import { StrategyOneExplanation } from "@/components/dashboard/StrategyOneExplanation";
import { Header } from "@/components/shared/Header";
import { useAuth } from "@/context/AuthProvider";

export default function HomePage() {
  const { strategy } = useTradingData();
  const { isLoggedIn } = useAuth();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <ControlPanel />
            </div>

            {strategy === "strategy1" ? (
              <div className="lg:col-span-3">
                <StrategyOneExplanation />
              </div>
            ) : (
              <div className="lg:col-span-3">
                <StrategyTwoExplanation />
              </div>
            )}

            <div className="lg:col-span-2 flex flex-col gap-6">
              <AnalysisGrid />
            </div>
            <div className="flex flex-col gap-6">
              <AiSuggestionCard />
              <TradeLog />
            </div>

            <div className="lg:col-span-3">
              <Card className="glass-card">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="disclaimer" className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                        <h4 className="font-bold text-yellow-500">
                          Risk Disclaimer
                        </h4>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <Disclaimer />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="terms" className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline">
                      <div className="flex items-center gap-4">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                        <h4 className="font-bold">Terms and Conditions</h4>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <TermsAndConditions />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
