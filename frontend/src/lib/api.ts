import axios from 'axios';

const rawApiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export const API_BASE_URL = rawApiBase;
export const API_ORIGIN = rawApiBase.replace(/\/api\/?$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zeytin_admin_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

