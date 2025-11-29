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

const DERIV_APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || "16929"; // Replace with your actual App ID

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
        // If no sim mode is stored, default to true unless a token is present
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
      // Clear corrupted data
      localStorage.removeItem("deriv_token");
      localStorage.removeItem("deriv_accounts");
      localStorage.removeItem("deriv_selected_account");
      localStorage.removeItem("deriv_sim_mode");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = () => {
    toggleSimulationMode(false); // Turn off simulation mode when logging in
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}&l=EN&brand=deriv`;
    window.location.href = oauthUrl;
  };

  const logout = useCallback(() => {
    setIsLoading(true);
    localStorage.removeItem("deriv_token");
    localStorage.removeItem("deriv_accounts");
    localStorage.removeItem("deriv_selected_account");
    setToken(null);
    setAccounts([]);
    setSelectedAccount(null);
    // When logging out, we can decide whether to enable simulation mode or not.
    // Let's enable it by default.
    toggleSimulationMode(true);
    setIsLoading(false);
    router.push("/login");
  }, [router]);

  const setTokenAndAccounts = (newToken: string, newAccounts: DerivAccount[]) => {
    localStorage.setItem("deriv_token", newToken);
    localStorage.setItem("deriv_accounts", JSON.stringify(newAccounts));
    setToken(newToken);
    setAccounts(newAccounts);

    if (newAccounts.length > 0) {
      const realAccount = newAccounts.find(acc => !acc.is_virtual);
      const accountToSelect = realAccount || newAccounts[0];
      setSelectedAccount(accountToSelect);
      localStorage.setItem("deriv_selected_account", JSON.stringify(accountToSelect));
    }
  };

  const selectAccount = (loginid: string) => {
    const account = accounts.find((acc) => acc.loginid === loginid);
    if (account) {
      setSelectedAccount(account);
      localStorage.setItem("deriv_selected_account", JSON.stringify(account));
      window.location.reload();
    }
  };

  const toggleSimulationMode = useCallback((forceState?: boolean) => {
    setIsSimulationMode(prev => {
        const newState = forceState ?? !prev;
        localStorage.setItem("deriv_sim_mode", JSON.stringify(newState));
        // If we are turning simulation mode off, but we're not logged in, redirect to login
        if (newState === false && !token) {
            router.push('/login');
        }
        if (newState === true) {
            // If turning simulation mode ON, clear the selected real account details
            // to avoid confusion, but don't log out fully
            setSelectedAccount(null);
            localStorage.removeItem("deriv_selected_account");
        }
        window.location.reload(); // Reload to reset contexts
        return newState;
    });
  }, [token, router]);

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
