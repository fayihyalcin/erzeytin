import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AdminFormWizard, type AdminWizardStep } from '../components/admin/AdminFormWizard';
import { useNavigate, useParams } from 'react-router-dom';
import { MediaBrowser } from '../components/admin/MediaBrowser';
import { parseMediaLibrary } from '../lib/admin-content';
import { fetchSettingsRecord, updateMediaLibrary } from '../lib/admin-settings';
import { api, extractApiError } from '../lib/api';
import {
  createMediaItemFromUpload,
  mergeMediaItems,
  uploadMediaFiles,
} from '../lib/media-library';
import type {
  Category,
  MediaItem,
  Product,
  ProductExpenseItem,
  ProductPricingPolicy,
  ProductPricingSummary,
} from '../types/api';

type VariantForm = {
  title: string;
  sku: string;
  price: string;
  stock: string;
  isDefault: boolean;
};

type ExpenseForm = {
  name: string;
  amount: string;
};

type PolicyForm = {
  targetMarginPercent: string;
  platformCommissionPercent: string;
  paymentFeePercent: string;
  marketingPercent: string;
  operationalPercent: string;
  discountBufferPercent: string;
  packagingCost: string;
  shippingCost: string;
  fixedCost: string;
};

type ProductFormState = {
  name: string;
  sku: string;
  categoryId: string;
  barcode: string;
  brand: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  taxRate: string;
  vatIncluded: boolean;
  stock: string;
  minStock: string;
  weight: string;
  width: string;
  height: string;
  length: string;
  shortDescription: string;
  description: string;
  tagsText: string;
  images: string[];
  featuredImage: string;
  hasVariants: boolean;
  variants: VariantForm[];
  pricingPolicy: PolicyForm;
  expenseItems: ExpenseForm[];
  autoPriceFromPolicy: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywordsText: string;
  isActive: boolean;
};

const defaultForm: ProductFormState = {
  name: '',
  sku: '',
  categoryId: '',
  barcode: '',
  brand: '',
  price: '0',
  compareAtPrice: '',
  costPrice: '0',
  taxRate: '20',
  vatIncluded: true,
  stock: '0',
  minStock: '0',
  weight: '',
  width: '',
  height: '',
  length: '',
  shortDescription: '',
  description: '',
  tagsText: '',
  images: [],
  featuredImage: '',
  hasVariants: false,
  variants: [],
  pricingPolicy: {
    targetMarginPercent: '30',
    platformCommissionPercent: '0',
    paymentFeePercent: '0',
    marketingPercent: '0',
    operationalPercent: '0',
    discountBufferPercent: '0',
    packagingCost: '0',
    shippingCost: '0',
    fixedCost: '0',
  },
  expenseItems: [],
  autoPriceFromPolicy: false,
  seoTitle: '',
  seoDescription: '',
  seoKeywordsText: '',
  isActive: true,
};

const productSteps = [
  {
    id: 'identity',
    title: 'Urun Kimligi',
    description: 'Temel katalog alanlari ve aciklamalar.',
  },
  {
    id: 'media',
    title: 'Medya ve Vitrin',
    description: 'Galeri, featured image ve URL akisi.',
  },
  {
    id: 'commerce',
    title: 'Ticari Alanlar',
    description: 'Fiyat, stok, olculer ve varyantlar.',
  },
  {
    id: 'pricing',
    title: 'Karlilik Modeli',
    description: 'Komisyon, masraf ve fiyat politikasi.',
  },
  {
    id: 'seo',
    title: 'SEO ve Yayin',
    description: 'Meta alanlari ve son yayin kontrolleri.',
  },
] satisfies AdminWizardStep[];

type ProductStepId = (typeof productSteps)[number]['id'];

const emptyVariant = (): VariantForm => ({
  title: '',
  sku: '',
  price: '0',
  stock: '0',
  isDefault: false,
});

const round2 = (value: number) => Number(value.toFixed(2));
const asNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const asPositive = (value: string, fallback = 0) => Math.max(0, asNumber(value, fallback));
const asPercent = (value: string, fallback = 0) => Math.max(0, Math.min(95, asNumber(value, fallback)));
const asInt = (value: string, fallback = 0) => Math.max(0, Math.trunc(asNumber(value, fallback)));
const toOptional = (value: string) => (value.trim() ? asNumber(value) : undefined);
const csv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const PRODUCT_IMAGE_ACCEPT = 'image/*';

const policyFromForm = (policy: PolicyForm): ProductPricingPolicy => ({
  targetMarginPercent: round2(asPercent(policy.targetMarginPercent, 30)),
  platformCommissionPercent: round2(asPercent(policy.platformCommissionPercent)),
  paymentFeePercent: round2(asPercent(policy.paymentFeePercent)),
  marketingPercent: round2(asPercent(policy.marketingPercent)),
  operationalPercent: round2(asPercent(policy.operationalPercent)),
  discountBufferPercent: round2(asPercent(policy.discountBufferPercent)),
  packagingCost: round2(asPositive(policy.packagingCost)),
  shippingCost: round2(asPositive(policy.shippingCost)),
  fixedCost: round2(asPositive(policy.fixedCost)),
});

const expenseFromForm = (list: ExpenseForm[]): ProductExpenseItem[] =>
  list
    .map((item) => ({ name: item.name.trim(), amount: round2(asPositive(item.amount)) }))
    .filter((item) => item.name.length > 0);

const calculateSummary = (input: {
  costPrice: number;
  taxRate: number;
  vatIncluded: boolean;
  policy: ProductPricingPolicy;
  expenses: ProductExpenseItem[];
  salePrice: number;
}): ProductPricingSummary => {
  const fixedExpenseTotal = round2(
    input.policy.packagingCost +
      input.policy.shippingCost +
      input.policy.fixedCost +
      input.expenses.reduce((sum, item) => sum + item.amount, 0),
  );
  const variableExpensePercent = round2(
    input.policy.platformCommissionPercent +
      input.policy.paymentFeePercent +
      input.policy.marketingPercent +
      input.policy.operationalPercent +
      input.policy.discountBufferPercent,
  );
  const baseCost = input.costPrice + fixedExpenseTotal;
  const minimumNetPrice = round2(baseCost / Math.max(0.01, 1 - variableExpensePercent / 100));
  const suggestedNetPrice = round2(
    minimumNetPrice / Math.max(0.01, 1 - input.policy.targetMarginPercent / 100),
  );
  const suggestedSalePrice = round2(
    input.vatIncluded ? suggestedNetPrice * (1 + input.taxRate / 100) : suggestedNetPrice,
  );
  const netSalePrice = input.vatIncluded ? input.salePrice / (1 + input.taxRate / 100) : input.salePrice;
  const variableAtSale = netSalePrice * (variableExpensePercent / 100);
  const estimatedProfit = round2(netSalePrice - (baseCost + variableAtSale));
  const estimatedMarginPercent = round2(netSalePrice > 0 ? (estimatedProfit / netSalePrice) * 100 : 0);
  return {
    unitCost: round2(input.costPrice),
    fixedExpenseTotal,
    variableExpensePercent,
    minimumNetPrice,
    suggestedNetPrice,
    suggestedSalePrice,
    estimatedProfit,
    estimatedMarginPercent,
  };
};

const toForm = (product: Product): ProductFormState => ({
  ...defaultForm,
  name: product.name,
  sku: product.sku,
  categoryId: product.category?.id ?? '',
  barcode: product.barcode ?? '',
  brand: product.brand ?? '',
  price: product.price,
  compareAtPrice: product.compareAtPrice ?? '',
  costPrice: product.costPrice ?? '0',
  taxRate: product.taxRate,
  vatIncluded: product.vatIncluded,
  stock: String(product.stock),
  minStock: String(product.minStock),
  weight: product.weight ?? '',
  width: product.width ?? '',
  height: product.height ?? '',
  length: product.length ?? '',
  shortDescription: product.shortDescription ?? '',
  description: product.description ?? '',
  tagsText: product.tags.join(', '),
  images: product.images,
  featuredImage: product.featuredImage ?? '',
  hasVariants: product.hasVariants,
  variants: product.variants.map((variant) => ({
    title: variant.title,
    sku: variant.sku,
    price: String(variant.price),
    stock: String(variant.stock),
    isDefault: Boolean(variant.isDefault),
  })),
  pricingPolicy: {
    targetMarginPercent: String(product.pricingPolicy?.targetMarginPercent ?? 30),
    platformCommissionPercent: String(product.pricingPolicy?.platformCommissionPercent ?? 0),
    paymentFeePercent: String(product.pricingPolicy?.paymentFeePercent ?? 0),
    marketingPercent: String(product.pricingPolicy?.marketingPercent ?? 0),
    operationalPercent: String(product.pricingPolicy?.operationalPercent ?? 0),
    discountBufferPercent: String(product.pricingPolicy?.discountBufferPercent ?? 0),
    packagingCost: String(product.pricingPolicy?.packagingCost ?? 0),
    shippingCost: String(product.pricingPolicy?.shippingCost ?? 0),
    fixedCost: String(product.pricingPolicy?.fixedCost ?? 0),
  },
  expenseItems: (product.expenseItems ?? []).map((item) => ({ name: item.name, amount: String(item.amount) })),
  seoTitle: product.seoTitle ?? '',
  seoDescription: product.seoDescription ?? '',
  seoKeywordsText: product.seoKeywords.join(', '),
  isActive: product.isActive,
});

export function ProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<ProductFormState>(defaultForm);
  const [galleryUrl, setGalleryUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [galleryBrowserOpen, setGalleryBrowserOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProductStepId>('identity');

  const policy = useMemo(() => policyFromForm(form.pricingPolicy), [form.pricingPolicy]);
  const expenses = useMemo(() => expenseFromForm(form.expenseItems), [form.expenseItems]);
  const summary = useMemo(
    () =>
      calculateSummary({
        costPrice: asPositive(form.costPrice),
        taxRate: asPercent(form.taxRate, 20),
        vatIncluded: form.vatIncluded,
        policy,
        expenses,
        salePrice: asPositive(form.price),
      }),
    [expenses, form.costPrice, form.price, form.taxRate, form.vatIncluded, policy],
  );
  const variantStock = useMemo(
    () => form.variants.reduce((total, item) => total + asInt(item.stock), 0),
    [form.variants],
  );
  const currentStepIndex = productSteps.findIndex((step) => step.id === currentStep);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const [settings, categoryResponse, productResponse] = await Promise.all([
          fetchSettingsRecord(),
          api.get<Category[]>('/catalog/categories'),
          api.get<Product[]>('/catalog/products'),
        ]);
        if (!mounted) {
          return;
        }
        setCategories(categoryResponse.data);
        setMediaItems(parseMediaLibrary(settings.mediaLibrary));
        if (productId) {
          const found = productResponse.data.find((item) => item.id === productId);
          if (!found) {
            setMessage('Urun bulunamadi.');
            setEditingId(null);
            setForm(defaultForm);
          } else {
            setEditingId(found.id);
            setForm(toForm(found));
          }
        } else {
          setEditingId(null);
          setForm(defaultForm);
        }
      } catch {
        if (mounted) {
          setMessage('Urun formu yuklenemedi.');
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
  }, [productId]);

  const addImagesToGallery = (imageUrls: string[]) => {
    const normalized = imageUrls
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (normalized.length === 0) {
      return;
    }

    setForm((current) => {
      const nextImages = [...current.images];
      for (const imageUrl of normalized) {
        if (!nextImages.includes(imageUrl)) {
          nextImages.push(imageUrl);
        }
      }

      return {
        ...current,
        featuredImage: current.featuredImage || nextImages[0] || '',
        images: nextImages,
      };
    });
  };

  const addImageToGallery = (imageUrl: string) => {
    addImagesToGallery([imageUrl]);
  };

  const setFeaturedImage = (imageUrl: string) => {
    setForm((current) => {
      const images = current.images.includes(imageUrl)
        ? current.images
        : [imageUrl, ...current.images];

      return {
        ...current,
        featuredImage: imageUrl,
        images,
      };
    });
  };

  const removeImageFromGallery = (imageUrl: string) => {
    setForm((current) => {
      const images = current.images.filter((item) => item !== imageUrl);
      return {
        ...current,
        featuredImage:
          current.featuredImage === imageUrl ? images[0] ?? '' : current.featuredImage,
        images,
      };
    });
  };

  const handleGalleryUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    setUploadingGallery(true);
    setMessage(null);

    try {
      const uploadedAssets = await uploadMediaFiles(fileList, {
        folder: 'Urunler',
      });
      const uploadedItems = uploadedAssets.map(createMediaItemFromUpload);
      const uploadedUrls = uploadedItems.map((item) => item.url);

      addImagesToGallery(uploadedUrls);

      const nextLibrary = mergeMediaItems(mediaItems, uploadedItems);
      setMediaItems(nextLibrary);

      try {
        await updateMediaLibrary(nextLibrary);
        setMessage(`${uploadedItems.length} gorsel yuklendi ve galeriye eklendi.`);
      } catch (libraryError) {
        setMessage(
          extractApiError(
            libraryError,
            `${uploadedItems.length} gorsel yuklendi, fakat medya kutuphanesi guncellenemedi.`,
          ),
        );
      }
    } catch (error) {
      setMessage(extractApiError(error, 'Gorseller yuklenemedi.'));
    } finally {
      setUploadingGallery(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex <= 0) {
      return;
    }

    setCurrentStep(productSteps[currentStepIndex - 1].id);
  };

  const goToNextStep = () => {
    if (currentStepIndex >= productSteps.length - 1) {
      return;
    }

    setCurrentStep(productSteps[currentStepIndex + 1].id);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const variants = form.hasVariants
      ? form.variants
          .map((item) => ({
            title: item.title.trim(),
            sku: item.sku.trim(),
            price: round2(asPositive(item.price)),
            stock: asInt(item.stock),
            isDefault: item.isDefault,
          }))
          .filter((item) => item.title.length > 0 && item.sku.length > 0)
      : [];

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      categoryId: form.categoryId || '',
      barcode: form.barcode,
      brand: form.brand,
      price: round2(asPositive(form.price)),
      compareAtPrice: toOptional(form.compareAtPrice),
      costPrice: round2(asPositive(form.costPrice)),
      taxRate: round2(asPercent(form.taxRate, 20)),
      vatIncluded: form.vatIncluded,
      stock: form.hasVariants ? variants.reduce((sum, item) => sum + item.stock, 0) : asInt(form.stock),
      minStock: asInt(form.minStock),
      weight: toOptional(form.weight),
      width: toOptional(form.width),
      height: toOptional(form.height),
      length: toOptional(form.length),
      shortDescription: form.shortDescription,
      description: form.description,
      tags: csv(form.tagsText),
      images: form.images,
      featuredImage: form.featuredImage,
      hasVariants: form.hasVariants,
      variants,
      pricingPolicy: policy,
      expenseItems: expenses,
      autoPriceFromPolicy: form.autoPriceFromPolicy,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      seoKeywords: csv(form.seoKeywordsText),
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await api.patch(`/catalog/products/${editingId}`, payload);
      } else {
        await api.post('/catalog/products', payload);
      }
      navigate('/dashboard/products');
    } catch {
      setMessage('Urun kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryName =
    categories.find((item) => item.id === form.categoryId)?.name ?? 'Kategori secilmedi';

  if (loading) {
    return <section className="admin-panel">Urun formu yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">Katalog / Urun formu</span>
          <h2>{editingId ? 'Urun duzenle' : 'Yeni urun ekle'}</h2>
          <p>
            Urun karti, medya, karlilik modeli ve SEO alanlarini daha kompakt bir wizard
            akisinda yonetin.
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-secondary-button" onClick={() => navigate('/dashboard/products')} type="button">
            Listeye don
          </button>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <form className="admin-page-stack" onSubmit={handleSubmit}>
        <AdminFormWizard
          currentStep={currentStep}
          description="Operasyon ekipleri uzun tek sayfa yerine asamali bir kurgu ile daha hizli veri girebilir."
          onStepChange={(stepId) => setCurrentStep(stepId as ProductStepId)}
          steps={productSteps}
          summary={
            <>
              <div className="admin-preview-grid">
                <div className="admin-metric-tile">
                  <span>Galeri</span>
                  <strong>{form.images.length}</strong>
                </div>
                <div className="admin-metric-tile">
                  <span>Stok</span>
                  <strong>{form.hasVariants ? variantStock : asInt(form.stock)}</strong>
                </div>
              </div>

              <ul className="admin-preview-list">
                <li>
                  <strong>Durum</strong>
                  <small>{form.isActive ? 'Aktif urun' : 'Taslak / pasif'}</small>
                </li>
                <li>
                  <strong>Kategori</strong>
                  <small>{selectedCategoryName}</small>
                </li>
                <li>
                  <strong>Onerilen satis</strong>
                  <small>{summary.suggestedSalePrice.toFixed(2)} TL</small>
                </li>
              </ul>
            </>
          }
          title="Urun yayin sihirbazi"
        >
        {currentStep === 'identity' ? (
          <>
            <section className="admin-stage-intro">
              <span className="admin-eyebrow">Adim 1</span>
              <h3>Urun kimligini tanimlayin</h3>
              <p>
                Katalog kartinin temel verileri, aciklamalari ve etiketlerini burada
                olusturun.
              </p>
            </section>

            <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Temel bilgiler</h3>
              <p>Magaza kartinda ve sipariste gorunecek temel urun verileri.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="admin-label">
              <span>Urun adi</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
            </label>
            <label className="admin-label">
              <span>SKU</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, sku: event.target.value })} required value={form.sku} />
            </label>
            <label className="admin-label">
              <span>Kategori</span>
              <select className="admin-select" onChange={(event) => setForm({ ...form, categoryId: event.target.value })} value={form.categoryId}>
                <option value="">Kategori secin</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-label">
              <span>Durum</span>
              <select className="admin-select" onChange={(event) => setForm({ ...form, isActive: event.target.value === '1' })} value={form.isActive ? '1' : '0'}>
                <option value="1">Aktif</option>
                <option value="0">Pasif</option>
              </select>
            </label>
            <label className="admin-label">
              <span>Marka</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, brand: event.target.value })} value={form.brand} />
            </label>
            <label className="admin-label">
              <span>Barkod</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, barcode: event.target.value })} value={form.barcode} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Kisa aciklama</span>
              <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} rows={3} value={form.shortDescription} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Detayli aciklama</span>
              <textarea className="admin-textarea" onChange={(event) => setForm({ ...form, description: event.target.value })} rows={8} value={form.description} />
            </label>
            <label className="admin-label admin-span-full">
              <span>Etiketler</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, tagsText: event.target.value })}
                placeholder="organik, naturel, premium"
                value={form.tagsText}
              />
            </label>
          </div>
        </section>
          </>
        ) : null}

        {currentStep === 'media' ? (
          <>
            <section className="admin-stage-intro">
              <span className="admin-eyebrow">Adim 2</span>
              <h3>Vitrin medyasini kurun</h3>
              <p>
                Medya kutuphanesi ve harici URL akisini birlikte kullanarak daha esnek bir
                galeri olusturun.
              </p>
            </section>

            <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Gorseller ve medya</h3>
              <p>Urun gorsellerini kutuphaneden secin veya dogrudan URL ile ekleyin. Gorsel bos kalirsa sitede placeholder gosterilir.</p>
            </div>
          </div>

            <div className="image-upload-box">
            <div className="variant-header">
              <div>
                <div className="media-title">Galeri</div>
                <small className="muted">Ilk gorsel veya secilen vitrin gorseli urun kartinda kullanilir.</small>
              </div>
              <div className="admin-header-actions">
                <button className="admin-secondary-button" onClick={() => setGalleryBrowserOpen(true)} type="button">
                  Kutuphaneden ekle
                </button>
              </div>
            </div>

            <div className="admin-upload-box" style={{ marginTop: 12 }}>
              <div>
                <strong>Hizli coklu yukleme</strong>
                <p>Birden fazla urun gorseli secin; yukleme biter bitmez galeriye otomatik eklenir.</p>
              </div>
              <label className="admin-upload-trigger">
                <input
                  accept={PRODUCT_IMAGE_ACCEPT}
                  hidden
                  multiple
                  onChange={(event) => {
                    void handleGalleryUpload(event.target.files);
                    event.target.value = '';
                  }}
                  type="file"
                />
                {uploadingGallery ? 'Yukleniyor...' : 'Resim sec'}
              </label>
            </div>

            <div className="media-row" style={{ marginTop: 12 }}>
              <input
                className="admin-input"
                onChange={(event) => setGalleryUrl(event.target.value)}
                placeholder="https://..."
                value={galleryUrl}
              />
              <button
                className="admin-primary-button"
                onClick={() => {
                  addImageToGallery(galleryUrl);
                  setGalleryUrl('');
                }}
                type="button"
              >
                URL ekle
              </button>
            </div>

            {form.images.length === 0 ? (
              <div className="admin-empty-state compact" style={{ marginTop: 14 }}>
                <strong>Henuz gorsel yok</strong>
                <p>Medya kutuphanesinden secin veya harici URL ekleyin. Bos birakirsaniz storefront placeholder gorseli kullanir.</p>
              </div>
            ) : (
              <div className="image-grid" style={{ marginTop: 14 }}>
                {form.images.map((image) => (
                  <div key={image} className="image-card">
                    {form.featuredImage === image ? <span className="featured-chip">Vitrin</span> : null}
                    <img alt={form.name || 'Urun gorseli'} src={image} />
                    <div className="image-actions">
                      <button className="tiny secondary" onClick={() => setFeaturedImage(image)} type="button">
                        Vitrin yap
                      </button>
                      <button
                        className="tiny secondary"
                        onClick={() => removeImageFromGallery(image)}
                        type="button"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
          </>
        ) : null}

        {currentStep === 'commerce' ? (
          <>
            <section className="admin-stage-intro">
              <span className="admin-eyebrow">Adim 3</span>
              <h3>Ticari ve lojistik alanlar</h3>
              <p>Fiyat, stok, olcu ve varyant kurgusunu operasyon ekibine uygun bicimde ayarlayin.</p>
            </section>

            <section className="admin-overview-grid">
          <article className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Fiyat, stok ve lojistik</h3>
                <p>Temel satis verileri, KDV ve olculer.</p>
              </div>
            </div>

            <div className="admin-form-grid">
              <label className="admin-label">
                <span>Satis fiyati</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, price: event.target.value })} step="0.01" type="number" value={form.price} />
              </label>
              <label className="admin-label">
                <span>Liste fiyati</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, compareAtPrice: event.target.value })} step="0.01" type="number" value={form.compareAtPrice} />
              </label>
              <label className="admin-label">
                <span>Maliyet</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, costPrice: event.target.value })} step="0.01" type="number" value={form.costPrice} />
              </label>
              <label className="admin-label">
                <span>KDV %</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, taxRate: event.target.value })} step="0.01" type="number" value={form.taxRate} />
              </label>
              <label className="admin-label">
                <span>Stok</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, stock: event.target.value })} readOnly={form.hasVariants} type="number" value={form.hasVariants ? String(variantStock) : form.stock} />
              </label>
              <label className="admin-label">
                <span>Min stok</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, minStock: event.target.value })} type="number" value={form.minStock} />
              </label>
              <label className="admin-label">
                <span>KDV dahildir</span>
                <select className="admin-select" onChange={(event) => setForm({ ...form, vatIncluded: event.target.value === '1' })} value={form.vatIncluded ? '1' : '0'}>
                  <option value="1">Evet</option>
                  <option value="0">Hayir</option>
                </select>
              </label>
              <label className="admin-label">
                <span>Varyantli urun</span>
                <select className="admin-select" onChange={(event) => setForm({ ...form, hasVariants: event.target.value === '1', variants: event.target.value === '1' ? form.variants : [] })} value={form.hasVariants ? '1' : '0'}>
                  <option value="0">Hayir</option>
                  <option value="1">Evet</option>
                </select>
              </label>
              <label className="admin-label">
                <span>Agirlik (kg)</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, weight: event.target.value })} step="0.001" type="number" value={form.weight} />
              </label>
              <label className="admin-label">
                <span>Genislik (cm)</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, width: event.target.value })} step="0.01" type="number" value={form.width} />
              </label>
              <label className="admin-label">
                <span>Yukseklik (cm)</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, height: event.target.value })} step="0.01" type="number" value={form.height} />
              </label>
              <label className="admin-label">
                <span>Uzunluk (cm)</span>
                <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, length: event.target.value })} step="0.01" type="number" value={form.length} />
              </label>
            </div>
          </article>

          <article className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h3>Canli ozet</h3>
                <p>Fiyatlandirma politikasina gore otomatik hesaplanan ozet.</p>
              </div>
            </div>

            <div className="pricing-summary-grid">
              <div className="summary-item">
                <small>Min net</small>
                <strong>{summary.minimumNetPrice.toFixed(2)} TL</strong>
              </div>
              <div className="summary-item">
                <small>Onerilen satis</small>
                <strong>{summary.suggestedSalePrice.toFixed(2)} TL</strong>
              </div>
              <div className="summary-item">
                <small>Tahmini kar</small>
                <strong>{summary.estimatedProfit.toFixed(2)} TL</strong>
              </div>
              <div className="summary-item">
                <small>Tahmini marj</small>
                <strong>%{summary.estimatedMarginPercent.toFixed(2)}</strong>
              </div>
            </div>

            <label className="auto-price-toggle" style={{ marginTop: 14 }}>
              <input checked={form.autoPriceFromPolicy} onChange={(event) => setForm({ ...form, autoPriceFromPolicy: event.target.checked })} type="checkbox" />
              Kayit sirasinda backend onerilen satis fiyatini kullansin.
            </label>
          </article>
        </section>
            <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Varyantlar</h3>
              <p>Boyut, paket veya litre bazli stok yonetimi icin varyant ekleyin.</p>
            </div>
            <button className="admin-secondary-button" onClick={() => setForm({ ...form, hasVariants: true, variants: [...form.variants, emptyVariant()] })} type="button">
              Varyant ekle
            </button>
          </div>

          {form.variants.length === 0 ? (
            <div className="admin-empty-state compact">
              <strong>Varyant yok</strong>
              <p>Bu urun tek fiyatliysa varyant olusturmaniz gerekmez.</p>
            </div>
          ) : (
            <div className="variant-list">
              {form.variants.map((variant, index) => (
                <div className="variant-item" key={`${variant.sku}-${index}`}>
                  <label className="admin-label">
                    <span>Baslik</span>
                    <input className="admin-input" onChange={(event) => {
                      const variants = [...form.variants];
                      variants[index] = { ...variant, title: event.target.value };
                      setForm({ ...form, variants });
                    }} value={variant.title} />
                  </label>
                  <label className="admin-label">
                    <span>SKU</span>
                    <input className="admin-input" onChange={(event) => {
                      const variants = [...form.variants];
                      variants[index] = { ...variant, sku: event.target.value };
                      setForm({ ...form, variants });
                    }} value={variant.sku} />
                  </label>
                  <label className="admin-label">
                    <span>Fiyat</span>
                    <input className="admin-input" min="0" onChange={(event) => {
                      const variants = [...form.variants];
                      variants[index] = { ...variant, price: event.target.value };
                      setForm({ ...form, variants });
                    }} step="0.01" type="number" value={variant.price} />
                  </label>
                  <label className="admin-label">
                    <span>Stok</span>
                    <input className="admin-input" min="0" onChange={(event) => {
                      const variants = [...form.variants];
                      variants[index] = { ...variant, stock: event.target.value };
                      setForm({ ...form, variants });
                    }} type="number" value={variant.stock} />
                  </label>
                  <label className="variant-default">
                    <input checked={variant.isDefault} onChange={(event) => {
                      const variants = form.variants.map((item, itemIndex) => ({
                        ...item,
                        isDefault: itemIndex === index ? event.target.checked : false,
                      }));
                      setForm({ ...form, variants });
                    }} type="checkbox" />
                    Varsayilan
                  </label>
                  <button className="admin-danger-button" onClick={() => {
                    const variants = form.variants.filter((_, itemIndex) => itemIndex !== index);
                    setForm({ ...form, variants, hasVariants: variants.length > 0 });
                  }} type="button">
                    Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
          </>
        ) : null}

        {currentStep === 'pricing' ? (
          <>
            <section className="admin-stage-intro">
              <span className="admin-eyebrow">Adim 4</span>
              <h3>Karlilik modelini olusturun</h3>
              <p>Komisyon, odeme kesintisi ve operasyon kalemlerini fiyat modeline baglayin.</p>
            </section>

            <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Fiyat politikasi</h3>
              <p>Komisyon, odeme, operasyon ve ek masraflari tanimlayin.</p>
            </div>
            <button
              className="admin-secondary-button"
              onClick={() => setForm({ ...form, price: summary.suggestedSalePrice.toFixed(2), autoPriceFromPolicy: true })}
              type="button"
            >
              Onerilen fiyati uygula
            </button>
          </div>

          <div className="pricing-grid">
            <label className="admin-label">
              <span>Hedef marj %</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, targetMarginPercent: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.targetMarginPercent} />
            </label>
            <label className="admin-label">
              <span>Komisyon %</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, platformCommissionPercent: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.platformCommissionPercent} />
            </label>
            <label className="admin-label">
              <span>Odeme kesintisi %</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, paymentFeePercent: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.paymentFeePercent} />
            </label>
            <label className="admin-label">
              <span>Pazarlama %</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, marketingPercent: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.marketingPercent} />
            </label>
            <label className="admin-label">
              <span>Operasyon %</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, operationalPercent: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.operationalPercent} />
            </label>
            <label className="admin-label">
              <span>Indirim buffer %</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, discountBufferPercent: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.discountBufferPercent} />
            </label>
            <label className="admin-label">
              <span>Paketleme</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, packagingCost: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.packagingCost} />
            </label>
            <label className="admin-label">
              <span>Kargo</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, shippingCost: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.shippingCost} />
            </label>
            <label className="admin-label">
              <span>Sabit gider</span>
              <input className="admin-input" min="0" onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, fixedCost: event.target.value } })} step="0.01" type="number" value={form.pricingPolicy.fixedCost} />
            </label>
          </div>

          <div className="expense-box" style={{ marginTop: 14 }}>
            <div className="variant-header">
              <div>
                <div className="media-title">Ek masraf kalemleri</div>
                <small className="muted">Kutulu paket, etiket veya kampanya masrafi gibi kalemler ekleyin.</small>
              </div>
              <button className="admin-secondary-button" onClick={() => setForm({ ...form, expenseItems: [...form.expenseItems, { name: '', amount: '0' }] })} type="button">
                Kalem ekle
              </button>
            </div>
            <div className="expense-list">
              {form.expenseItems.map((item, index) => (
                <div className="expense-row" key={`${item.name}-${index}`}>
                  <input className="admin-input" onChange={(event) => {
                    const expenseItems = [...form.expenseItems];
                    expenseItems[index] = { ...item, name: event.target.value };
                    setForm({ ...form, expenseItems });
                  }} placeholder="Masraf kalemi" value={item.name} />
                  <input className="admin-input" min="0" onChange={(event) => {
                    const expenseItems = [...form.expenseItems];
                    expenseItems[index] = { ...item, amount: event.target.value };
                    setForm({ ...form, expenseItems });
                  }} placeholder="0" step="0.01" type="number" value={item.amount} />
                  <button className="admin-danger-button" onClick={() => setForm({ ...form, expenseItems: form.expenseItems.filter((_, itemIndex) => itemIndex !== index) })} type="button">
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
          </>
        ) : null}

        {currentStep === 'seo' ? (
          <>
            <section className="admin-stage-intro">
              <span className="admin-eyebrow">Adim 5</span>
              <h3>SEO ve yayin kontrolleri</h3>
              <p>Arama motoru alanlari ve yayin oncesi kontrol noktalarini son kez gozden gecirin.</p>
            </section>

            <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>SEO ve yayin ayarlari</h3>
              <p>Arama motoru ve paylasim alanlarinda kullanilacak metinleri girin.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="admin-label">
              <span>SEO baslik</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} value={form.seoTitle} />
            </label>
            <label className="admin-label">
              <span>SEO aciklama</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} value={form.seoDescription} />
            </label>
            <label className="admin-label admin-span-full">
              <span>SEO anahtar kelimeler</span>
              <input className="admin-input" onChange={(event) => setForm({ ...form, seoKeywordsText: event.target.value })} placeholder="zeytinyagi, organik, premium" value={form.seoKeywordsText} />
            </label>
          </div>
        </section>
          </>
        ) : null}

        <div className="admin-stage-actions">
          <div className="admin-stage-actions-group">
            {currentStepIndex > 0 ? (
              <button className="admin-ghost-button" onClick={goToPreviousStep} type="button">
                Onceki adim
              </button>
            ) : null}
          </div>

          <div className="admin-stage-actions-group">
            <button className="admin-secondary-button" disabled={saving} type="submit">
              {saving ? 'Kaydediliyor...' : 'Ara kaydet'}
            </button>
            {currentStepIndex < productSteps.length - 1 ? (
              <button className="admin-primary-button" onClick={goToNextStep} type="button">
                Devam et
              </button>
            ) : (
              <button className="admin-primary-button" disabled={saving} type="submit">
                {saving ? 'Kaydediliyor...' : editingId ? 'Urunu guncelle' : 'Urunu kaydet'}
              </button>
            )}
            <button className="admin-ghost-button" onClick={() => navigate('/dashboard/products')} type="button">
              Vazgec
            </button>
          </div>
        </div>
        </AdminFormWizard>
      </form>

      <MediaBrowser
        allowedTypes={['image']}
        items={mediaItems}
        onClose={() => setGalleryBrowserOpen(false)}
        onSelect={(item) => addImageToGallery(item.url)}
        open={galleryBrowserOpen}
        title="Urun galerisi icin medya sec"
      />
    </div>
  );
}
