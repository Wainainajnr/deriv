"use client";

import { LastDigitCard } from "./LastDigitCard";
import { EvenOddGauge } from "./EvenOddGauge";
import { DigitDistributionChart } from "./DigitDistributionChart";
import { PatternHistoryCard } from "./PatternHistoryCard";

export function AnalysisGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="sm:col-span-1 lg:col-span-1">
        <LastDigitCard />
      </div>
      <div className="sm:col-span-1 lg:col-span-3">
        <EvenOddGauge />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <DigitDistributionChart />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <PatternHistoryCard />
      </div>
    </div>
  );
}
