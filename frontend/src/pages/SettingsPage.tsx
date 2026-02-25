import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { SettingsDto } from '../types/api';

const defaultSettings: SettingsDto = {
  storeName: '',
  supportEmail: '',
  currency: 'TRY',
  timezone: 'Europe/Istanbul',
  taxRate: '20',
};

export function SettingsPage() {
  const [form, setForm] = useState<SettingsDto>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    api
      .get<Partial<SettingsDto>>('/settings')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setForm({
          storeName: response.data.storeName ?? defaultSettings.storeName,
          supportEmail: response.data.supportEmail ?? defaultSettings.supportEmail,
          currency: response.data.currency ?? defaultSettings.currency,
          timezone: response.data.timezone ?? defaultSettings.timezone,
          taxRate: response.data.taxRate ?? defaultSettings.taxRate,
        });
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.put('/settings', {
        ...form,
        taxRate: Number(form.taxRate),
      });
      setMessage('Ayarlar kaydedildi.');
    } catch {
      setMessage('Ayarlar kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="panel-card">Yukleniyor...</section>;
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>E-Ticaret Sistem Ayarlari</h3>
        <span>Menu 1</span>
      </div>

      <form className="grid-form" onSubmit={handleSubmit}>
        <label>
          Magaza Adi
          <input
            value={form.storeName}
            onChange={(event) => setForm({ ...form, storeName: event.target.value })}
          />
        </label>

        <label>
          Destek E-Posta
          <input
            value={form.supportEmail}
            onChange={(event) => setForm({ ...form, supportEmail: event.target.value })}
          />
        </label>

        <label>
          Para Birimi
          <select
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value })}
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>

        <label>
          Zaman Dilimi
          <select
            value={form.timezone}
            onChange={(event) => setForm({ ...form, timezone: event.target.value })}
          >
            <option value="Europe/Istanbul">Europe/Istanbul</option>
            <option value="UTC">UTC</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </label>

        <label>
          KDV Orani (%)
          <input
            type="number"
            min="0"
            max="100"
            value={form.taxRate}
            onChange={(event) => setForm({ ...form, taxRate: event.target.value })}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor...' : 'Ayarlari Kaydet'}
        </button>
      </form>

      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}

