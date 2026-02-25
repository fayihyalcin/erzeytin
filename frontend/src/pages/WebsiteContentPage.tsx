import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
  PublicSettingsDto,
  WebsiteFeatureItem,
  WebsiteFooterColumn,
  WebsiteHeroSlide,
  WebsiteNavItem,
  WebsitePromoCard,
} from '../types/api';

const emptyNavItem = (): WebsiteNavItem => ({
  label: '',
  href: '#',
});

const emptyHeroSlide = (): WebsiteHeroSlide => ({
  badge: '',
  title: '',
  subtitle: '',
  description: '',
  ctaLabel: 'Incele',
  ctaHref: '#products',
  imageUrl: '',
});

const emptyPromoCard = (): WebsitePromoCard => ({
  title: '',
  subtitle: '',
  ctaLabel: 'Detayi Gor',
  ctaHref: '#products',
  imageUrl: '',
});

const emptyFeatureItem = (): WebsiteFeatureItem => ({
  icon: 'leaf',
  title: '',
  description: '',
});

const emptyFooterColumn = (): WebsiteFooterColumn => ({
  title: '',
  links: [],
});

export function WebsiteContentPage() {
  const [form, setForm] = useState(createDefaultWebsiteConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    api
      .get<PublicSettingsDto>('/settings')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setForm(parseWebsiteConfig(response.data.websiteConfig));
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
        websiteConfig: JSON.stringify(form),
      });
      setMessage('Website icerigi kaydedildi.');
    } catch {
      setMessage('Website icerigi kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="panel-card">Website icerigi yukleniyor...</section>;
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>Website Icerik Yonetimi</h3>
        <span>Storefront</span>
      </div>

      <form className="grid-form wide-form" onSubmit={handleSubmit}>
        <label>
          Marka Adi
          <input
            value={form.theme.brandName}
            onChange={(event) =>
              setForm({
                ...form,
                theme: { ...form.theme, brandName: event.target.value },
              })
            }
          />
        </label>

        <label>
          Admin Buton Metni
          <input
            value={form.theme.adminButtonLabel}
            onChange={(event) =>
              setForm({
                ...form,
                theme: { ...form.theme, adminButtonLabel: event.target.value },
              })
            }
          />
        </label>

        <label className="field-span-2">
          Marka Slogani
          <input
            value={form.theme.tagline}
            onChange={(event) =>
              setForm({
                ...form,
                theme: { ...form.theme, tagline: event.target.value },
              })
            }
          />
        </label>

        <label className="field-span-2">
          Duyuru Metni
          <input
            value={form.announcement}
            onChange={(event) => setForm({ ...form, announcement: event.target.value })}
          />
        </label>

        <div className="field-span-2 image-upload-box">
          <div className="panel-title-row">
            <h3>Ust Menu</h3>
            <button
              className="tiny"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  navItems: [...form.navItems, emptyNavItem()],
                })
              }
            >
              Menu Ekle
            </button>
          </div>
          <div className="variant-list">
            {form.navItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="variant-item">
                <label>
                  Baslik
                  <input
                    value={item.label}
                    onChange={(event) => {
                      const next = [...form.navItems];
                      next[index] = { ...item, label: event.target.value };
                      setForm({ ...form, navItems: next });
                    }}
                  />
                </label>
                <label>
                  Link
                  <input
                    value={item.href}
                    onChange={(event) => {
                      const next = [...form.navItems];
                      next[index] = { ...item, href: event.target.value };
                      setForm({ ...form, navItems: next });
                    }}
                  />
                </label>
                <button
                  className="tiny secondary"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      navItems: form.navItems.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="field-span-2 image-upload-box">
          <div className="panel-title-row">
            <h3>Hero Slider</h3>
            <button
              className="tiny"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  heroSlides: [...form.heroSlides, emptyHeroSlide()],
                })
              }
            >
              Slide Ekle
            </button>
          </div>
          <div className="variant-list">
            {form.heroSlides.map((slide, index) => (
              <div key={`${slide.title}-${index}`} className="variant-item">
                <label>
                  Rozet
                  <input
                    value={slide.badge}
                    onChange={(event) => {
                      const next = [...form.heroSlides];
                      next[index] = { ...slide, badge: event.target.value };
                      setForm({ ...form, heroSlides: next });
                    }}
                  />
                </label>
                <label>
                  Baslik
                  <input
                    value={slide.title}
                    onChange={(event) => {
                      const next = [...form.heroSlides];
                      next[index] = { ...slide, title: event.target.value };
                      setForm({ ...form, heroSlides: next });
                    }}
                  />
                </label>
                <label>
                  Alt Baslik
                  <input
                    value={slide.subtitle}
                    onChange={(event) => {
                      const next = [...form.heroSlides];
                      next[index] = { ...slide, subtitle: event.target.value };
                      setForm({ ...form, heroSlides: next });
                    }}
                  />
                </label>
                <label className="field-span-2">
                  Aciklama
                  <input
                    value={slide.description}
                    onChange={(event) => {
                      const next = [...form.heroSlides];
                      next[index] = { ...slide, description: event.target.value };
                      setForm({ ...form, heroSlides: next });
                    }}
                  />
                </label>
                <label>
                  Buton Metni
                  <input
                    value={slide.ctaLabel}
                    onChange={(event) => {
                      const next = [...form.heroSlides];
                      next[index] = { ...slide, ctaLabel: event.target.value };
                      setForm({ ...form, heroSlides: next });
                    }}
                  />
                </label>
                <label>
                  Buton Link
                  <input
                    value={slide.ctaHref}
                    onChange={(event) => {
                      const next = [...form.heroSlides];
                      next[index] = { ...slide, ctaHref: event.target.value };
                      setForm({ ...form, heroSlides: next });
                    }}
                  />
                </label>
                <label className="field-span-2">
                  Gorsel URL
                  <input
                    value={slide.imageUrl}
                    onChange={(event) => {
                      const next = [...form.heroSlides];
                      next[index] = { ...slide, imageUrl: event.target.value };
                      setForm({ ...form, heroSlides: next });
                    }}
                  />
                </label>
                <button
                  className="tiny secondary field-span-2"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      heroSlides: form.heroSlides.filter(
                        (_, slideIndex) => slideIndex !== index,
                      ),
                    })
                  }
                >
                  Slide Sil
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="field-span-2 image-upload-box">
          <div className="panel-title-row">
            <h3>Kampanya Kartlari</h3>
            <button
              className="tiny"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  promoCards: [...form.promoCards, emptyPromoCard()],
                })
              }
            >
              Kart Ekle
            </button>
          </div>
          <div className="variant-list">
            {form.promoCards.map((card, index) => (
              <div key={`${card.title}-${index}`} className="variant-item">
                <label>
                  Baslik
                  <input
                    value={card.title}
                    onChange={(event) => {
                      const next = [...form.promoCards];
                      next[index] = { ...card, title: event.target.value };
                      setForm({ ...form, promoCards: next });
                    }}
                  />
                </label>
                <label>
                  Alt Baslik
                  <input
                    value={card.subtitle}
                    onChange={(event) => {
                      const next = [...form.promoCards];
                      next[index] = { ...card, subtitle: event.target.value };
                      setForm({ ...form, promoCards: next });
                    }}
                  />
                </label>
                <label>
                  Buton Metni
                  <input
                    value={card.ctaLabel}
                    onChange={(event) => {
                      const next = [...form.promoCards];
                      next[index] = { ...card, ctaLabel: event.target.value };
                      setForm({ ...form, promoCards: next });
                    }}
                  />
                </label>
                <label>
                  Buton Link
                  <input
                    value={card.ctaHref}
                    onChange={(event) => {
                      const next = [...form.promoCards];
                      next[index] = { ...card, ctaHref: event.target.value };
                      setForm({ ...form, promoCards: next });
                    }}
                  />
                </label>
                <label className="field-span-2">
                  Gorsel URL
                  <input
                    value={card.imageUrl}
                    onChange={(event) => {
                      const next = [...form.promoCards];
                      next[index] = { ...card, imageUrl: event.target.value };
                      setForm({ ...form, promoCards: next });
                    }}
                  />
                </label>
                <button
                  className="tiny secondary field-span-2"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      promoCards: form.promoCards.filter(
                        (_, cardIndex) => cardIndex !== index,
                      ),
                    })
                  }
                >
                  Kart Sil
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="field-span-2 image-upload-box">
          <div className="panel-title-row">
            <h3>Avantaj Kutulari</h3>
            <button
              className="tiny"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  featureItems: [...form.featureItems, emptyFeatureItem()],
                })
              }
            >
              Avantaj Ekle
            </button>
          </div>
          <div className="variant-list">
            {form.featureItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className="variant-item">
                <label>
                  Ikon Kodu (truck/leaf/shield/gift)
                  <input
                    value={item.icon}
                    onChange={(event) => {
                      const next = [...form.featureItems];
                      next[index] = { ...item, icon: event.target.value };
                      setForm({ ...form, featureItems: next });
                    }}
                  />
                </label>
                <label>
                  Baslik
                  <input
                    value={item.title}
                    onChange={(event) => {
                      const next = [...form.featureItems];
                      next[index] = { ...item, title: event.target.value };
                      setForm({ ...form, featureItems: next });
                    }}
                  />
                </label>
                <label className="field-span-2">
                  Aciklama
                  <input
                    value={item.description}
                    onChange={(event) => {
                      const next = [...form.featureItems];
                      next[index] = { ...item, description: event.target.value };
                      setForm({ ...form, featureItems: next });
                    }}
                  />
                </label>
                <button
                  className="tiny secondary field-span-2"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      featureItems: form.featureItems.filter(
                        (_, featureIndex) => featureIndex !== index,
                      ),
                    })
                  }
                >
                  Avantaj Sil
                </button>
              </div>
            ))}
          </div>
        </div>

        <label>
          Bulten Basligi
          <input
            value={form.newsletterTitle}
            onChange={(event) =>
              setForm({
                ...form,
                newsletterTitle: event.target.value,
              })
            }
          />
        </label>

        <label>
          Bulten Aciklamasi
          <input
            value={form.newsletterDescription}
            onChange={(event) =>
              setForm({
                ...form,
                newsletterDescription: event.target.value,
              })
            }
          />
        </label>

        <div className="field-span-2 image-upload-box">
          <div className="panel-title-row">
            <h3>Footer Kolonlari</h3>
            <button
              className="tiny"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  footerColumns: [...form.footerColumns, emptyFooterColumn()],
                })
              }
            >
              Kolon Ekle
            </button>
          </div>
          <div className="variant-list">
            {form.footerColumns.map((column, index) => (
              <div key={`${column.title}-${index}`} className="variant-item">
                <label>
                  Baslik
                  <input
                    value={column.title}
                    onChange={(event) => {
                      const next = [...form.footerColumns];
                      next[index] = { ...column, title: event.target.value };
                      setForm({ ...form, footerColumns: next });
                    }}
                  />
                </label>
                <label className="field-span-2">
                  Linkler (virgulle)
                  <input
                    value={column.links.join(', ')}
                    onChange={(event) => {
                      const links = event.target.value
                        .split(',')
                        .map((value) => value.trim())
                        .filter((value) => value.length > 0);
                      const next = [...form.footerColumns];
                      next[index] = { ...column, links };
                      setForm({ ...form, footerColumns: next });
                    }}
                  />
                </label>
                <button
                  className="tiny secondary field-span-2"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      footerColumns: form.footerColumns.filter(
                        (_, columnIndex) => columnIndex !== index,
                      ),
                    })
                  }
                >
                  Kolon Sil
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions field-span-2">
          <button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Website Icerigini Kaydet'}
          </button>
        </div>
      </form>

      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}
