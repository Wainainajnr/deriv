"use client";

import { AnalysisGrid } from "@/components/dashboard/AnalysisGrid";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { TradeLog } from "@/components/dashboard/TradeLog";
import { AiSuggestionCard } from "@/components/dashboard/AiSuggestionCard";

export default function DashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <ControlPanel />
          <AnalysisGrid />
        </div>
        <div className="flex flex-col gap-6">
          <AiSuggestionCard />
          <TradeLog />
        </div>
      </div>
    </div>
  );
}
