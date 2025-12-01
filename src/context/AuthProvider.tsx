
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

const ACCOUNTS_COOKIE_NAME = "deriv_accounts";
const SELECTED_ACCOUNT_COOKIE_NAME = "deriv_selected_account";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  token: string | null;
  accounts: DerivAccount[];
  selectedAccount: DerivAccount | null;
  login: () => void;
  logout: () => void;
  selectAccount: (loginid: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<DerivAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<DerivAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Read auth state from cookies
    try {
      const storedAccounts = getCookie(ACCOUNTS_COOKIE_NAME);
      const storedSelectedAccount = getCookie(SELECTED_ACCOUNT_COOKIE_NAME);

      if (storedAccounts) {
        const parsedAccounts: DerivAccount[] = JSON.parse(storedAccounts);
        setAccounts(parsedAccounts);
        if (storedSelectedAccount) {
          setSelectedAccount(JSON.parse(storedSelectedAccount));
        } else if (parsedAccounts.length > 0) {
          setSelectedAccount(parsedAccounts[0]);
        }
      }
    } catch (error) {
      console.error("Failed to parse auth data from cookies", error);
      // Clear potentially corrupted cookies
      deleteCookie(ACCOUNTS_COOKIE_NAME);
      deleteCookie(SELECTED_ACCOUNT_COOKIE_NAME);
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
    deleteCookie(ACCOUNTS_COOKIE_NAME, { path: '/' });
    deleteCookie(SELECTED_ACCOUNT_COOKIE_NAME, { path: '/' });

    setAccounts([]);
    setSelectedAccount(null);
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

  // Token comes from the selected account
  const token = selectedAccount?.token || null;

  const value = {
    isLoggedIn: !isLoading && !!token && accounts.length > 0,
    isLoading,
    token,
    accounts,
    selectedAccount,
    login,
    logout,
    selectAccount,
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
