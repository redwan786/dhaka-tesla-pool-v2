'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api/client';
import type { AuthResult, AuthUser } from '../lib/auth/types';

const STORAGE_KEY = 'dhaka-tesla-pool.access-token';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setSession: (result: AuthResult) => void;
  clearSession: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  const setSession = useCallback((result: AuthResult) => {
    window.localStorage.setItem(STORAGE_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    setIsLoading(false);
  }, []);

  const loadUser = useCallback(async (accessToken: string) => {
    const currentUser = await apiRequest<AuthUser>('/auth/me', { token: accessToken });
    setUser(currentUser);
    setToken(accessToken);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    await loadUser(token);
  }, [loadUser, token]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    let active = true;
    loadUser(storedToken)
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession, loadUser]);

  const value = useMemo(
    () => ({ user, token, isLoading, setSession, clearSession, refreshUser }),
    [user, token, isLoading, setSession, clearSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
