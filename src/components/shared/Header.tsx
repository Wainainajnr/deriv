
"use client";

import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, CircleUserRound, Link, Moon, Sun } from "lucide-react";
import { useTradingData } from "@/context/TradingDataProvider";
import { Logo } from "../icons/Logo";
import Image from "next/image";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useTheme } from "next-themes";

export function Header() {
  const { accounts, selectedAccount, logout, selectAccount, isLoggedIn, login, isSimulationMode, toggleSimulationMode } = useAuth();
  const { balance, currency } = useTradingData();
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Logo />
      <div className="ml-auto flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <div className="flex items-center space-x-2">
            <Switch id="simulation-mode" checked={isSimulationMode} onCheckedChange={toggleSimulationMode} />
            <Label htmlFor="simulation-mode">Simulation</Label>
        </div>

        {isLoggedIn && selectedAccount ? (
          <>
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex flex-col items-end">
                <span className="font-bold text-lg text-primary">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: currency,
                  }).format(balance)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedAccount.loginid}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <CircleUserRound className="h-5 w-5" />
                  <span className="hidden md:inline">
                    {selectedAccount?.loginid}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>My Accounts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {accounts.map((acc) => (
                  <DropdownMenuItem
                    key={acc.loginid}
                    onClick={() => selectAccount(acc.loginid)}
                    className={`flex justify-between ${selectedAccount?.loginid === acc.loginid ? 'bg-accent' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Image src={`https://app.deriv.com/public/images/trading-app-icons/${acc.is_virtual ? 'demo' : 'real'}.svg`} width={16} height={16} alt={acc.account_category} />
                      <span>{acc.loginid}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{acc.currency}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-400 focus:bg-red-500/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button onClick={login}>
              <Link className="mr-2 h-4 w-4" />
              Connect with Deriv
          </Button>
        )}
      </div>
    </header>
  );
}
