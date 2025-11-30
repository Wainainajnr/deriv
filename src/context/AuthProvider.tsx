
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
  toggleSimulationMode: (isSim: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DERIV_APP_ID = "114068";
const REDIRECT_URI = "https://derivedge.vercel.app/callback";
const OAUTH_STATE_KEY = "deriv_oauth_state";

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
      localStorage.removeItem("deriv_token");
      localStorage.removeItem("deriv_accounts");
      localStorage.removeItem("deriv_selected_account");
      localStorage.removeItem("deriv_sim_mode");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = () => {
    // 1. Generate a secure random string for the state parameter for CSRF protection.
    const state =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    
    // 2. Store the state value in localStorage.
    localStorage.setItem(OAUTH_STATE_KEY, state);

    // 3. Construct the full, explicit OAuth URL.
    const params = new URLSearchParams({
      app_id: DERIV_APP_ID,
      l: "EN",
      brand: "deriv",
      redirect_uri: REDIRECT_URI,
      scope: 'read trading information',
      state: state,
      response_type: 'token' // Explicitly request token for implicit grant flow
    });
    
    // 4. Redirect the user to Deriv to authorize.
    const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?${params.toString()}`;
    window.location.href = oauthUrl;
  };
  
  const logout = useCallback(() => {
    setIsLoading(true);
    localStorage.removeItem("deriv_token");
    localStorage.removeItem("deriv_accounts");
    localStorage.removeItem("deriv_selected_account");
    localStorage.removeItem(OAUTH_STATE_KEY);
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
    toggleSimulationMode(false); // Turn off simulation mode on successful login

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

  const toggleSimulationMode = useCallback((isSim: boolean) => {
    localStorage.setItem("deriv_sim_mode", JSON.stringify(isSim));
    setIsSimulationMode(isSim);
  }, []);


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
    toggleSimulationMode: (isSim: boolean) => {
        toggleSimulationMode(isSim);
        if(!isSim && !token) { // If turning off sim mode and not logged in, trigger login
            login();
        } else {
            window.location.reload();
        }
    },
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
