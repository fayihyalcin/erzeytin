import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type {
  Category,
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
const csv = (value: string) => value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);

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
  const [form, setForm] = useState<ProductFormState>(defaultForm);
  const [imageInput, setImageInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          api.get<Category[]>('/catalog/categories'),
          api.get<Product[]>('/catalog/products'),
        ]);
        if (!mounted) {
          return;
        }
        setCategories(categoryResponse.data);
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

  if (loading) {
    return <section className="panel-card">Urun formu yukleniyor...</section>;
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>{editingId ? 'Urun Duzenle' : 'Urun Ekle'}</h3>
        <button className="tiny secondary" type="button" onClick={() => navigate('/dashboard/products')}>Urun Listesi</button>
      </div>
      <form className="grid-form product-form-grid" onSubmit={handleSubmit}>
        <label>Urun Adi<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>SKU<input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required /></label>
        <label>Kategori<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Kategori Seciniz</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Satis Fiyati<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <label>Maliyet<input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} /></label>
        <label>KDV %<input type="number" min="0" step="0.01" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: event.target.value })} /></label>
        <label>Stok<input type="number" min="0" value={form.hasVariants ? String(variantStock) : form.stock} readOnly={form.hasVariants} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label>
        <label>Min Stok<input type="number" min="0" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} /></label>
        <label>Varyant<select value={form.hasVariants ? '1' : '0'} onChange={(event) => setForm({ ...form, hasVariants: event.target.value === '1', variants: event.target.value === '1' ? form.variants : [] })}><option value="0">Yok</option><option value="1">Var</option></select></label>
        <label>Aktif<select value={form.isActive ? '1' : '0'} onChange={(event) => setForm({ ...form, isActive: event.target.value === '1' })}><option value="1">Aktif</option><option value="0">Pasif</option></select></label>
        <label className="field-span-3">Aciklama<textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="image-upload-box field-span-3">
          <div className="media-title">Urun Gorselleri (bir tanesi vitrin olmali)</div>
          <div className="media-row">
            <input value={imageInput} onChange={(event) => setImageInput(event.target.value)} placeholder="https://..." />
            <button className="tiny" type="button" onClick={() => {
              const value = imageInput.trim();
              if (!value || form.images.includes(value)) {
                setImageInput('');
                return;
              }
              const images = [...form.images, value];
              setForm({ ...form, images, featuredImage: form.featuredImage || value });
              setImageInput('');
            }}>Gorsel Ekle</button>
          </div>
          <div className="image-grid">{form.images.map((image) => <div key={image} className="image-card">{form.featuredImage === image ? <span className="featured-chip">Vitrin</span> : null}<img src={image} alt="urun" /><div className="image-actions"><button className="tiny secondary" type="button" onClick={() => setForm({ ...form, featuredImage: image })}>Vitrin Yap</button><button className="tiny secondary" type="button" onClick={() => {
            const images = form.images.filter((item) => item !== image);
            setForm({ ...form, images, featuredImage: form.featuredImage === image ? images[0] ?? '' : form.featuredImage });
          }}>Sil</button></div></div>)}</div>
        </div>
        <div className="variant-box field-span-3">
          <div className="variant-header">
            <div><div className="media-title">Varyantlar</div><small className="muted">Stok her varyantta tutulur</small></div>
            <button className="tiny" type="button" onClick={() => setForm({ ...form, hasVariants: true, variants: [...form.variants, emptyVariant()] })}>Varyant Ekle</button>
          </div>
          <div className="variant-list">{form.variants.map((variant, index) => <div className="variant-item" key={`${variant.sku}-${index}`}><label>Baslik<input value={variant.title} onChange={(event) => {
            const variants = [...form.variants];
            variants[index] = { ...variant, title: event.target.value };
            setForm({ ...form, variants });
          }} /></label><label>SKU<input value={variant.sku} onChange={(event) => {
            const variants = [...form.variants];
            variants[index] = { ...variant, sku: event.target.value };
            setForm({ ...form, variants });
          }} /></label><label>Fiyat<input type="number" min="0" step="0.01" value={variant.price} onChange={(event) => {
            const variants = [...form.variants];
            variants[index] = { ...variant, price: event.target.value };
            setForm({ ...form, variants });
          }} /></label><label>Stok<input type="number" min="0" value={variant.stock} onChange={(event) => {
            const variants = [...form.variants];
            variants[index] = { ...variant, stock: event.target.value };
            setForm({ ...form, variants });
          }} /></label><label className="variant-default"><input type="checkbox" checked={variant.isDefault} onChange={(event) => {
            const variants = form.variants.map((item, itemIndex) => ({
              ...item,
              isDefault: itemIndex === index ? event.target.checked : false,
            }));
            setForm({ ...form, variants });
          }} />Varsayilan</label><button className="tiny secondary" type="button" onClick={() => {
            const variants = form.variants.filter((_, itemIndex) => itemIndex !== index);
            setForm({ ...form, variants, hasVariants: variants.length > 0 });
          }}>Sil</button></div>)}</div>
        </div>
        <div className="pricing-policy-box field-span-3">
          <div className="panel-title-row pricing-title-row"><h3>Fiyatlandirma</h3><button className="tiny secondary" type="button" onClick={() => setForm({ ...form, price: summary.suggestedSalePrice.toFixed(2), autoPriceFromPolicy: true })}>Onerilen Fiyat</button></div>
          <div className="pricing-grid">
            <label>Hedef Marj %<input type="number" min="0" step="0.01" value={form.pricingPolicy.targetMarginPercent} onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, targetMarginPercent: event.target.value } })} /></label>
            <label>Komisyon %<input type="number" min="0" step="0.01" value={form.pricingPolicy.platformCommissionPercent} onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, platformCommissionPercent: event.target.value } })} /></label>
            <label>Odeme Kesinti %<input type="number" min="0" step="0.01" value={form.pricingPolicy.paymentFeePercent} onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, paymentFeePercent: event.target.value } })} /></label>
            <label>Paketleme<input type="number" min="0" step="0.01" value={form.pricingPolicy.packagingCost} onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, packagingCost: event.target.value } })} /></label>
            <label>Kargo<input type="number" min="0" step="0.01" value={form.pricingPolicy.shippingCost} onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, shippingCost: event.target.value } })} /></label>
            <label>Sabit Gider<input type="number" min="0" step="0.01" value={form.pricingPolicy.fixedCost} onChange={(event) => setForm({ ...form, pricingPolicy: { ...form.pricingPolicy, fixedCost: event.target.value } })} /></label>
          </div>
          <div className="expense-box">
            <div className="panel-title-row pricing-title-row"><h3>Ek Masraf</h3><button className="tiny" type="button" onClick={() => setForm({ ...form, expenseItems: [...form.expenseItems, { name: '', amount: '0' }] })}>Kalem Ekle</button></div>
            <div className="expense-list">{form.expenseItems.map((item, index) => <div key={`${item.name}-${index}`} className="expense-row"><input value={item.name} onChange={(event) => {
              const expenseItems = [...form.expenseItems];
              expenseItems[index] = { ...item, name: event.target.value };
              setForm({ ...form, expenseItems });
            }} placeholder="Masraf" /><input type="number" min="0" step="0.01" value={item.amount} onChange={(event) => {
              const expenseItems = [...form.expenseItems];
              expenseItems[index] = { ...item, amount: event.target.value };
              setForm({ ...form, expenseItems });
            }} placeholder="0" /><button className="tiny secondary" type="button" onClick={() => setForm({ ...form, expenseItems: form.expenseItems.filter((_, itemIndex) => itemIndex !== index) })}>Sil</button></div>)}</div>
          </div>
          <div className="pricing-summary-grid">
            <div className="summary-item"><small>Min Net</small><strong>{summary.minimumNetPrice.toFixed(2)} TL</strong></div>
            <div className="summary-item"><small>Onerilen Satis</small><strong>{summary.suggestedSalePrice.toFixed(2)} TL</strong></div>
            <div className="summary-item"><small>Tahmini Kar</small><strong>{summary.estimatedProfit.toFixed(2)} TL</strong></div>
            <div className="summary-item"><small>Tahmini Marj</small><strong>%{summary.estimatedMarginPercent.toFixed(2)}</strong></div>
          </div>
          <label className="auto-price-toggle"><input type="checkbox" checked={form.autoPriceFromPolicy} onChange={(event) => setForm({ ...form, autoPriceFromPolicy: event.target.checked })} />Kayitta backend onerilen fiyatla hesaplasin.</label>
        </div>
        <label>SEO Baslik<input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} /></label>
        <label className="field-span-2">SEO Aciklama<input value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} /></label>
        <label className="field-span-3">SEO Anahtar Kelime<input value={form.seoKeywordsText} onChange={(event) => setForm({ ...form, seoKeywordsText: event.target.value })} placeholder="zeytinyagi, organik, naturel" /></label>
        <div className="form-actions field-span-3">
          <button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : editingId ? 'Urun Guncelle' : 'Urun Ekle'}</button>
          <button className="tiny secondary" type="button" onClick={() => navigate('/dashboard/products')}>Vazgec</button>
        </div>
      </form>
      {message ? <p className="message">{message}</p> : null}
    </section>
  );
}
