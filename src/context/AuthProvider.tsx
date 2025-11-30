
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
import { getCookie, deleteCookie, setCookie } from "cookies-next";

const OAUTH_TOKEN_COOKIE_NAME = "deriv_oauth_token";
const ACCOUNTS_COOKIE_NAME = "deriv_accounts";
const SELECTED_ACCOUNT_COOKIE_NAME = "deriv_selected_account";
const SIM_MODE_COOKIE_NAME = "deriv_sim_mode";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  token: string | null;
  accounts: DerivAccount[];
  selectedAccount: DerivAccount | null;
  login: () => void;
  logout: () => void;
  selectAccount: (loginid: string) => void;
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
    // Read auth state from cookies
    try {
      const storedToken = getCookie(OAUTH_TOKEN_COOKIE_NAME);
      const storedAccounts = getCookie(ACCOUNTS_COOKIE_NAME);
      const storedSelectedAccount = getCookie(SELECTED_ACCOUNT_COOKIE_NAME);
      const storedSimMode = getCookie(SIM_MODE_COOKIE_NAME);

      if (storedToken) {
         setToken(storedToken);
         const parsedAccounts: DerivAccount[] = storedAccounts ? JSON.parse(storedAccounts) : [];
         setAccounts(parsedAccounts);
         if (storedSelectedAccount) {
            setSelectedAccount(JSON.parse(storedSelectedAccount));
         } else if (parsedAccounts.length > 0) {
            setSelectedAccount(parsedAccounts[0]);
         }
         // If a token exists, the user is logged in, so sim mode should be false unless explicitly set.
         setIsSimulationMode(storedSimMode === 'true');
      } else {
        // No token, so default to simulation mode
        setIsSimulationMode(true);
      }
    } catch (error) {
      console.error("Failed to parse auth data from cookies", error);
      // Clear potentially corrupted cookies
      deleteCookie(OAUTH_TOKEN_COOKIE_NAME);
      deleteCookie(ACCOUNTS_COOKIE_NAME);
      deleteCookie(SELECTED_ACCOUNT_COOKIE_NAME);
      deleteCookie(SIM_MODE_COOKIE_NAME);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = () => {
    // Redirect to our server-side login route handler, which will then redirect to Deriv
    window.location.href = '/api/auth/login';
  };
  
  const logout = useCallback(() => {
    setIsLoading(true);
    // Clear all auth-related cookies
    deleteCookie(OAUTH_TOKEN_COOKIE_NAME, { path: '/' });
    deleteCookie(ACCOUNTS_COOKIE_NAME, { path: '/' });
    deleteCookie(SELECTED_ACCOUNT_COOKIE_NAME, { path: '/' });
    // Explicitly set sim mode to true on logout
    setCookie(SIM_MODE_COOKIE_NAME, 'true', { path: '/' });
    
    setToken(null);
    setAccounts([]);
    setSelectedAccount(null);
    setIsSimulationMode(true);
    setIsLoading(false);
    router.push("/login");
  }, [router]);

  const selectAccount = (loginid: string) => {
    const account = accounts.find((acc) => acc.loginid === loginid);
    if (account && account.loginid !== selectedAccount?.loginid) {
      // Set the new selected account in a cookie and reload to apply it everywhere
      setCookie(SELECTED_ACCOUNT_COOKIE_NAME, JSON.stringify(account), { path: '/' });
      setSelectedAccount(account);
      window.location.reload(); 
    }
  };

  const toggleSimulationMode = useCallback(() => {
    const newSimMode = !isSimulationMode;
    if (!newSimMode && !token) {
        // If turning sim mode OFF and not logged in, initiate login
        login();
    } else {
        // Otherwise, just toggle the state and reload to reflect changes
        setCookie(SIM_MODE_COOKIE_NAME, newSimMode.toString(), { path: '/' });
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
