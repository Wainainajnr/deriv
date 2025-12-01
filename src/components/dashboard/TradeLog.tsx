"use client";

import { useTradingData } from "@/context/TradingDataProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OpenContract } from "@/types/deriv";
import { Badge } from "../ui/badge";

export function TradeLog() {
  const { activeContracts, tradeHistory, sessionProfit } = useTradingData();

  return (
    <Card className="glass-card w-full">
      <CardHeader>
        <CardTitle>Trade Log</CardTitle>
        <CardDescription>Your active and past positions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Contracts</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <ActiveContractsTable contracts={activeContracts} />
          </TabsContent>
          <TabsContent value="history">
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Session Profit/Loss:
                <span className={sessionProfit >= 0 ? "text-green-500 ml-2" : "text-red-500 ml-2"}>
                  {sessionProfit >= 0 ? '+' : ''}{sessionProfit.toFixed(2)}
                </span>
              </p>
            </div>
            <TradeHistoryTable history={tradeHistory} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ActiveContractsTable({ contracts }: { contracts: OpenContract[] }) {
  if (contracts.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-8">
        No active contracts.
      </div>
    );
  }
  return (
    <ScrollArea className="h-72">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contract</TableHead>
            <TableHead>Stake</TableHead>
            <TableHead>Potential Payout</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.contract_id}>
              <TableCell className="font-medium">{contract.shortcode}</TableCell>
              <TableCell>{contract.buy_price.toFixed(2)}</TableCell>
              <TableCell>{contract.payout.toFixed(2)}</TableCell>
              <TableCell>
                <Badge
                  variant={contract.profit > 0 ? "default" : "destructive"}
                  className={contract.status === 'open' ? "bg-yellow-500 text-black" : contract.status === 'won' ? 'bg-primary' : 'bg-destructive'}
                >
                  {contract.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function TradeHistoryTable({ history }: { history: { contract_id: number, profit: number, status: 'won' | 'lost', buy_price: number, payout: number, transaction_time: number }[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground p-8">
        No trade history yet.
      </div>
    );
  }
  return (
    <ScrollArea className="h-72">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Stake</TableHead>
            <TableHead>Payout</TableHead>
            <TableHead>Profit/Loss</TableHead>
            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((trade) => (
            <TableRow key={trade.contract_id}>
              <TableCell className="font-medium">
                {new Date(trade.transaction_time * 1000).toLocaleTimeString()}
              </TableCell>
              <TableCell>{trade.buy_price.toFixed(2)}</TableCell>
              <TableCell>{trade.payout.toFixed(2)}</TableCell>
              <TableCell className={trade.profit >= 0 ? "text-green-500" : "text-red-500"}>
                {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={trade.status === 'won' ? "default" : "destructive"}
                  className={trade.status === 'won' ? 'bg-green-500' : 'bg-red-500'}
                >
                  {trade.status.toUpperCase()}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
