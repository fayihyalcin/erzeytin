import { useEffect, useState, type FormEvent } from 'react';
import { MediaPickerField } from '../components/admin/MediaPickerField';
import { parseMediaLibrary } from '../lib/admin-content';
import { fetchSettingsRecord, updateSettingsRecord } from '../lib/admin-settings';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
  MediaItem,
  WebsiteConfig,
  WebsiteFeatureItem,
  WebsiteFooterColumn,
  WebsiteFooterLink,
  WebsiteHeroSlide,
  WebsiteLegalDocument,
  WebsiteLegalSection,
  WebsiteManagedPageContent,
  WebsiteManagedPagesConfig,
  WebsiteNavItem,
  WebsiteParallaxCard,
  WebsitePromoCard,
} from '../types/api';

const emptyNavItem = (): WebsiteNavItem => ({ label: '', href: '/' });
const emptyHeroSlide = (): WebsiteHeroSlide => ({
  badge: '',
  title: '',
  subtitle: '',
  description: '',
  ctaLabel: 'Incele',
  ctaHref: '/urunler',
  imageUrl: '',
  videoUrl: '',
  posterUrl: '',
});
const emptyParallaxCard = (): WebsiteParallaxCard => ({
  title: '',
  subtitle: '',
  ctaLabel: 'Kesfet',
  ctaHref: '/urunler',
  imageUrl: '',
});
const emptyPromoCard = (): WebsitePromoCard => ({
  title: '',
  subtitle: '',
  ctaLabel: 'Detayi Gor',
  ctaHref: '/kampanyalar',
  imageUrl: '',
});
const emptyFeatureItem = (): WebsiteFeatureItem => ({ icon: 'leaf', title: '', description: '' });
const emptyFooterLink = (): WebsiteFooterLink => ({ label: '', href: '#' });
const emptyFooterColumn = (): WebsiteFooterColumn => ({ title: '', links: [emptyFooterLink()] });
const emptyLegalSection = (): WebsiteLegalSection => ({ heading: '', body: '' });
const emptyManagedHighlight = () => '';

function replaceAtIndex<T>(list: T[], index: number, value: T) {
  return list.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function cloneLegalDocument(document: WebsiteLegalDocument): WebsiteLegalDocument {
  return {
    title: document.title,
    subtitle: document.subtitle,
    sections: document.sections.map((section) => ({ ...section })),
  };
}

export function WebsiteContentPage() {
  const [form, setForm] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const settings = await fetchSettingsRecord();
        if (!mounted) {
          return;
        }

        setForm(parseWebsiteConfig(settings.websiteConfig));
        setMediaItems(parseMediaLibrary(settings.mediaLibrary));
      } catch {
        if (mounted) {
          setMessage('Website icerigi yuklenemedi.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const updateManagedPage = <T extends keyof WebsiteManagedPagesConfig>(
    key: T,
    value: WebsiteManagedPagesConfig[T],
  ) => {
    setForm((current) => ({
      ...current,
      pages: {
        ...current.pages,
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateSettingsRecord({
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
    return <section className="admin-panel">Website icerigi yukleniyor...</section>;
  }

  return (
    <form className="admin-page-stack" onSubmit={handleSubmit}>
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">CMS / Site icerigi</span>
          <h2>Website icerik yonetimi</h2>
          <p>Anasayfa bloklari, iletisim alani, footer ve yasal metinleri tek ekrandan yonetin.</p>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Marka ve iletisim</h3>
            <p>Header, top bar ve iletisim sayfasinda kullanilan alanlar.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-label">
            <span>Marka adi</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, theme: { ...form.theme, brandName: event.target.value } })} value={form.theme.brandName} />
          </label>
          <label className="admin-label">
            <span>Slogan</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, theme: { ...form.theme, tagline: event.target.value } })} value={form.theme.tagline} />
          </label>
          <label className="admin-label">
            <span>Admin buton metni</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, theme: { ...form.theme, adminButtonLabel: event.target.value } })} value={form.theme.adminButtonLabel} />
          </label>
          <label className="admin-label admin-span-full">
            <span>Duyuru metni</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, announcement: event.target.value })} value={form.announcement} />
          </label>
          <label className="admin-label">
            <span>Telefon</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, contact: { ...form.contact, phoneDisplay: event.target.value } })} value={form.contact.phoneDisplay} />
          </label>
          <label className="admin-label">
            <span>Telefon linki</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, contact: { ...form.contact, phoneLink: event.target.value } })} value={form.contact.phoneLink} />
          </label>
          <label className="admin-label">
            <span>E-posta</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, contact: { ...form.contact, email: event.target.value } })} value={form.contact.email} />
          </label>
          <label className="admin-label">
            <span>WhatsApp linki</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, contact: { ...form.contact, whatsappLink: event.target.value } })} value={form.contact.whatsappLink} />
          </label>
          <label className="admin-label admin-span-full">
            <span>Adres</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, contact: { ...form.contact, address: event.target.value } })} value={form.contact.address} />
          </label>
          <label className="admin-label">
            <span>Calisma saatleri</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, contact: { ...form.contact, workingHours: event.target.value } })} value={form.contact.workingHours} />
          </label>
          <label className="admin-label admin-span-full">
            <span>Harita embed URL</span>
            <input className="admin-input" onChange={(event) => setForm({ ...form, contact: { ...form.contact, mapsEmbedUrl: event.target.value } })} value={form.contact.mapsEmbedUrl} />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Ust menu</h3>
            <p>Header navigasyonunda gosterilecek baglantilar.</p>
          </div>
          <button className="admin-secondary-button" onClick={() => setForm({ ...form, navItems: [...form.navItems, emptyNavItem()] })} type="button">
            Link ekle
          </button>
        </div>
        <div className="variant-list">
          {form.navItems.map((item, index) => (
            <div className="variant-item" key={`${item.label}-${index}`}>
              <label className="admin-label">
                <span>Baslik</span>
                <input className="admin-input" onChange={(event) => setForm({ ...form, navItems: replaceAtIndex(form.navItems, index, { ...item, label: event.target.value }) })} value={item.label} />
              </label>
              <label className="admin-label">
                <span>Baglanti</span>
                <input className="admin-input" onChange={(event) => setForm({ ...form, navItems: replaceAtIndex(form.navItems, index, { ...item, href: event.target.value }) })} value={item.href} />
              </label>
              <button className="admin-danger-button" onClick={() => setForm({ ...form, navItems: form.navItems.filter((_, itemIndex) => itemIndex !== index) })} type="button">
                Sil
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Hero slider</h3>
            <p>Anasayfadaki ana vitrin alanlari.</p>
          </div>
          <button className="admin-secondary-button" onClick={() => setForm({ ...form, heroSlides: [...form.heroSlides, emptyHeroSlide()] })} type="button">
            Slide ekle
          </button>
        </div>
        <div className="variant-list">
          {form.heroSlides.map((slide, index) => (
            <div className="admin-panel" key={`${slide.title}-${index}`}>
              <div className="admin-form-grid">
                <label className="admin-label">
                  <span>Rozet</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, badge: event.target.value }) })} value={slide.badge} />
                </label>
                <label className="admin-label">
                  <span>Baslik</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, title: event.target.value }) })} value={slide.title} />
                </label>
                <label className="admin-label">
                  <span>Alt baslik</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, subtitle: event.target.value }) })} value={slide.subtitle} />
                </label>
                <label className="admin-label">
                  <span>Buton metni</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, ctaLabel: event.target.value }) })} value={slide.ctaLabel} />
                </label>
                <label className="admin-label">
                  <span>Buton linki</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, ctaHref: event.target.value }) })} value={slide.ctaHref} />
                </label>
                <label className="admin-label admin-span-full">
                  <span>Aciklama</span>
                  <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, description: event.target.value }) })} rows={4} value={slide.description} />
                </label>
                <MediaPickerField
                  items={mediaItems}
                  label="Hero gorseli"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, imageUrl: value }),
                    })
                  }
                  value={slide.imageUrl}
                />
                <MediaPickerField
                  allowedTypes={['video']}
                  helperText="Bu alan doluysa slide gorsel yerine video olarak oynatilir."
                  items={mediaItems}
                  label="Hero videosu (opsiyonel)"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, videoUrl: value }),
                    })
                  }
                  value={slide.videoUrl}
                />
                <MediaPickerField
                  allowedTypes={['image']}
                  helperText="Video kullanildiginda ilk acilista gosterilecek kapak gorseli."
                  items={mediaItems}
                  label="Video kapak gorseli (opsiyonel)"
                  onChange={(value) =>
                    setForm({
                      ...form,
                      heroSlides: replaceAtIndex(form.heroSlides, index, { ...slide, posterUrl: value }),
                    })
                  }
                  value={slide.posterUrl}
                />
              </div>
              <div className="admin-form-actions" style={{ marginTop: 12 }}>
                <button className="admin-danger-button" onClick={() => setForm({ ...form, heroSlides: form.heroSlides.filter((_, itemIndex) => itemIndex !== index) })} type="button">
                  Slide sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Magaza sayfalari</h3>
            <p>Kategoriler, urunler ve kampanyalar sayfalarinin hero, CTA ve medya alanlari.</p>
          </div>
        </div>

        <div className="variant-list">
          {([
            ['categories', 'Kategoriler sayfasi'],
            ['products', 'Urunler sayfasi'],
            ['campaigns', 'Kampanyalar sayfasi'],
          ] as const).map(([key, label]) => {
            const page = form.pages[key] as WebsiteManagedPageContent;

            return (
              <div className="admin-panel" key={key}>
                <div className="admin-panel-header">
                  <div>
                    <h3>{label}</h3>
                    <p>Bu sayfanin acilis alani ve sag ozet kutusu.</p>
                  </div>
                  <button
                    className="admin-secondary-button"
                    onClick={() =>
                      updateManagedPage(key, {
                        ...page,
                        highlights: [...page.highlights, emptyManagedHighlight()],
                      })
                    }
                    type="button"
                  >
                    Vurgu ekle
                  </button>
                </div>

                <div className="admin-form-grid">
                  <label className="admin-label">
                    <span>Rozet</span>
                    <input
                      className="admin-input"
                      onChange={(event) => updateManagedPage(key, { ...page, badge: event.target.value })}
                      value={page.badge}
                    />
                  </label>
                  <label className="admin-label">
                    <span>Baslik</span>
                    <input
                      className="admin-input"
                      onChange={(event) => updateManagedPage(key, { ...page, title: event.target.value })}
                      value={page.title}
                    />
                  </label>
                  <label className="admin-label admin-span-full">
                    <span>Aciklama</span>
                    <textarea
                      className="admin-textarea"
                      onChange={(event) =>
                        updateManagedPage(key, { ...page, description: event.target.value })
                      }
                      rows={3}
                      value={page.description}
                    />
                  </label>
                  <label className="admin-label">
                    <span>Birincil CTA</span>
                    <input
                      className="admin-input"
                      onChange={(event) =>
                        updateManagedPage(key, { ...page, primaryCtaLabel: event.target.value })
                      }
                      value={page.primaryCtaLabel}
                    />
                  </label>
                  <label className="admin-label">
                    <span>Birincil CTA linki</span>
                    <input
                      className="admin-input"
                      onChange={(event) =>
                        updateManagedPage(key, { ...page, primaryCtaHref: event.target.value })
                      }
                      value={page.primaryCtaHref}
                    />
                  </label>
                  <label className="admin-label">
                    <span>Ikincil CTA</span>
                    <input
                      className="admin-input"
                      onChange={(event) =>
                        updateManagedPage(key, { ...page, secondaryCtaLabel: event.target.value })
                      }
                      value={page.secondaryCtaLabel}
                    />
                  </label>
                  <label className="admin-label">
                    <span>Ikincil CTA linki</span>
                    <input
                      className="admin-input"
                      onChange={(event) =>
                        updateManagedPage(key, { ...page, secondaryCtaHref: event.target.value })
                      }
                      value={page.secondaryCtaHref}
                    />
                  </label>
                  <label className="admin-label">
                    <span>Ozet basligi</span>
                    <input
                      className="admin-input"
                      onChange={(event) =>
                        updateManagedPage(key, { ...page, summaryTitle: event.target.value })
                      }
                      value={page.summaryTitle}
                    />
                  </label>
                  <label className="admin-label admin-span-full">
                    <span>Ozet aciklamasi</span>
                    <textarea
                      className="admin-textarea"
                      onChange={(event) =>
                        updateManagedPage(key, { ...page, summaryText: event.target.value })
                      }
                      rows={3}
                      value={page.summaryText}
                    />
                  </label>
                  <MediaPickerField
                    items={mediaItems}
                    label="Sayfa gorseli"
                    onChange={(value) => updateManagedPage(key, { ...page, mediaUrl: value })}
                    value={page.mediaUrl}
                  />
                  <MediaPickerField
                    allowedTypes={['video']}
                    helperText="Dilerseniz sayfa hero alaninda video oynatabilirsiniz."
                    items={mediaItems}
                    label="Sayfa videosu (opsiyonel)"
                    onChange={(value) => updateManagedPage(key, { ...page, videoUrl: value })}
                    value={page.videoUrl}
                  />
                  <MediaPickerField
                    allowedTypes={['image']}
                    helperText="Video icin kapak gorseli."
                    items={mediaItems}
                    label="Video poster (opsiyonel)"
                    onChange={(value) => updateManagedPage(key, { ...page, posterUrl: value })}
                    value={page.posterUrl}
                  />
                </div>

                <div className="variant-list" style={{ marginTop: 12 }}>
                  {page.highlights.map((highlight, index) => (
                    <div className="variant-item" key={`${key}-highlight-${index}`}>
                      <label className="admin-label">
                        <span>Vurgu</span>
                        <input
                          className="admin-input"
                          onChange={(event) =>
                            updateManagedPage(key, {
                              ...page,
                              highlights: replaceAtIndex(page.highlights, index, event.target.value),
                            })
                          }
                          value={highlight}
                        />
                      </label>
                      <button
                        className="admin-danger-button"
                        onClick={() =>
                          updateManagedPage(key, {
                            ...page,
                            highlights:
                              page.highlights.filter((_, itemIndex) => itemIndex !== index).length > 0
                                ? page.highlights.filter((_, itemIndex) => itemIndex !== index)
                                : [emptyManagedHighlight()],
                          })
                        }
                        type="button"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Kampanya kartlari</h3>
              <p>Parallax ve promo alanlarinda kullanilan gorsel bloklar.</p>
            </div>
            <div className="admin-form-actions">
              <button
                className="admin-secondary-button"
                onClick={() => setForm({ ...form, parallaxCards: [...form.parallaxCards, emptyParallaxCard()] })}
                type="button"
              >
                Parallax kart ekle
              </button>
              <button
                className="admin-secondary-button"
                onClick={() => setForm({ ...form, promoCards: [...form.promoCards, emptyPromoCard()] })}
                type="button"
              >
                Promo kart ekle
              </button>
            </div>
          </div>

          <div className="variant-list">
            {form.parallaxCards.map((card, index) => (
              <div className="admin-panel" key={`${card.title}-${index}`}>
                <div className="admin-form-grid">
                  <label className="admin-label">
                    <span>Baslik</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, parallaxCards: replaceAtIndex(form.parallaxCards, index, { ...card, title: event.target.value }) })} value={card.title} />
                  </label>
                  <label className="admin-label">
                    <span>Alt baslik</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, parallaxCards: replaceAtIndex(form.parallaxCards, index, { ...card, subtitle: event.target.value }) })} value={card.subtitle} />
                  </label>
                  <label className="admin-label">
                    <span>Buton</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, parallaxCards: replaceAtIndex(form.parallaxCards, index, { ...card, ctaLabel: event.target.value }) })} value={card.ctaLabel} />
                  </label>
                  <label className="admin-label">
                    <span>Link</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, parallaxCards: replaceAtIndex(form.parallaxCards, index, { ...card, ctaHref: event.target.value }) })} value={card.ctaHref} />
                  </label>
                  <MediaPickerField items={mediaItems} label="Gorsel" onChange={(value) => setForm({ ...form, parallaxCards: replaceAtIndex(form.parallaxCards, index, { ...card, imageUrl: value }) })} value={card.imageUrl} />
                </div>
                <div className="admin-form-actions" style={{ marginTop: 12 }}>
                  <button
                    className="admin-danger-button"
                    onClick={() =>
                      setForm({
                        ...form,
                        parallaxCards: form.parallaxCards.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    type="button"
                  >
                    Karti sil
                  </button>
                </div>
              </div>
            ))}

            {form.promoCards.map((card, index) => (
              <div className="admin-panel" key={`${card.title}-${index}`}>
                <div className="admin-form-grid">
                  <label className="admin-label">
                    <span>Promo baslik</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, promoCards: replaceAtIndex(form.promoCards, index, { ...card, title: event.target.value }) })} value={card.title} />
                  </label>
                  <label className="admin-label">
                    <span>Promo alt baslik</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, promoCards: replaceAtIndex(form.promoCards, index, { ...card, subtitle: event.target.value }) })} value={card.subtitle} />
                  </label>
                  <label className="admin-label">
                    <span>Buton</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, promoCards: replaceAtIndex(form.promoCards, index, { ...card, ctaLabel: event.target.value }) })} value={card.ctaLabel} />
                  </label>
                  <label className="admin-label">
                    <span>Link</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, promoCards: replaceAtIndex(form.promoCards, index, { ...card, ctaHref: event.target.value }) })} value={card.ctaHref} />
                  </label>
                  <MediaPickerField items={mediaItems} label="Promo gorseli" onChange={(value) => setForm({ ...form, promoCards: replaceAtIndex(form.promoCards, index, { ...card, imageUrl: value }) })} value={card.imageUrl} />
                </div>
                <div className="admin-form-actions" style={{ marginTop: 12 }}>
                  <button
                    className="admin-danger-button"
                    onClick={() =>
                      setForm({
                        ...form,
                        promoCards: form.promoCards.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    type="button"
                  >
                    Promo karti sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Bolum basliklari ve avantajlar</h3>
              <p>Anasayfadaki urun bloklari, newsletter ve avantaj kartlari.</p>
            </div>
            <button
              className="admin-secondary-button"
              onClick={() => setForm({ ...form, featureItems: [...form.featureItems, emptyFeatureItem()] })}
              type="button"
            >
              Avantaj karti ekle
            </button>
          </div>

          <div className="admin-form-grid">
            <label className="admin-label">
              <span>Sicak firsatlar baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, homeSections: { ...form.homeSections, hotDealsTitle: event.target.value } })} value={form.homeSections.hotDealsTitle} />
            </label>
            <label className="admin-label">
              <span>One cikanlar baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, homeSections: { ...form.homeSections, featuredTitle: event.target.value } })} value={form.homeSections.featuredTitle} />
            </label>
            <label className="admin-label">
              <span>Cok satanlar baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, homeSections: { ...form.homeSections, bestSellersTitle: event.target.value } })} value={form.homeSections.bestSellersTitle} />
            </label>
            <label className="admin-label">
              <span>Populer baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, homeSections: { ...form.homeSections, popularTitle: event.target.value } })} value={form.homeSections.popularTitle} />
            </label>
            <label className="admin-label">
              <span>Blog baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, homeSections: { ...form.homeSections, blogTitle: event.target.value } })} value={form.homeSections.blogTitle} />
            </label>
            <label className="admin-label">
              <span>Newsletter baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, newsletterTitle: event.target.value })} value={form.newsletterTitle} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Blog aciklama</span>
              <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, homeSections: { ...form.homeSections, blogDescription: event.target.value } })} rows={3} value={form.homeSections.blogDescription} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Newsletter aciklama</span>
              <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, newsletterDescription: event.target.value })} rows={3} value={form.newsletterDescription} />
            </label>
          </div>

          <div className="variant-list" style={{ marginTop: 12 }}>
            {form.featureItems.map((item, index) => (
              <div className="variant-item" key={`${item.title}-${index}`}>
                <label className="admin-label">
                  <span>Ikon kodu</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, featureItems: replaceAtIndex(form.featureItems, index, { ...item, icon: event.target.value }) })} value={item.icon} />
                </label>
                <label className="admin-label">
                  <span>Baslik</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, featureItems: replaceAtIndex(form.featureItems, index, { ...item, title: event.target.value }) })} value={item.title} />
                </label>
                <label className="admin-label">
                  <span>Aciklama</span>
                  <input className="admin-input" onChange={(event) => setForm({ ...form, featureItems: replaceAtIndex(form.featureItems, index, { ...item, description: event.target.value }) })} value={item.description} />
                </label>
                <button
                  className="admin-danger-button"
                  onClick={() =>
                    setForm({
                      ...form,
                      featureItems: form.featureItems.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  type="button"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Ribbon ve iletisim sayfasi</h3>
              <p>Kampanya seridi ve iletisim sayfasinin metinleri.</p>
            </div>
          </div>
          <div className="admin-form-grid">
            <label className="admin-label">
              <span>Ribbon ust baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, ribbon: { ...form.ribbon, eyebrow: event.target.value } })} value={form.ribbon.eyebrow} />
            </label>
            <label className="admin-label">
              <span>Ribbon baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, ribbon: { ...form.ribbon, title: event.target.value } })} value={form.ribbon.title} />
            </label>
            <label className="admin-label">
              <span>Ribbon buton</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, ribbon: { ...form.ribbon, ctaLabel: event.target.value } })} value={form.ribbon.ctaLabel} />
            </label>
            <label className="admin-label">
              <span>Ribbon link</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, ribbon: { ...form.ribbon, ctaHref: event.target.value } })} value={form.ribbon.ctaHref} />
            </label>
            <MediaPickerField items={mediaItems} label="Ribbon gorseli" onChange={(value) => setForm({ ...form, ribbon: { ...form.ribbon, imageUrl: value } })} value={form.ribbon.imageUrl} />
            <label className="admin-label">
              <span>Iletisim hero rozeti</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, badge: event.target.value } })} value={form.contactPage.badge} />
            </label>
            <label className="admin-label">
              <span>Iletisim hero basligi</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, title: event.target.value } })} value={form.contactPage.title} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Iletisim hero aciklama</span>
              <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, description: event.target.value } })} rows={3} value={form.contactPage.description} />
            </label>
            <label className="admin-label">
              <span>Hizli bilgi basligi</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, quickInfoTitle: event.target.value } })} value={form.contactPage.quickInfoTitle} />
            </label>
            <label className="admin-label">
              <span>Harita basligi</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, mapTitle: event.target.value } })} value={form.contactPage.mapTitle} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Harita aciklamasi</span>
              <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, mapDescription: event.target.value } })} rows={3} value={form.contactPage.mapDescription} />
            </label>
            <label className="admin-label">
              <span>Form basligi</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, formTitle: event.target.value } })} value={form.contactPage.formTitle} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Form aciklamasi</span>
              <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, contactPage: { ...form.contactPage, formDescription: event.target.value } })} rows={3} value={form.contactPage.formDescription} />
            </label>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Footer linkleri</h3>
              <p>Footer kolonlari ve menu baglantilari.</p>
            </div>
            <button className="admin-secondary-button" onClick={() => setForm({ ...form, footerColumns: [...form.footerColumns, emptyFooterColumn()] })} type="button">
              Kolon ekle
            </button>
          </div>
          <div className="variant-list">
            {form.footerColumns.map((column, columnIndex) => (
              <div className="admin-panel" key={`${column.title}-${columnIndex}`}>
                <div className="admin-form-grid">
                  <label className="admin-label admin-span-full">
                    <span>Kolon baslik</span>
                    <input className="admin-input" onChange={(event) => setForm({ ...form, footerColumns: replaceAtIndex(form.footerColumns, columnIndex, { ...column, title: event.target.value }) })} value={column.title} />
                  </label>
                </div>
                <div className="variant-list" style={{ marginTop: 12 }}>
                  {column.links.map((link, linkIndex) => (
                    <div className="variant-item" key={`${link.label}-${linkIndex}`}>
                      <label className="admin-label">
                        <span>Link metni</span>
                        <input className="admin-input" onChange={(event) => {
                          const nextLinks = replaceAtIndex(column.links, linkIndex, { ...link, label: event.target.value });
                          setForm({ ...form, footerColumns: replaceAtIndex(form.footerColumns, columnIndex, { ...column, links: nextLinks }) });
                        }} value={link.label} />
                      </label>
                      <label className="admin-label">
                        <span>Hedef</span>
                        <input className="admin-input" onChange={(event) => {
                          const nextLinks = replaceAtIndex(column.links, linkIndex, { ...link, href: event.target.value });
                          setForm({ ...form, footerColumns: replaceAtIndex(form.footerColumns, columnIndex, { ...column, links: nextLinks }) });
                        }} value={link.href} />
                      </label>
                      <button className="admin-danger-button" onClick={() => {
                        const nextLinks = column.links.filter((_, itemIndex) => itemIndex !== linkIndex);
                        setForm({ ...form, footerColumns: replaceAtIndex(form.footerColumns, columnIndex, { ...column, links: nextLinks.length > 0 ? nextLinks : [emptyFooterLink()] }) });
                      }} type="button">
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Yasal sayfalar</h3>
            <p>KVKK, gizlilik ve satis sozlesmesi metinlerini yonetin.</p>
          </div>
        </div>

        <div className="variant-list">
          {([
            ['kvkk', 'KVKK'],
            ['privacy', 'Gizlilik'],
            ['sales', 'Satis sozlesmesi'],
          ] as const).map(([key, label]) => {
            const document = cloneLegalDocument(form.legalPages[key]);

            return (
              <div className="admin-panel" key={key}>
                <div className="admin-panel-header">
                  <div>
                    <h3>{label}</h3>
                    <p>{document.sections.length} bolum</p>
                  </div>
                  <button
                    className="admin-secondary-button"
                    onClick={() =>
                      setForm({
                        ...form,
                        legalPages: {
                          ...form.legalPages,
                          [key]: {
                            ...document,
                            sections: [...document.sections, emptyLegalSection()],
                          },
                        },
                      })
                    }
                    type="button"
                  >
                    Bolum ekle
                  </button>
                </div>

                <div className="admin-form-grid">
                  <label className="admin-label">
                    <span>Sayfa basligi</span>
                    <input
                      className="admin-input"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          legalPages: {
                            ...form.legalPages,
                            [key]: { ...document, title: event.target.value },
                          },
                        })
                      }
                      value={document.title}
                    />
                  </label>
                  <label className="admin-label admin-span-full">
                    <span>Sayfa alt aciklamasi</span>
                    <textarea
                      className="admin-textarea"
                      onChange={(event) =>
                        setForm({
                          ...form,
                          legalPages: {
                            ...form.legalPages,
                            [key]: { ...document, subtitle: event.target.value },
                          },
                        })
                      }
                      rows={3}
                      value={document.subtitle}
                    />
                  </label>
                </div>

                <div className="variant-list" style={{ marginTop: 12 }}>
                  {document.sections.map((section, index) => (
                    <div className="admin-panel" key={`${section.heading}-${index}`}>
                      <div className="admin-form-grid">
                        <label className="admin-label">
                          <span>Bolum basligi</span>
                          <input
                            className="admin-input"
                            onChange={(event) => {
                              const nextSections = replaceAtIndex(document.sections, index, {
                                ...section,
                                heading: event.target.value,
                              });
                              setForm({
                                ...form,
                                legalPages: {
                                  ...form.legalPages,
                                  [key]: { ...document, sections: nextSections },
                                },
                              });
                            }}
                            value={section.heading}
                          />
                        </label>
                        <label className="admin-label admin-span-full">
                          <span>Icerik</span>
                          <textarea
                            className="admin-textarea"
                            onChange={(event) => {
                              const nextSections = replaceAtIndex(document.sections, index, {
                                ...section,
                                body: event.target.value,
                              });
                              setForm({
                                ...form,
                                legalPages: {
                                  ...form.legalPages,
                                  [key]: { ...document, sections: nextSections },
                                },
                              });
                            }}
                            rows={5}
                            value={section.body}
                          />
                        </label>
                      </div>
                      <div className="admin-form-actions" style={{ marginTop: 12 }}>
                        <button
                          className="admin-danger-button"
                          onClick={() => {
                            const nextSections = document.sections.filter((_, itemIndex) => itemIndex !== index);
                            setForm({
                              ...form,
                              legalPages: {
                                ...form.legalPages,
                                [key]: {
                                  ...document,
                                  sections: nextSections.length > 0 ? nextSections : [emptyLegalSection()],
                                },
                              },
                            });
                          }}
                          type="button"
                        >
                          Bolumu sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="admin-form-actions">
        <button className="admin-primary-button" disabled={saving} type="submit">
          {saving ? 'Kaydediliyor...' : 'Website icerigini kaydet'}
        </button>
      </div>
    </form>
  );
}
