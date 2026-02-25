import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
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

const STORAGE_TOKEN_KEY = 'zeytin_admin_token';
const STORAGE_USER_KEY = 'zeytin_admin_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(STORAGE_TOKEN_KEY),
  );
  const [user, setUser] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || (user && user.role)) {
      return;
    }

    setLoading(true);
    api
      .get<AdminUser>('/auth/me')
      .then((response) => {
        setUser(response.data);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(response.data));
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, user]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    const nextToken = response.data.accessToken;
    const nextUser = response.data.user;

    localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
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

