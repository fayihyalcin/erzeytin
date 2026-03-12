import axios from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    requiresAdminAuth?: boolean;
  }

  interface InternalAxiosRequestConfig {
    requiresAdminAuth?: boolean;
  }
}

const rawApiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export const API_BASE_URL = rawApiBase;
export const API_ORIGIN = rawApiBase.replace(/\/api\/?$/, '');
export const ADMIN_TOKEN_STORAGE_KEY = 'zeytin_admin_token';
export const ADMIN_USER_STORAGE_KEY = 'zeytin_admin_user';
export const ADMIN_AUTH_CLEARED_EVENT = 'zeytin-admin-auth-cleared';

const PUBLIC_API_PREFIXES = [
  '/auth/login',
  '/catalog/public',
  '/settings/public',
  '/shop/',
] as const;

const authValidationClient = axios.create({
  baseURL: API_BASE_URL,
});

let sessionValidationPromise: Promise<'valid' | 'invalid' | 'unknown'> | null = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

function isPublicApiPath(url?: string) {
  if (!url) {
    return false;
  }

  return PUBLIC_API_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function emitAdminAuthCleared() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_AUTH_CLEARED_EVENT));
}

async function validateAdminSession(token: string) {
  if (sessionValidationPromise) {
    return sessionValidationPromise;
  }

  sessionValidationPromise = authValidationClient
    .get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(() => 'valid' as const)
    .catch((error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return 'invalid' as const;
      }

      return 'unknown' as const;
    })
    .finally(() => {
      sessionValidationPromise = null;
    });

  return sessionValidationPromise;
}

export function clearAdminAuthStorage() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
  emitAdminAuthCleared();
}

export function isUnauthorizedResponse(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function extractApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message)) {
    const joined = message.filter((item) => typeof item === 'string').join(' ');
    if (joined.trim()) {
      return joined;
    }
  }

  return fallback;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

  if (config.requiresAdminAuth === undefined) {
    config.requiresAdminAuth = !isPublicApiPath(config.url);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.requiresAdminAuth !== false
    ) {
      const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

      if (!token) {
        clearAdminAuthStorage();
      } else {
        const sessionState = await validateAdminSession(token);
        if (sessionState === 'invalid') {
          clearAdminAuthStorage();

          if (
            typeof window !== 'undefined' &&
            window.location.pathname.startsWith('/dashboard')
          ) {
            window.location.assign('/admin');
          }
        }
      }
    }

    return Promise.reject(error);
  },
);
