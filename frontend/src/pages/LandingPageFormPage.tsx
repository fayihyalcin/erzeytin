import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MediaPickerField } from '../components/admin/MediaPickerField';
import { parseMediaLibrary } from '../lib/admin-content';
import { fetchSettingsRecord } from '../lib/admin-settings';
import { api, extractApiError } from '../lib/api';
import {
  createDefaultLandingFaqItem,
  createDefaultLandingFooterLink,
  createDefaultLandingInfoCard,
  createDefaultLandingPackage,
  createDefaultLandingPage,
  createDefaultLandingReview,
  resolveLandingPagePath,
  slugifyLandingPage,
} from '../lib/landing-pages';
import { resolveMediaAssetUrl } from '../lib/media-library';
import type {
  LandingPage,
  LandingPageConfig,
  LandingPageFaqItem,
  LandingPageFooterLink,
  LandingPageInfoCard,
  LandingPagePackage,
  LandingPageReview,
  MediaItem,
} from '../types/api';

type LandingPageFormState = Omit<
  LandingPage,
  'id' | 'createdAt' | 'updatedAt' | 'publishedAt'
>;

function copyWithArrayItem<T>(items: T[], index: number, nextValue: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextValue : item));
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function toForm(page: LandingPage): LandingPageFormState {
  return {
    name: page.name,
    slug: page.slug,
    status: page.status,
    featuredImage: page.featuredImage,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    config: page.config,
  };
}

export function LandingPageFormPage() {
  const navigate = useNavigate();
  const { landingPageId } = useParams<{ landingPageId: string }>();
  const [form, setForm] = useState<LandingPageFormState>(createDefaultLandingPage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const orderedGalleryPreview = useMemo(
    () => [
      form.featuredImage?.trim()
        ? {
            url: resolveMediaAssetUrl(form.featuredImage),
            title: '1. Ana gorsel',
            description: 'Sag kolonda en ustte gorunur.',
          }
        : null,
      ...form.config.galleryImages
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item, index) => ({
          url: resolveMediaAssetUrl(item),
          title: `${form.featuredImage?.trim() ? index + 2 : index + 1}. Galeri gorseli`,
          description: 'Bir onceki gorselin altinda yayinlanir.',
        })),
    ].filter((item): item is { url: string; title: string; description: string } => Boolean(item)),
    [form.config.galleryImages, form.featuredImage],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const settingsRecord = await fetchSettingsRecord();
        if (!mounted) {
          return;
        }

        setMediaItems(parseMediaLibrary(settingsRecord.mediaLibrary));

        if (!landingPageId) {
          setEditingId(null);
          setForm(createDefaultLandingPage());
          setSlugEditedManually(false);
          return;
        }

        const response = await api.get<LandingPage>(`/landing-pages/${landingPageId}`);
        if (!mounted) {
          return;
        }

        setEditingId(response.data.id);
        setForm(toForm(response.data));
        setSlugEditedManually(Boolean(response.data.slug));
      } catch (requestError) {
        if (mounted) {
          setMessage(extractApiError(requestError, 'Landing page formu yuklenemedi.'));
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
  }, [landingPageId]);

  const updateConfig = (patch: Partial<LandingPageConfig>) => {
    setForm((current) => ({
      ...current,
      config: {
        ...current.config,
        ...patch,
      },
    }));
  };

  const handleNameChange = (value: string) => {
    setForm((current) => {
      const nextSlug = slugEditedManually ? current.slug : slugifyLandingPage(value);
      const currentDefaultInfoTitle = `${current.name} Urun Bilgileri`;
      const nextInfoTitle =
        current.config.productInfoTitle === currentDefaultInfoTitle
          ? `${value || 'Tekli Urun Kampanyasi'} Urun Bilgileri`
          : current.config.productInfoTitle;

      return {
        ...current,
        name: value,
        slug: nextSlug,
        config: {
          ...current.config,
          productInfoTitle: nextInfoTitle,
        },
      };
    });
  };

  const handleSlugChange = (value: string) => {
    const slug = slugifyLandingPage(value);
    setForm((current) => ({
      ...current,
      slug,
    }));
    setSlugEditedManually(value.trim().length > 0);
  };

  const updatePackage = (index: number, patch: Partial<LandingPagePackage>) => {
    const nextItems = copyWithArrayItem(form.config.packages, index, {
      ...form.config.packages[index],
      ...patch,
    });
    updateConfig({ packages: nextItems });
  };

  const updateInfoCard = (index: number, patch: Partial<LandingPageInfoCard>) => {
    const nextItems = copyWithArrayItem(form.config.infoCards, index, {
      ...form.config.infoCards[index],
      ...patch,
    });
    updateConfig({ infoCards: nextItems });
  };

  const updateFaqItem = (index: number, patch: Partial<LandingPageFaqItem>) => {
    const nextItems = copyWithArrayItem(form.config.faqItems, index, {
      ...form.config.faqItems[index],
      ...patch,
    });
    updateConfig({ faqItems: nextItems });
  };

  const updateReview = (index: number, patch: Partial<LandingPageReview>) => {
    const nextItems = copyWithArrayItem(form.config.reviews, index, {
      ...form.config.reviews[index],
      ...patch,
    });
    updateConfig({ reviews: nextItems });
  };

  const updateFooterLink = (index: number, patch: Partial<LandingPageFooterLink>) => {
    const nextItems = copyWithArrayItem(form.config.footerLinks, index, {
      ...form.config.footerLinks[index],
      ...patch,
    });
    updateConfig({ footerLinks: nextItems });
  };

  const updateStringList = (field: 'trustBadges' | 'galleryImages', index: number, value: string) => {
    const nextItems = form.config[field].map((item, itemIndex) =>
      itemIndex === index ? value : item,
    );
    updateConfig({ [field]: nextItems } as Partial<LandingPageConfig>);
  };

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    updateConfig({
      galleryImages: moveArrayItem(form.config.galleryImages, index, index + direction),
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        status: form.status,
        featuredImage: form.featuredImage || '',
        seoTitle: form.seoTitle || '',
        seoDescription: form.seoDescription || '',
        config: {
          ...form.config,
          stepLabels: form.config.stepLabels.map((item) => item.trim()).filter(Boolean),
          trustBadges: form.config.trustBadges.map((item) => item.trim()).filter(Boolean),
          galleryImages: form.config.galleryImages.map((item) => item.trim()).filter(Boolean),
          packages: form.config.packages.map((item) => ({
            ...item,
            title: item.title.trim(),
            subtitle: item.subtitle.trim(),
            note: item.note?.trim() || '',
            badge: item.badge?.trim() || '',
            highlight: item.highlight?.trim() || '',
          })),
          infoCards: form.config.infoCards.map((item) => ({
            ...item,
            title: item.title.trim(),
            icon: item.icon.trim(),
            items: item.items.map((entry) => entry.trim()).filter(Boolean),
          })),
          faqItems: form.config.faqItems.map((item) => ({
            ...item,
            question: item.question.trim(),
            answer: item.answer.trim(),
          })),
          reviews: form.config.reviews.map((item) => ({
            ...item,
            name: item.name.trim(),
            initials: item.initials.trim(),
            comment: item.comment.trim(),
          })),
          footerLinks: form.config.footerLinks.map((item) => ({
            ...item,
            label: item.label.trim(),
            href: item.href.trim(),
          })),
        },
      };

      if (editingId) {
        await api.patch(`/landing-pages/${editingId}`, payload);
      } else {
        const response = await api.post<LandingPage>('/landing-pages', payload);
        setEditingId(response.data.id);
      }

      setMessage('Landing page kaydedildi.');
      navigate('/dashboard/landing-pages');
    } catch (requestError) {
      setMessage(extractApiError(requestError, 'Landing page kaydedilemedi.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="admin-panel">Landing page formu yukleniyor...</section>;
  }

  return (
    <form className="admin-page-stack" onSubmit={handleSubmit}>
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Landing / Form</span>
          <h2>{editingId ? 'Landing page duzenle' : 'Yeni landing page'}</h2>
          <p>
            Reklamdan gelen kullanici icin tekil urun sayfasini, paketlerini ve siparis
            akisini buradan yonetin.
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-secondary-button" type="submit">
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            className="admin-ghost-button"
            onClick={() => {
              if (!editingId) {
                setMessage('Onizleme icin once sayfayi kaydetmelisiniz.');
                return;
              }

              window.open(`/landing-preview/${editingId}`, '_blank', 'noopener,noreferrer');
            }}
            type="button"
          >
            Onizleme
          </button>
          {form.status === 'PUBLISHED' ? (
            <button
              className="admin-ghost-button"
              onClick={() =>
                window.open(resolveLandingPagePath(form.slug), '_blank', 'noopener,noreferrer')
              }
              type="button"
            >
              Canli URL
            </button>
          ) : null}
          <button
            className="admin-ghost-button"
            onClick={() => navigate('/dashboard/landing-pages')}
            type="button"
          >
            Vazgec
          </button>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span>URL</span>
          <strong style={{ fontSize: 18 }}>{resolveLandingPagePath(form.slug)}</strong>
          <small>Ayrica reklamda kullanilacak landing path</small>
        </article>
        <article className="admin-stat-card">
          <span>Paket</span>
          <strong>{form.config.packages.length}</strong>
          <small>Aktif fiyat paketi</small>
        </article>
        <article className="admin-stat-card">
          <span>Durum</span>
          <strong>{form.status === 'PUBLISHED' ? 'Yayinda' : 'Taslak'}</strong>
          <small>Yayin kontrolu</small>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Genel ayarlar</h3>
            <p>Baslik, slug, yayin durumu ve ana gorsel.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-label">
            <span>Landing page adi</span>
            <input
              className="admin-input"
              onChange={(event) => handleNameChange(event.target.value)}
              value={form.name}
            />
          </label>
          <label className="admin-label">
            <span>URL slug</span>
            <input
              className="admin-input"
              onChange={(event) => handleSlugChange(event.target.value)}
              value={form.slug}
            />
          </label>
          <label className="admin-label">
            <span>Durum</span>
            <select
              className="admin-select"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as LandingPage['status'],
                }))
              }
              value={form.status}
            >
              <option value="DRAFT">Taslak</option>
              <option value="PUBLISHED">Yayina al</option>
            </select>
          </label>
          <label className="admin-label">
            <span>SEO baslik</span>
            <input
              className="admin-input"
              onChange={(event) =>
                setForm((current) => ({ ...current, seoTitle: event.target.value }))
              }
              value={form.seoTitle ?? ''}
            />
          </label>
          <label className="admin-label admin-span-full">
            <span>SEO aciklama</span>
            <textarea
              className="admin-textarea"
              onChange={(event) =>
                setForm((current) => ({ ...current, seoDescription: event.target.value }))
              }
              rows={4}
              value={form.seoDescription ?? ''}
            />
          </label>
        </div>

        <MediaPickerField
          allowedTypes={['image']}
          helperText="Sag kolondaki ilk ve en buyuk gorsel olarak kullanilir."
          items={mediaItems}
          label="Ana gorsel"
          onChange={(value) =>
            setForm((current) => ({
              ...current,
              featuredImage: value,
            }))
          }
          onItemsChange={setMediaItems}
          value={form.featuredImage ?? ''}
        />

        {orderedGalleryPreview.length > 0 ? (
          <div className="admin-panel" style={{ marginTop: 18 }}>
            <div className="admin-panel-header">
              <div>
                <h3>Sag kolon gorsel akisi</h3>
                <p>
                  Landing page yayininda gorseller bu sirayla alt alta gosterilir.
                </p>
              </div>
            </div>

            <div className="variant-list">
              {orderedGalleryPreview.map((item, index) => (
                <div className="admin-media-inline-preview" key={`${item.url}-${index}`}>
                  <img alt={`Landing gorseli ${index + 1}`} src={item.url} />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Form akisi</h3>
            <p>Ustteki basliklar, sayaclar ve buton metinleri.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-label">
            <span>Ust baslik</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ announcementTitle: event.target.value })}
              value={form.config.announcementTitle}
            />
          </label>
          <label className="admin-label">
            <span>Ust aciklama</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ announcementSubtitle: event.target.value })}
              value={form.config.announcementSubtitle}
            />
          </label>
          <label className="admin-label">
            <span>Adim 1</span>
            <input
              className="admin-input"
              onChange={(event) =>
                updateConfig({
                  stepLabels: copyWithArrayItem(form.config.stepLabels, 0, event.target.value),
                })
              }
              value={form.config.stepLabels[0] ?? ''}
            />
          </label>
          <label className="admin-label">
            <span>Adim 2</span>
            <input
              className="admin-input"
              onChange={(event) =>
                updateConfig({
                  stepLabels: copyWithArrayItem(form.config.stepLabels, 1, event.target.value),
                })
              }
              value={form.config.stepLabels[1] ?? ''}
            />
          </label>
          <label className="admin-label">
            <span>Adim 3</span>
            <input
              className="admin-input"
              onChange={(event) =>
                updateConfig({
                  stepLabels: copyWithArrayItem(form.config.stepLabels, 2, event.target.value),
                })
              }
              value={form.config.stepLabels[2] ?? ''}
            />
          </label>
          <label className="admin-label">
            <span>Paket basligi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ packageSectionTitle: event.target.value })}
              value={form.config.packageSectionTitle}
            />
          </label>
          <label className="admin-label">
            <span>Form basligi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ orderSectionTitle: event.target.value })}
              value={form.config.orderSectionTitle}
            />
          </label>
          <label className="admin-label">
            <span>Odeme basligi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ paymentSectionTitle: event.target.value })}
              value={form.config.paymentSectionTitle}
            />
          </label>
          <label className="admin-label">
            <span>Adres placeholder</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ addressPlaceholder: event.target.value })}
              value={form.config.addressPlaceholder}
            />
          </label>
          <label className="admin-label">
            <span>Buton metni</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ orderButtonLabel: event.target.value })}
              value={form.config.orderButtonLabel}
            />
          </label>
          <label className="admin-label">
            <span>Mobil sticky buton</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ stickyButtonLabel: event.target.value })}
              value={form.config.stickyButtonLabel}
            />
          </label>
          <label className="admin-label admin-span-full">
            <span>Sozlesme metni</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ termsLabel: event.target.value })}
              value={form.config.termsLabel}
            />
          </label>
          <label className="admin-label">
            <span>Ziyaretci sayisi</span>
            <input
              className="admin-input"
              min="0"
              onChange={(event) =>
                updateConfig({ visitorCount: Number(event.target.value || 0) })
              }
              type="number"
              value={form.config.visitorCount}
            />
          </label>
          <label className="admin-label">
            <span>Ziyaretci etiketi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ visitorLabel: event.target.value })}
              value={form.config.visitorLabel}
            />
          </label>
          <label className="admin-label">
            <span>Stok sayisi</span>
            <input
              className="admin-input"
              min="0"
              onChange={(event) => updateConfig({ stockCount: Number(event.target.value || 0) })}
              type="number"
              value={form.config.stockCount}
            />
          </label>
          <label className="admin-label">
            <span>Stok etiketi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ stockLabel: event.target.value })}
              value={form.config.stockLabel}
            />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Paketler</h3>
            <p>Ornekteki gibi 1 adet, 2 adet, 3 adet tekliflerini dinamik yonetin.</p>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig({
                packages: [...form.config.packages, createDefaultLandingPackage(form.name)],
              })
            }
            type="button"
          >
            Paket ekle
          </button>
        </div>

        <div className="variant-list">
          {form.config.packages.map((item, index) => (
            <div className="variant-item" key={item.id}>
              <label className="admin-label">
                <span>Paket basligi</span>
                <input
                  className="admin-input"
                  onChange={(event) => updatePackage(index, { title: event.target.value })}
                  value={item.title}
                />
              </label>
              <label className="admin-label">
                <span>Alt aciklama</span>
                <input
                  className="admin-input"
                  onChange={(event) => updatePackage(index, { subtitle: event.target.value })}
                  value={item.subtitle}
                />
              </label>
              <label className="admin-label">
                <span>Adet</span>
                <input
                  className="admin-input"
                  min="1"
                  onChange={(event) =>
                    updatePackage(index, { quantity: Number(event.target.value || 1) })
                  }
                  type="number"
                  value={item.quantity}
                />
              </label>
              <label className="admin-label">
                <span>Eski fiyat</span>
                <input
                  className="admin-input"
                  min="0"
                  onChange={(event) =>
                    updatePackage(index, { originalPrice: Number(event.target.value || 0) })
                  }
                  step="0.01"
                  type="number"
                  value={item.originalPrice}
                />
              </label>
              <label className="admin-label">
                <span>Satis fiyati</span>
                <input
                  className="admin-input"
                  min="0"
                  onChange={(event) =>
                    updatePackage(index, { price: Number(event.target.value || 0) })
                  }
                  step="0.01"
                  type="number"
                  value={item.price}
                />
              </label>
              <label className="admin-label">
                <span>Note</span>
                <input
                  className="admin-input"
                  onChange={(event) => updatePackage(index, { note: event.target.value })}
                  value={item.note ?? ''}
                />
              </label>
              <label className="admin-label">
                <span>Badge</span>
                <input
                  className="admin-input"
                  onChange={(event) => updatePackage(index, { badge: event.target.value })}
                  value={item.badge ?? ''}
                />
              </label>
              <label className="admin-label">
                <span>Kisa vurgu</span>
                <input
                  className="admin-input"
                  onChange={(event) => updatePackage(index, { highlight: event.target.value })}
                  value={item.highlight ?? ''}
                />
              </label>
              <label className="variant-default">
                <input
                  checked={Boolean(item.isDefault)}
                  onChange={(event) =>
                    updateConfig({
                      packages: form.config.packages.map((entry, entryIndex) => ({
                        ...entry,
                        isDefault: entryIndex === index ? event.target.checked : false,
                      })),
                    })
                  }
                  type="checkbox"
                />
                Varsayilan paket
              </label>
              <button
                className="admin-danger-button"
                onClick={() =>
                  updateConfig({
                    packages: form.config.packages.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
                type="button"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Alt satis icerigi</h3>
            <p>Urun bilgi metni, badge'ler ve galeri gorselleri.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-label">
            <span>Bilgi bolumu basligi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ productInfoTitle: event.target.value })}
              value={form.config.productInfoTitle}
            />
          </label>
          <label className="admin-label admin-span-full">
            <span>Bilgi bolumu aciklamasi</span>
            <textarea
              className="admin-textarea"
              onChange={(event) => updateConfig({ productInfoDescription: event.target.value })}
              rows={4}
              value={form.config.productInfoDescription}
            />
          </label>
        </div>

        <div className="admin-panel-header" style={{ marginTop: 18 }}>
          <div>
            <h3>Guven badge'leri</h3>
            <p>Hizli teslimat, kalite garantisi gibi metinler.</p>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig({
                trustBadges: [...form.config.trustBadges, 'Yeni badge'],
              })
            }
            type="button"
          >
            Badge ekle
          </button>
        </div>

        <div className="expense-list">
          {form.config.trustBadges.map((item, index) => (
            <div className="expense-row" key={`${item}-${index}`}>
              <input
                className="admin-input"
                onChange={(event) => updateStringList('trustBadges', index, event.target.value)}
                value={item}
              />
              <button
                className="admin-danger-button"
                onClick={() =>
                  updateConfig({
                    trustBadges: form.config.trustBadges.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  })
                }
                type="button"
              >
                Sil
              </button>
            </div>
          ))}
        </div>

        <div className="admin-panel-header" style={{ marginTop: 18 }}>
          <div>
            <h3>Galeri</h3>
            <p>
              Ana gorselden sonra sag kolonda alt alta yayinlanacak ek gorseller.
            </p>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig({
                galleryImages: [...form.config.galleryImages, ''],
              })
            }
            type="button"
          >
            Gorsel ekle
          </button>
        </div>

        <div className="variant-list">
          {form.config.galleryImages.map((item, index) => (
            <div className="admin-panel" key={`gallery-${index}`}>
              <div className="admin-panel-header">
                <div>
                  <h3>{`${index + 2}. gorsel`}</h3>
                  <p>Yayinda ana gorselden sonra bu sirada gosterilir.</p>
                </div>
              </div>

              <MediaPickerField
                allowedTypes={['image']}
                items={mediaItems}
                label={`Galeri gorseli ${index + 1}`}
                onChange={(value) => updateStringList('galleryImages', index, value)}
                onItemsChange={setMediaItems}
                value={item}
              />
              <div className="admin-form-actions">
                <button
                  className="admin-ghost-button"
                  disabled={index === 0}
                  onClick={() => moveGalleryImage(index, -1)}
                  type="button"
                >
                  Yukari al
                </button>
                <button
                  className="admin-ghost-button"
                  disabled={index === form.config.galleryImages.length - 1}
                  onClick={() => moveGalleryImage(index, 1)}
                  type="button"
                >
                  Asagi al
                </button>
                <button
                  className="admin-danger-button"
                  onClick={() =>
                    updateConfig({
                      galleryImages: form.config.galleryImages.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    })
                  }
                  type="button"
                >
                  Kaldir
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Bilgi kartlari</h3>
            <p>Alt bolumdeki ozellik / kutu icerigi / kullanim gibi kartlar.</p>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig({
                infoCards: [...form.config.infoCards, createDefaultLandingInfoCard()],
              })
            }
            type="button"
          >
            Kart ekle
          </button>
        </div>

        <div className="variant-list">
          {form.config.infoCards.map((item, index) => (
            <div className="admin-panel" key={item.id}>
              <div className="admin-form-grid">
                <label className="admin-label">
                  <span>Ikon</span>
                  <input
                    className="admin-input"
                    onChange={(event) => updateInfoCard(index, { icon: event.target.value })}
                    value={item.icon}
                  />
                </label>
                <label className="admin-label">
                  <span>Baslik</span>
                  <input
                    className="admin-input"
                    onChange={(event) => updateInfoCard(index, { title: event.target.value })}
                    value={item.title}
                  />
                </label>
                <label className="admin-label admin-span-full">
                  <span>Maddeler (satir satir)</span>
                  <textarea
                    className="admin-textarea"
                    onChange={(event) =>
                      updateInfoCard(index, {
                        items: event.target.value.split('\n'),
                      })
                    }
                    rows={5}
                    value={item.items.join('\n')}
                  />
                </label>
              </div>
              <div className="admin-form-actions">
                <button
                  className="admin-danger-button"
                  onClick={() =>
                    updateConfig({
                      infoCards: form.config.infoCards.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  type="button"
                >
                  Karti sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>SSS ve yorumlar</h3>
            <p>Sik sorulanlar ve musteri yorumlari bloklari.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-label">
            <span>SSS basligi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ faqTitle: event.target.value })}
              value={form.config.faqTitle}
            />
          </label>
          <label className="admin-label">
            <span>Yorum basligi</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ reviewsTitle: event.target.value })}
              value={form.config.reviewsTitle}
            />
          </label>
        </div>

        <div className="admin-panel-header" style={{ marginTop: 18 }}>
          <div>
            <h3>SSS maddeleri</h3>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig({
                faqItems: [...form.config.faqItems, createDefaultLandingFaqItem()],
              })
            }
            type="button"
          >
            Soru ekle
          </button>
        </div>

        <div className="variant-list">
          {form.config.faqItems.map((item, index) => (
            <div className="admin-panel" key={item.id}>
              <div className="admin-form-grid">
                <label className="admin-label admin-span-full">
                  <span>Soru</span>
                  <input
                    className="admin-input"
                    onChange={(event) => updateFaqItem(index, { question: event.target.value })}
                    value={item.question}
                  />
                </label>
                <label className="admin-label admin-span-full">
                  <span>Cevap</span>
                  <textarea
                    className="admin-textarea"
                    onChange={(event) => updateFaqItem(index, { answer: event.target.value })}
                    rows={4}
                    value={item.answer}
                  />
                </label>
              </div>
              <div className="admin-form-actions">
                <button
                  className="admin-danger-button"
                  onClick={() =>
                    updateConfig({
                      faqItems: form.config.faqItems.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  type="button"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-panel-header" style={{ marginTop: 18 }}>
          <div>
            <h3>Musteri yorumlari</h3>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig({
                reviews: [...form.config.reviews, createDefaultLandingReview()],
              })
            }
            type="button"
          >
            Yorum ekle
          </button>
        </div>

        <div className="variant-list">
          {form.config.reviews.map((item, index) => (
            <div className="admin-panel" key={item.id}>
              <div className="admin-form-grid">
                <label className="admin-label">
                  <span>Ad</span>
                  <input
                    className="admin-input"
                    onChange={(event) => updateReview(index, { name: event.target.value })}
                    value={item.name}
                  />
                </label>
                <label className="admin-label">
                  <span>Inisiyal</span>
                  <input
                    className="admin-input"
                    maxLength={2}
                    onChange={(event) => updateReview(index, { initials: event.target.value })}
                    value={item.initials}
                  />
                </label>
                <label className="admin-label">
                  <span>Puan</span>
                  <input
                    className="admin-input"
                    max="5"
                    min="1"
                    onChange={(event) =>
                      updateReview(index, { rating: Number(event.target.value || 5) })
                    }
                    type="number"
                    value={item.rating}
                  />
                </label>
                <label className="admin-label admin-span-full">
                  <span>Yorum</span>
                  <textarea
                    className="admin-textarea"
                    onChange={(event) => updateReview(index, { comment: event.target.value })}
                    rows={4}
                    value={item.comment}
                  />
                </label>
              </div>
              <div className="admin-form-actions">
                <button
                  className="admin-danger-button"
                  onClick={() =>
                    updateConfig({
                      reviews: form.config.reviews.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  type="button"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>Footer ve linkler</h3>
            <p>Alt bolum baglantilari ve satici etiketi.</p>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              updateConfig({
                footerLinks: [...form.config.footerLinks, createDefaultLandingFooterLink('Yeni link')],
              })
            }
            type="button"
          >
            Link ekle
          </button>
        </div>

        <div className="admin-form-grid">
          <label className="admin-label admin-span-full">
            <span>Satici metni</span>
            <input
              className="admin-input"
              onChange={(event) => updateConfig({ footerSellerText: event.target.value })}
              value={form.config.footerSellerText}
            />
          </label>
        </div>

        <div className="expense-list">
          {form.config.footerLinks.map((item, index) => (
            <div className="expense-row" key={item.id}>
              <input
                className="admin-input"
                onChange={(event) => updateFooterLink(index, { label: event.target.value })}
                placeholder="Link etiketi"
                value={item.label}
              />
              <input
                className="admin-input"
                onChange={(event) => updateFooterLink(index, { href: event.target.value })}
                placeholder="/kvkk veya https://"
                value={item.href}
              />
              <button
                className="admin-danger-button"
                onClick={() =>
                  updateConfig({
                    footerLinks: form.config.footerLinks.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
                type="button"
              >
                Sil
              </button>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
