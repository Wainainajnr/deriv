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
  const { activeContracts } = useTradingData();

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
            <p className="text-center text-sm text-muted-foreground p-8">
              Trade history will be shown here.
            </p>
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
