import { useState, useCallback, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'admin';
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEYS = {
  accessToken: 'caseg2_access_token',
  refreshToken: 'caseg2_refresh_token',
  user: 'caseg2_user',
} as const;

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  // Hydrate from localStorage immediately — optimistic state
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.accessToken)
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.refreshToken)
  );
  
  // loading = true apenas durante o init; depois disso, isAuthenticated é confiável
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Persist tokens and user to localStorage whenever they change
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    } else {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
    }
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    } else {
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
    }
  }, [refreshToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  }, [user]);

  // On mount: validate via refresh, but KEEP optimistic state until confirmed invalid
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const storedRefresh = localStorage.getItem(STORAGE_KEYS.refreshToken);
      
      // No stored session at all → not authenticated, stop loading
      if (!storedRefresh) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });

        // Only clear session on explicit auth failure (401/403)
        // Network errors or server errors should NOT invalidate local session
        if (res.status === 401 || res.status === 403) {
          // VERIFICAÇÃO DE CONCORRÊNCIA: Se o token no storage mudou desde o início
          // desta requisição, outra instância (StrictMode) já renovou com sucesso.
          const currentStoredRefresh = localStorage.getItem(STORAGE_KEYS.refreshToken);
          if (currentStoredRefresh && currentStoredRefresh !== storedRefresh) {
            console.warn('[Auth] Concurrent refresh detected, syncing state');
            if (!cancelled) {
              setAccessToken(localStorage.getItem(STORAGE_KEYS.accessToken));
              setRefreshToken(currentStoredRefresh);
              setUser(getStoredUser());
            }
            return;
          }

          // 401 legítimo - limpar sessão
          if (!cancelled) {
            localStorage.removeItem(STORAGE_KEYS.accessToken);
            localStorage.removeItem(STORAGE_KEYS.refreshToken);
            localStorage.removeItem(STORAGE_KEYS.user);
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
          }
          return;
        }

        if (!res.ok) {
          // Server error / network issue — keep optimistic state, just stop loading
          console.warn('[Auth] Refresh failed with status', res.status, '- keeping session');
          return;
        }

        const data: RefreshResponse = await res.json();
        if (!cancelled) {
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken);
        }
      } catch (err) {
        // Network error — DO NOT clear session, keep optimistic state
        console.warn('[Auth] Refresh network error - keeping session:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha no login');
      }

      const data: AuthResponse = await res.json();
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro de conexão';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, name: string, password: string, cpf?: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, cpf: cpf || '' }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha no cadastro');
      }

      const data: AuthResponse = await res.json();
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro de conexão';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    const currentRefresh = refreshToken;
    if (!currentRefresh) return null;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefresh }),
      });

      // Only logout on explicit auth failure
      if (res.status === 401 || res.status === 403) {
        logout();
        return null;
      }

      if (!res.ok) {
        // Transient error — don't kill the session
        console.warn('[Auth] Manual refresh failed:', res.status);
        return accessToken; // Return current token as fallback
      }

      const data: RefreshResponse = await res.json();
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data.accessToken;
    } catch {
      // Network error — keep current session alive
      console.warn('[Auth] Manual refresh network error - keeping session');
      return accessToken;
    }
  }, [refreshToken, accessToken, logout]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha no login com Google');
      }

      const data: AuthResponse = await res.json();
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro de conexão';
      setError(message);
      throw err;
    }
  }, []);

  return {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated: !!user && !!accessToken,
    login,
    register,
    logout,
    refresh,
    setError,
    loginWithGoogle,
  };
}
