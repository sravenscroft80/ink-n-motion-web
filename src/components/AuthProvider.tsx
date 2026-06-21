"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  tokens: number | null;
  authLoading: boolean;
  balanceLoading: boolean;
  refreshBalance: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isAuthEnabled = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [authLoading, setAuthLoading] = useState(isAuthEnabled);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!isAuthEnabled) {
      return;
    }

    setBalanceLoading(true);
    try {
      const response = await fetch("/api/tokens/balance", {
        cache: "no-store",
      });

      if (response.status === 401) {
        setTokens(null);
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { balance: number };
      setTokens(data.balance);
    } finally {
      setBalanceLoading(false);
    }
  }, [isAuthEnabled]);

  const signOut = useCallback(async () => {
    if (!isAuthEnabled) {
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setTokens(null);
    router.refresh();
  }, [isAuthEnabled, router]);

  useEffect(() => {
    if (!isAuthEnabled) {
      return;
    }

    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (!mounted) {
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        void refreshBalance();
      } else {
        setTokens(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser) {
        void refreshBalance();
      } else {
        setTokens(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isAuthEnabled, refreshBalance]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      authLoading,
      balanceLoading,
      refreshBalance,
      signOut,
      isAuthEnabled,
    }),
    [
      user,
      tokens,
      authLoading,
      balanceLoading,
      refreshBalance,
      signOut,
      isAuthEnabled,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
