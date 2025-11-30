
"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import type { DerivAccount } from "@/types/deriv";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  token: string | null;
  accounts: DerivAccount[];
  selectedAccount: DerivAccount | null;
  login: () => void;
  logout: () => void;
  selectAccount: (loginid: string) => void;
  setTokenAndAccounts: (token: string, accounts: DerivAccount[]) => void;
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<DerivAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("deriv_token");
      const storedAccounts = localStorage.getItem("deriv_accounts");
      const storedSelectedAccount = localStorage.getItem("deriv_selected_account");
      const storedSimMode = localStorage.getItem("deriv_sim_mode");
      
      if (storedSimMode !== null) {
        setIsSimulationMode(JSON.parse(storedSimMode));
      } else {
        setIsSimulationMode(!storedToken);
      }

      if (storedToken && storedAccounts) {
        const parsedAccounts: DerivAccount[] = JSON.parse(storedAccounts);
        setToken(storedToken);
        setAccounts(parsedAccounts);
        if (storedSelectedAccount) {
          setSelectedAccount(JSON.parse(storedSelectedAccount));
        } else if (parsedAccounts.length > 0) {
          setSelectedAccount(parsedAccounts[0]);
        }
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.clear(); // Clear corrupted data
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = () => {
    // Redirect to our server-side login route handler
    window.location.href = '/api/auth/login';
  };
  
  const logout = useCallback(() => {
    setIsLoading(true);
    localStorage.removeItem("deriv_token");
    localStorage.removeItem("deriv_accounts");
    localStorage.removeItem("deriv_selected_account");
    setToken(null);
    setAccounts([]);
    setSelectedAccount(null);
    localStorage.setItem("deriv_sim_mode", JSON.stringify(true));
    setIsSimulationMode(true);
    setIsLoading(false);
    router.push("/login");
  }, [router]);

  const setTokenAndAccounts = (newToken: string, newAccounts: DerivAccount[]) => {
    localStorage.setItem("deriv_token", newToken);
    localStorage.setItem("deriv_accounts", JSON.stringify(newAccounts));
    setToken(newToken);
    setAccounts(newAccounts);
    
    localStorage.setItem("deriv_sim_mode", JSON.stringify(false));
    setIsSimulationMode(false);

    if (newAccounts.length > 0) {
      const realAccount = newAccounts.find(acc => !acc.is_virtual);
      const accountToSelect = realAccount || newAccounts[0];
      setSelectedAccount(accountToSelect);
      localStorage.setItem("deriv_selected_account", JSON.stringify(accountToSelect));
    }
  };

  const selectAccount = (loginid: string) => {
    const account = accounts.find((acc) => acc.loginid === loginid);
    if (account && account.loginid !== selectedAccount?.loginid) {
      setSelectedAccount(account);
      localStorage.setItem("deriv_selected_account", JSON.stringify(account));
      window.location.reload(); 
    }
  };

  const toggleSimulationMode = useCallback(() => {
    const newSimMode = !isSimulationMode;
    if (!newSimMode && !token) {
        login(); // This will trigger the OAuth flow.
    } else {
        localStorage.setItem("deriv_sim_mode", JSON.stringify(newSimMode));
        setIsSimulationMode(newSimMode);
        window.location.reload();
    }
  }, [isSimulationMode, token]);


  const value = {
    isLoggedIn: !isLoading && !!token && !isSimulationMode,
    isLoading,
    token,
    accounts,
    selectedAccount,
    login,
    logout,
    selectAccount,
    setTokenAndAccounts,
    isSimulationMode,
    toggleSimulationMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
