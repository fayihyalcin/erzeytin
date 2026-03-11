import { api } from './api';

export type SettingsRecord = Record<string, string | undefined>;

export async function fetchSettingsRecord() {
  const response = await api.get<SettingsRecord>('/settings');
  return response.data;
}

export async function updateSettingsRecord(payload: Record<string, string>) {
  const response = await api.put<SettingsRecord>('/settings', payload);
  return response.data;
}
