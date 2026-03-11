import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { SettingsDto } from '../types/api';
import type { AdminWizardStep } from '../components/admin/AdminFormWizard';

const defaultSettings: SettingsDto = {
  storeName: '',
  supportEmail: '',
  currency: 'TRY',
  timezone: 'Europe/Istanbul',
  taxRate: '20',
  siteUrl: 'http://localhost:5173',
  apiBaseUrl: 'http://localhost:3000/api',
  paytrEnabled: 'false',
  paytrMerchantId: '',
  paytrMerchantKey: '',
  paytrMerchantSalt: '',
  paytrTestMode: 'true',
  paytrDebugOn: 'true',
  paytrNoInstallment: '0',
  paytrMaxInstallment: '0',
  paytrTimeoutLimit: '30',
  paytrLang: 'tr',
};

const settingsSteps = [
  {
    id: 'store',
    title: 'Mağaza Kimliği',
    description: 'Mağaza, para birimi ve destek bilgileri.',
  },
  {
    id: 'routing',
    title: 'Alan Adı ve URL',
    description: 'Callback, storefront ve API adresleri.',
  },
  {
    id: 'paytr-mode',
    title: 'PAYTR Modu',
    description: 'Aktivasyon, test ve taksit davranışları.',
  },
  {
    id: 'paytr-credentials',
    title: 'API Anahtarları',
    description: 'Merchant bilgileri ve teknik parametreler.',
  },
] satisfies AdminWizardStep[];

type SettingsStepId = (typeof settingsSteps)[number]['id'];

function isEnabled(value: string) {
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function toToggleValue(value: boolean) {
  return value ? 'true' : 'false';
}

function normalizeSettings(settings: Partial<SettingsDto> = {}): SettingsDto {
  return {
    storeName: settings.storeName ?? defaultSettings.storeName,
    supportEmail: settings.supportEmail ?? defaultSettings.supportEmail,
    currency: settings.currency ?? defaultSettings.currency,
    timezone: settings.timezone ?? defaultSettings.timezone,
    taxRate: settings.taxRate ?? defaultSettings.taxRate,
    siteUrl: settings.siteUrl ?? defaultSettings.siteUrl,
    apiBaseUrl: settings.apiBaseUrl ?? defaultSettings.apiBaseUrl,
    paytrEnabled: settings.paytrEnabled ?? defaultSettings.paytrEnabled,
    paytrMerchantId: settings.paytrMerchantId ?? defaultSettings.paytrMerchantId,
    paytrMerchantKey: settings.paytrMerchantKey ?? defaultSettings.paytrMerchantKey,
    paytrMerchantSalt: settings.paytrMerchantSalt ?? defaultSettings.paytrMerchantSalt,
    paytrTestMode: settings.paytrTestMode ?? defaultSettings.paytrTestMode,
    paytrDebugOn: settings.paytrDebugOn ?? defaultSettings.paytrDebugOn,
    paytrNoInstallment:
      settings.paytrNoInstallment ?? defaultSettings.paytrNoInstallment,
    paytrMaxInstallment:
      settings.paytrMaxInstallment ?? defaultSettings.paytrMaxInstallment,
    paytrTimeoutLimit:
      settings.paytrTimeoutLimit ?? defaultSettings.paytrTimeoutLimit,
    paytrLang: settings.paytrLang ?? defaultSettings.paytrLang,
  };
}

export function SettingsPage() {
  const [form, setForm] = useState<SettingsDto>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<SettingsStepId>('store');

  useEffect(() => {
    let mounted = true;

    api
      .get<Partial<SettingsDto>>('/settings')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setForm(normalizeSettings(response.data));
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

  const callbackUrl = useMemo(() => {
    const apiBase = form.apiBaseUrl.trim().replace(/\/+$/, '');
    return apiBase ? `${apiBase}/shop/payments/paytr/callback` : '-';
  }, [form.apiBaseUrl]);

  const currentStepIndex = settingsSteps.findIndex((step) => step.id === currentStep);
  const activeStep = settingsSteps[currentStepIndex] ?? settingsSteps[0];
  const progress = Math.round(((currentStepIndex + 1) / settingsSteps.length) * 100);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.put<Partial<SettingsDto>>('/settings', {
        ...form,
        supportEmail: form.supportEmail.trim(),
        taxRate: Number(form.taxRate),
      });

      setForm(normalizeSettings(response.data));
      setMessage('Ayarlar kaydedildi.');
    } catch (error) {
      if (isAxiosError<{ message?: string | string[] }>(error)) {
        const details = error.response?.data?.message;
        const reason = Array.isArray(details) ? details.join(', ') : details;

        setMessage(
          reason ? `Ayarlar kaydedilemedi: ${reason}` : 'Ayarlar kaydedilemedi.',
        );
      } else {
        setMessage('Ayarlar kaydedilemedi.');
      }
    } finally {
      setSaving(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex <= 0) {
      return;
    }

    setCurrentStep(settingsSteps[currentStepIndex - 1].id);
  };

  const goToNextStep = () => {
    if (currentStepIndex >= settingsSteps.length - 1) {
      return;
    }

    setCurrentStep(settingsSteps[currentStepIndex + 1].id);
  };

  if (loading) {
    return <section className="admin-panel">Sistem ayarları yükleniyor...</section>;
  }

  return (
    <form className="admin-page-stack admin-settings-page" onSubmit={handleSubmit}>
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Sistem / Ayarlar</span>
          <h2>Kurumsal mağaza ayarları</h2>
          <p>
            Mağaza kimliği, URL yapısı ve PAYTR ödeme altyapısını daha kompakt bir akışla
            yönetin.
          </p>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-settings-hero">
        <article className="admin-settings-intro-card">
          <div className="admin-settings-intro-top">
            <div>
              <span className="admin-eyebrow">Akış Tasarımı</span>
              <h3>Ayar sihirbazı</h3>
              <p>
                Teknik ayarları basit form blokları yerine daha kontrollü, temiz ve
                responsive bir yönetim akışına taşır.
              </p>
            </div>
            <span className="admin-settings-step-chip">
              Adım {currentStepIndex + 1}
            </span>
          </div>

          <div className="admin-wizard-progress">
            <div className="admin-wizard-progress-meta">
              <strong>
                {currentStepIndex + 1}/{settingsSteps.length}
              </strong>
              <span>%{progress} tamamlandı</span>
            </div>
            <div className="admin-wizard-progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="admin-settings-current-step">
            <strong>{activeStep.title}</strong>
            <small>{activeStep.description}</small>
          </div>
        </article>

        <aside className="admin-settings-summary-card">
          <div className="admin-panel-header">
            <div>
              <h3>Hızlı durum özeti</h3>
              <p>Yapılandırma durumunu tek bakışta kontrol edin.</p>
            </div>
          </div>

          <div className="admin-preview-grid">
            <div className="admin-metric-tile">
              <span>Ödeme modu</span>
              <strong>{isEnabled(form.paytrEnabled) ? 'Aktif' : 'Pasif'}</strong>
            </div>
            <div className="admin-metric-tile">
              <span>Test</span>
              <strong>{isEnabled(form.paytrTestMode) ? 'Açık' : 'Kapalı'}</strong>
            </div>
          </div>

          <ul className="admin-preview-list">
            <li>
              <strong>Storefront</strong>
              <small>{form.siteUrl || 'Tanımlanmadı'}</small>
            </li>
            <li>
              <strong>Callback</strong>
              <small>{callbackUrl}</small>
            </li>
            <li>
              <strong>Merchant ID</strong>
              <small>{form.paytrMerchantId || 'Girilmedi'}</small>
            </li>
          </ul>
        </aside>
      </section>

      <section className="admin-settings-steps-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Adım navigasyonu</h3>
            <p>Her bölüm bağımsız açılır; mobilde de rahat kullanılır.</p>
          </div>
        </div>

        <div className="admin-settings-step-grid">
          {settingsSteps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;
            const className = isActive
              ? 'admin-settings-step active'
              : isCompleted
                ? 'admin-settings-step completed'
                : 'admin-settings-step';

            return (
              <button
                key={step.id}
                aria-current={isActive ? 'step' : undefined}
                className={className}
                onClick={() => setCurrentStep(step.id as SettingsStepId)}
                type="button"
              >
                <span className="admin-settings-step-index">
                  {isCompleted ? 'OK' : `${index + 1}`.padStart(2, '0')}
                </span>
                <span className="admin-settings-step-copy">
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="admin-settings-stage">
        <div className="admin-stage-stack">
          {currentStep === 'store' ? (
            <>
              <section className="admin-stage-intro">
                <span className="admin-eyebrow">Adım 1</span>
                <h3>Mağaza kimliğini belirleyin</h3>
                <p>Temel e-ticaret yapısını belirleyen para birimi, destek ve vergi alanları.</p>
              </section>

              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h3>Genel mağaza bilgileri</h3>
                    <p>Marka, destek ekibi ve mali ayarlar.</p>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <label className="admin-label">
                    <span>Mağaza adı</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, storeName: event.target.value })} value={form.storeName} />
                  </label>
                  <label className="admin-label">
                    <span>Destek e-postasi</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, supportEmail: event.target.value })} value={form.supportEmail} />
                  </label>
                  <label className="admin-label">
                    <span>Para birimi</span>
                    <select className="admin-select" onChange={(event) => setForm({ ...form, currency: event.target.value })} value={form.currency}>
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </label>
                  <label className="admin-label">
                    <span>Zaman dilimi</span>
                    <select className="admin-select" onChange={(event) => setForm({ ...form, timezone: event.target.value })} value={form.timezone}>
                      <option value="Europe/Istanbul">Europe/Istanbul</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </label>
                  <label className="admin-label">
                    <span>KDV oranı (%)</span>
                    <input className="admin-input" max="100" min="0" onChange={(event) => setForm({ ...form, taxRate: event.target.value })} type="number" value={form.taxRate} />
                  </label>
                </div>
              </section>
            </>
          ) : null}

          {currentStep === 'routing' ? (
            <>
              <section className="admin-stage-intro">
                <span className="admin-eyebrow">Adım 2</span>
                <h3>Alan adları ve callback rotaları</h3>
                <p>Storefront ve API adresleri girildiğinde ödeme callback zinciri temiz çalışır.</p>
              </section>

              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h3>Site URL yapısı</h3>
                    <p>PAYTR geri dönüş ve callback adresleri için temel kaynak.</p>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <label className="admin-label admin-span-full">
                    <span>Storefront URL</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, siteUrl: event.target.value })} placeholder="https://www.site.com" value={form.siteUrl} />
                  </label>
                  <label className="admin-label admin-span-full">
                    <span>API Base URL</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, apiBaseUrl: event.target.value })} placeholder="https://api.site.com/api" value={form.apiBaseUrl} />
                  </label>
                </div>

                <div className="admin-inline-note">
                  <strong>PAYTR callback adresi</strong>
                  <p>{callbackUrl}</p>
                  <small>Bu adresi PAYTR panelinde Bildirim URL alanına ekleyin.</small>
                </div>
              </section>
            </>
          ) : null}

          {currentStep === 'paytr-mode' ? (
            <>
              <section className="admin-stage-intro">
                <span className="admin-eyebrow">Adım 3</span>
                <h3>PAYTR davranışını seçin</h3>
                <p>Canlıya çıkmadan önce test, debug ve taksit yapısını buradan yönetin.</p>
              </section>

              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h3>PAYTR durum</h3>
                    <p>Kredi kartı akışını açıp kapatabileceğiniz operasyon merkezi.</p>
                  </div>
                </div>

                <div className="variant-list">
                  <label className="admin-checkbox-card">
                    <input
                      checked={isEnabled(form.paytrEnabled)}
                      onChange={(event) =>
                        setForm({ ...form, paytrEnabled: toToggleValue(event.target.checked) })
                      }
                      type="checkbox"
                    />
                    <div>
                      <strong>PAYTR kredi kartı ödemesi aktif</strong>
                      <span>Checkout ekranında iframe tabanlı kart ödemesi görünür.</span>
                    </div>
                  </label>
                  <label className="admin-checkbox-card">
                    <input
                      checked={isEnabled(form.paytrTestMode)}
                      onChange={(event) =>
                        setForm({ ...form, paytrTestMode: toToggleValue(event.target.checked) })
                      }
                      type="checkbox"
                    />
                    <div>
                      <strong>Test modu</strong>
                      <span>Canlı trafik almadan önce tüm entegrasyon akışlarını sınamanızı sağlar.</span>
                    </div>
                  </label>
                  <label className="admin-checkbox-card">
                    <input
                      checked={isEnabled(form.paytrDebugOn)}
                      onChange={(event) =>
                        setForm({ ...form, paytrDebugOn: toToggleValue(event.target.checked) })
                      }
                      type="checkbox"
                    />
                    <div>
                      <strong>Debug açık</strong>
                      <span>PAYTR hata sebeplerini daha detaylı döndürür.</span>
                    </div>
                  </label>
                  <label className="admin-checkbox-card">
                    <input
                      checked={isEnabled(form.paytrNoInstallment)}
                      onChange={(event) =>
                        setForm({ ...form, paytrNoInstallment: toToggleValue(event.target.checked) })
                      }
                      type="checkbox"
                    />
                    <div>
                      <strong>Taksiti kapat</strong>
                      <span>Aktif olduğunda PAYTR ekranında taksit seçeneği devre dışı kalır.</span>
                    </div>
                  </label>
                </div>
              </section>
            </>
          ) : null}

          {currentStep === 'paytr-credentials' ? (
            <>
              <section className="admin-stage-intro">
                <span className="admin-eyebrow">Adım 4</span>
                <h3>Teknik anahtar ve limitler</h3>
                <p>Merchant bilgileri, timeout ve dil parametreleri canlı ödeme akışını belirler.</p>
              </section>

              <section className="admin-panel">
                <div className="admin-panel-header">
                  <div>
                    <h3>PAYTR API bilgileri</h3>
                    <p>Merchant panelinizden gelen gizli alanları buradan yönetin.</p>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <label className="admin-label">
                    <span>Merchant ID</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, paytrMerchantId: event.target.value })} value={form.paytrMerchantId} />
                  </label>
                  <label className="admin-label">
                    <span>Merchant Key</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, paytrMerchantKey: event.target.value })} type="password" value={form.paytrMerchantKey} />
                  </label>
                  <label className="admin-label">
                    <span>Merchant Salt</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, paytrMerchantSalt: event.target.value })} type="password" value={form.paytrMerchantSalt} />
                  </label>
                  <label className="admin-label">
                    <span>Maksimum taksit</span>
                    <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, paytrMaxInstallment: event.target.value })} type="number" value={form.paytrMaxInstallment} />
                  </label>
                  <label className="admin-label">
                    <span>Timeout (dakika)</span>
                    <input className="admin-input" min="1" onChange={(event) => setForm({ ...form, paytrTimeoutLimit: event.target.value })} type="number" value={form.paytrTimeoutLimit} />
                  </label>
                  <label className="admin-label">
                    <span>Dil</span>
                    <select className="admin-select" onChange={(event) => setForm({ ...form, paytrLang: event.target.value })} value={form.paytrLang}>
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                </div>
              </section>
            </>
          ) : null}

          <div className="admin-stage-actions">
            <div className="admin-stage-actions-group">
              {currentStepIndex > 0 ? (
                <button className="admin-ghost-button" onClick={goToPreviousStep} type="button">
                  Önceki adım
                </button>
              ) : null}
            </div>

            <div className="admin-stage-actions-group">
              <button className="admin-secondary-button" disabled={saving} type="submit">
                {saving ? 'Kaydediliyor...' : 'Ara kaydet'}
              </button>
              {currentStepIndex < settingsSteps.length - 1 ? (
                <button className="admin-primary-button" onClick={goToNextStep} type="button">
                  Devam et
                </button>
              ) : (
                <button className="admin-primary-button" disabled={saving} type="submit">
                  {saving ? 'Kaydediliyor...' : 'Ayarları kaydet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
