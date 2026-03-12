import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ADMIN_AUTH_CLEARED_EVENT,
  ADMIN_TOKEN_STORAGE_KEY,
  ADMIN_USER_STORAGE_KEY,
  api,
  clearAdminAuthStorage,
  isUnauthorizedResponse,
} from '../lib/api';
import type { AdminUser, LoginResponse } from '../types/api';

interface AuthContextValue {
  token: string | null;
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem(ADMIN_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)),
  );

  useEffect(() => {
    const syncFromStorage = () => {
      const nextToken = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      const rawUser = localStorage.getItem(ADMIN_USER_STORAGE_KEY);

      setToken(nextToken);

      if (!rawUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(rawUser) as AdminUser);
      } catch {
        setUser(null);
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === ADMIN_TOKEN_STORAGE_KEY ||
        event.key === ADMIN_USER_STORAGE_KEY
      ) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(ADMIN_AUTH_CLEARED_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ADMIN_AUTH_CLEARED_EVENT, syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    api
      .get<AdminUser>('/auth/me', { requiresAdminAuth: false })
      .then((response) => {
        if (!mounted) {
          return;
        }

        setUser(response.data);
        localStorage.setItem(
          ADMIN_USER_STORAGE_KEY,
          JSON.stringify(response.data),
        );
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        if (isUnauthorizedResponse(error)) {
          clearAdminAuthStorage();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    const nextToken = response.data.accessToken;
    const nextUser = response.data.user;

    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearAdminAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth sadece AuthProvider icinde kullanilabilir.');
  }

  return context;
}
