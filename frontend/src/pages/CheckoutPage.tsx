import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicBreadcrumbs } from '../components/public/PublicBreadcrumbs';
import { PublicStorefrontLayout } from '../components/public/PublicStorefrontLayout';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStoreCart } from '../context/StoreCartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { formatIban, getActiveBankAccounts, parseBankAccounts } from '../lib/bank-transfer';
import { buildDefaultSeoImageUrl, buildPageTitle, buildKeywordSet, summarizeText, toAbsoluteSiteUrl } from '../lib/public-seo';
import { resolveProductImage as resolveCatalogProductImage } from '../lib/product-images';
import { resolvePublicProductPath } from '../lib/public-site';
import { useSeo } from '../lib/seo';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
  BankAccount,
  Order,
  PaytrCheckoutSession,
  PublicSettingsDto,
  WebsiteConfig,
} from '../types/api';
import './StorefrontPage.css';
import './CartPage.css';

type CheckoutPaymentMethod = 'CARD' | 'CASH_ON_DELIVERY' | 'EFT_HAVALE';

const CHECKOUT_PAYMENT_OPTIONS: Array<{
  value: CheckoutPaymentMethod;
  label: string;
  note: string;
}> = [
  {
    value: 'CARD',
    label: 'Kredi Karti',
    note: 'PAYTR iframe ile hızlı ve güvenli ödeme.',
  },
  {
    value: 'CASH_ON_DELIVERY',
    label: 'Kapıda Ödeme',
    note: 'Teslimat sırasında nakit veya POS ile ödeme.',
  },
  {
    value: 'EFT_HAVALE',
    label: 'EFT / Havale',
    note: 'Sipariş sonrası banka hesabı bilgisiyle tamamlanır.',
  },
];

interface CheckoutFormState {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  district: string;
  postalCode: string;
  line1: string;
  line2: string;
  note: string;
  paymentMethod: CheckoutPaymentMethod;
}

function resolveCartImage(product: {
  id: string;
  name: string;
  categoryName?: string | null;
  featuredImage?: string | null;
  images?: string[];
}) {
  return resolveCatalogProductImage({
    id: product.id,
    name: product.name,
    categoryName: product.categoryName,
    featuredImage: product.featuredImage,
    images: product.images,
  });
}

function parsePrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBooleanSetting(value?: string) {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function paymentMethodLabel(method: CheckoutPaymentMethod) {
  if (method === 'CASH_ON_DELIVERY') {
    return 'Kapıda Ödeme';
  }

  if (method === 'EFT_HAVALE') {
    return 'EFT / Havale';
  }

  return 'Kredi Karti (PAYTR)';
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const { items, subtotal, clearCart } = useStoreCart();
  const {
    user: customerUser,
    isAuthenticated: isCustomerAuthenticated,
    ensureCheckoutAccount,
    linkOrderToEmail,
  } = useCustomerAuth();
  const { showToast } = useToast();

  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [paytrEnabled, setPaytrEnabled] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [eftPaymentInstructions, setEftPaymentInstructions] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [paytrSession, setPaytrSession] = useState<PaytrCheckoutSession | null>(null);
  const bankTransferPanelRef = useRef<HTMLDivElement | null>(null);
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    postalCode: '',
    line1: '',
    line2: '',
    note: '',
    paymentMethod: 'CARD',
  });

  useEffect(() => {
    document.body.classList.add('storefront-body');

    return () => {
      document.body.classList.remove('storefront-body');
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    api
      .get<PublicSettingsDto>('/settings/public')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setConfig(parseWebsiteConfig(response.data.websiteConfig));
        setPaytrEnabled(parseBooleanSetting(response.data.paytrEnabled));
        const parsedBankAccounts = getActiveBankAccounts(
          parseBankAccounts(response.data.bankAccounts),
        );
        setBankAccounts(parsedBankAccounts);
        setEftPaymentInstructions(response.data.eftPaymentInstructions ?? '');
        setSelectedBankAccountId((current) =>
          current || parsedBankAccounts[0]?.id || '',
        );
        if (response.data.currency) {
          setCurrency(response.data.currency.toUpperCase());
        }
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setConfig(defaultConfig);
      });

    return () => {
      mounted = false;
    };
  }, [defaultConfig]);

  useEffect(() => {
    if (!customerUser) {
      return;
    }

    const primaryAddress = customerUser.addresses[0];
    setCheckoutForm((current) => ({
      ...current,
      fullName: current.fullName || customerUser.fullName,
      email: current.email || customerUser.email,
      phone: current.phone || customerUser.phone,
      city: current.city || primaryAddress?.city || '',
      district: current.district || primaryAddress?.district || '',
      postalCode: current.postalCode || primaryAddress?.postalCode || '',
      line1: current.line1 || primaryAddress?.line1 || '',
      line2: current.line2 || primaryAddress?.line2 || '',
    }));
  }, [customerUser]);

  useEffect(() => {
    if (paytrEnabled || checkoutForm.paymentMethod !== 'CARD') {
      return;
    }

    setCheckoutForm((current) => ({
      ...current,
      paymentMethod: 'CASH_ON_DELIVERY',
    }));
  }, [checkoutForm.paymentMethod, paytrEnabled]);

  useEffect(() => {
    if (bankAccounts.length === 0) {
      setSelectedBankAccountId('');
      return;
    }

    if (bankAccounts.some((account) => account.id === selectedBankAccountId)) {
      return;
    }

    setSelectedBankAccountId(bankAccounts[0].id);
  }, [bankAccounts, selectedBankAccountId]);

  useEffect(() => {
    if (checkoutForm.paymentMethod !== 'EFT_HAVALE') {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const panel = bankTransferPanelRef.current;
      if (!panel) {
        return;
      }

      const rect = panel.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const isBelowViewport = rect.bottom > viewportHeight - 24;
      const isAboveViewport = rect.top < 96;

      if (isBelowViewport || isAboveViewport) {
        panel.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [checkoutForm.paymentMethod]);

  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 2,
      });
    }
  }, [currency]);

  const total = subtotal;
  const canCheckout = items.length > 0 && !checkoutLoading;
  const createdBankTransferOrder =
    createdOrder &&
    ['EFT_HAVALE', 'BANK_TRANSFER'].includes(createdOrder.paymentMethod)
      ? createdOrder
      : null;
  const siteName = config.theme.brandName;
  const pageDescription = summarizeText(
    `Teslimat ve ödeme bilgilerinizi tamamlayarak ${siteName} siparişinizi güvenli şekilde oluşturun.`,
    155,
  );

  useSeo({
    title: buildPageTitle('Ödeme ve Teslimat', siteName),
    description: pageDescription,
    canonicalUrl: toAbsoluteSiteUrl(null, '/checkout'),
    keywords: buildKeywordSet(siteName, ['ödeme', 'checkout', 'teslimat bilgileri']),
    robots: 'noindex,follow,max-image-preview:large',
    siteName,
    imageUrl: buildDefaultSeoImageUrl(null),
    imageAlt: `${siteName} ödeme`,
  });

  const checkoutPayload = {
    customerName: checkoutForm.fullName.trim(),
    customerEmail: checkoutForm.email.trim(),
    customerPhone: checkoutForm.phone.trim(),
    shippingAddress: {
      fullName: checkoutForm.fullName.trim(),
      phone: checkoutForm.phone.trim(),
      country: 'Turkiye',
      city: checkoutForm.city.trim(),
      district: checkoutForm.district.trim(),
      postalCode: checkoutForm.postalCode.trim(),
      line1: checkoutForm.line1.trim(),
      line2: checkoutForm.line2.trim(),
    },
    billingAddress: {
      fullName: checkoutForm.fullName.trim(),
      phone: checkoutForm.phone.trim(),
      country: 'Turkiye',
      city: checkoutForm.city.trim(),
      district: checkoutForm.district.trim(),
      postalCode: checkoutForm.postalCode.trim(),
      line1: checkoutForm.line1.trim(),
      line2: checkoutForm.line2.trim(),
    },
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku || item.product.id,
      quantity: item.quantity,
      unitPrice: parsePrice(item.product.price),
      imageUrl: resolveCartImage(item.product) || undefined,
    })),
    shippingFee: 0,
    taxAmount: 0,
    discountAmount: 0,
    currency,
    paymentMethod: checkoutForm.paymentMethod,
    paymentStatus: 'PENDING' as const,
    paymentProvider: checkoutForm.paymentMethod === 'CARD' ? 'PAYTR' : 'MANUAL',
    shippingMethod: 'Standart Kargo',
    bankTransferAccountId:
      checkoutForm.paymentMethod === 'EFT_HAVALE'
        ? selectedBankAccountId || undefined
        : undefined,
    customerNote: checkoutForm.note.trim(),
  };

  const submitOrder = async () => {
    setCheckoutError('');
    setCreatedOrder(null);
    setCreatedOrderNumber('');

    if (!canCheckout) {
      return;
    }

    const requiredFields: Array<keyof CheckoutFormState> = [
      'fullName',
      'email',
      'phone',
      'city',
      'district',
      'line1',
    ];
    const isMissingRequired = requiredFields.some(
      (field) => checkoutForm[field].trim().length === 0,
    );
    if (isMissingRequired || !checkoutForm.email.includes('@')) {
      setCheckoutError('Lütfen zorunlu teslimat ve iletişim alanlarını doldurun.');
      return;
    }

    if (checkoutForm.paymentMethod === 'EFT_HAVALE' && !selectedBankAccountId) {
      setCheckoutError('EFT / Havale icin once bir banka hesabi secin.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const accountResult = await ensureCheckoutAccount({
        fullName: checkoutForm.fullName,
        email: checkoutForm.email,
        phone: checkoutForm.phone,
        city: checkoutForm.city,
        district: checkoutForm.district,
        postalCode: checkoutForm.postalCode,
        line1: checkoutForm.line1,
        line2: checkoutForm.line2,
      });

      if (!isCustomerAuthenticated) {
        showToast(
          accountResult.created
            ? {
                title: 'Hesabınız oluşturuldu',
                description:
                  'Bilgileriniz kaydedildi, oturumunuz açıldı ve ödeme adımına geçildi.',
                tone: 'success',
                durationMs: 3400,
              }
            : {
                title: 'Hesabınız bulundu',
                description:
                  'Kayıtlı hesabınızla oturum açıldı. Ödeme adımına devam edebilirsiniz.',
                tone: 'info',
                durationMs: 3200,
              },
        );
      }

      if (checkoutForm.paymentMethod === 'CARD') {
        if (!paytrEnabled) {
          setCheckoutError('Kredi kartı ödemesi şu anda aktif değil.');
          return;
        }

        const response = await api.post<PaytrCheckoutSession>(
          '/shop/payments/paytr/checkout',
          checkoutPayload,
        );

        linkOrderToEmail(response.data.orderNumber, checkoutForm.email);
        setPaytrSession(response.data);
        showToast({
          title: 'Ödeme ekranı hazır',
          description: 'PAYTR güvenli ödeme oturumu açıldı.',
          tone: 'success',
        });
        return;
      }

      const response = await api.post<Order>('/shop/orders', checkoutPayload);
      const orderNumber = response.data.orderNumber;
      setCreatedOrder(response.data);
      setCreatedOrderNumber(orderNumber);
      setPaytrSession(null);
      clearCart();

      linkOrderToEmail(orderNumber, checkoutForm.email);
      showToast({
        title: 'Siparişiniz alındı',
        description: 'Siparişiniz hesabınıza işlendi. Panelden takip edebilirsiniz.',
        tone: 'success',
      });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setCheckoutError(
        error.response?.data?.message ||
          'Sipariş oluşturulamadı. Lütfen tekrar deneyin.',
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <PublicStorefrontLayout activePath="/checkout" config={config} currency={currency}>
      <div className="sf-checkout-page">
        <div className="sf-container">
          <PublicBreadcrumbs
            items={[
              { label: 'Ana Sayfa', href: '/' },
              { label: 'Sepetim', href: '/cart' },
              { label: 'Ödeme ve Teslimat' },
            ]}
          />

          {createdOrderNumber ? (
            <section className="sf-cart-order-success sf-checkout-success" aria-live="polite">
              <h1>Siparişiniz alındı</h1>
              <p>
                Sipariş numaranız: <strong>{createdOrderNumber}</strong>
              </p>
              <div className="sf-cart-order-success-actions">
                <Link to="/customer/dashboard?tab=tracking">Sipariş Takibine Git</Link>
                <Link to="/customer/dashboard">Müşteri Paneline Git</Link>
                <Link to="/">Alışverişe Dön</Link>
              </div>

              {createdBankTransferOrder?.bankTransferAccount ? (
                <div className="sf-cart-bank-transfer-panel sf-cart-bank-transfer-summary">
                  <div className="sf-cart-bank-transfer-head">
                    <strong>Havale / EFT icin banka bilgileri</strong>
                    <small>
                      Odemenizi tamamladiktan sonra musteri panelindeki Siparis Takip
                      alanindan dekont yukleyebilirsiniz.
                    </small>
                  </div>

                  <div className="sf-cart-bank-transfer-list">
                    <article className="sf-cart-bank-card active">
                      <strong>{createdBankTransferOrder.bankTransferAccount.bankName}</strong>
                      <span>{createdBankTransferOrder.bankTransferAccount.accountHolder}</span>
                      <b>{formatIban(createdBankTransferOrder.bankTransferAccount.iban)}</b>
                      <small>
                        {createdBankTransferOrder.bankTransferAccount.branchName
                          ? `${createdBankTransferOrder.bankTransferAccount.branchName} / `
                          : ''}
                        {createdBankTransferOrder.bankTransferAccount.currency}
                        {createdBankTransferOrder.bankTransferAccount.accountNumber
                          ? ` / Hesap No: ${createdBankTransferOrder.bankTransferAccount.accountNumber}`
                          : ''}
                      </small>
                      {createdBankTransferOrder.bankTransferAccount.note ? (
                        <small>{createdBankTransferOrder.bankTransferAccount.note}</small>
                      ) : null}
                    </article>
                  </div>

                  {eftPaymentInstructions ? (
                    <p className="sf-cart-bank-transfer-instructions">
                      {eftPaymentInstructions}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {!createdOrderNumber && items.length === 0 ? (
            <section className="sf-cart-empty sf-checkout-empty">
              <h1>Ödeme için sepette ürün bulunamadı</h1>
              <p>Sepetinizi doldurduktan sonra ödeme adımına geçebilirsiniz.</p>
              <div className="sf-cart-order-success-actions">
                <Link to="/cart">Sepete Dön</Link>
                <Link to="/">Alışverişe Başla</Link>
              </div>
            </section>
          ) : null}

          {!createdOrderNumber && items.length > 0 ? (
            <section className="sf-cart-checkout-panel sf-checkout-page-panel">
              <header className="sf-cart-checkout-panel-head">
                <div>
                  <h1>Güvenli Ödeme ve Teslimat</h1>
                  <p>
                    {isCustomerAuthenticated
                      ? 'Hesap bilgilerinizle hızlı sipariş oluşturuyorsunuz.'
                      : 'Bilgilerinizi tamamladığınız anda hızlı üyeliğiniz açılır ve ödeme adımına geçilir.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="sf-cart-checkout-close"
                  onClick={() => navigate('/cart')}
                >
                  Sepete Dön
                </button>
              </header>

              <div
                className={
                  paytrSession
                    ? 'sf-cart-checkout-panel-grid paytr'
                    : 'sf-cart-checkout-panel-grid'
                }
              >
                {paytrSession ? (
                  <section className="sf-paytr-frame-shell">
                    <div className="sf-paytr-frame-head">
                      <div>
                        <small>PAYTR Oturumu Hazır</small>
                        <h4>{paytrSession.orderNumber} numaralı sipariş için ödeme ekranı</h4>
                      </div>
                      <a href={paytrSession.iframeUrl} target="_blank" rel="noreferrer">
                        Yeni sekmede aç
                      </a>
                    </div>

                    <iframe
                      className="sf-paytr-iframe"
                      src={paytrSession.iframeUrl}
                      title="PAYTR güvenli ödeme"
                    />

                    <p className="sf-paytr-frame-note">
                      Ödeme tamamlandığında sayfa otomatik olarak sonuç ekranına yönlendirilecektir.
                    </p>
                  </section>
                ) : (
                  <form
                    className="sf-cart-checkout-form sf-cart-checkout-form-wide"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitOrder();
                    }}
                  >
                    <div className="sf-cart-checkout-steps" aria-label="Checkout adimlari">
                      <span className="active">1 İletişim</span>
                      <span className="active">2 Teslimat</span>
                      <span>3 Ödeme</span>
                    </div>

                    {!isCustomerAuthenticated ? (
                      <div className="sf-cart-checkout-preview">
                        <small>Hızlı üyelik</small>
                        <strong>Formu tamamladığınızda hesabınız otomatik oluşturulur.</strong>
                      </div>
                    ) : null}

                    <section className="sf-cart-form-section">
                      <div className="sf-cart-form-section-head">
                        <span>01</span>
                        <div>
                          <strong>İletişim bilgileri</strong>
                          <p>Sipariş ve kargo bildirimleri bu alanlardan gider.</p>
                        </div>
                      </div>

                      <div className="sf-cart-checkout-grid">
                        <label>
                          Ad Soyad
                          <input
                            type="text"
                            value={checkoutForm.fullName}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({
                                ...current,
                                fullName: event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          Telefon
                          <input
                            type="tel"
                            value={checkoutForm.phone}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({
                                ...current,
                                phone: event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                      </div>

                      <label>
                        E-posta
                        <input
                          type="email"
                          value={checkoutForm.email}
                          onChange={(event) =>
                            setCheckoutForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                    </section>

                    <section className="sf-cart-form-section">
                      <div className="sf-cart-form-section-head">
                        <span>02</span>
                        <div>
                          <strong>Teslimat adresi</strong>
                          <p>Kurye yönlendirmesi için açık ve kısa bir teslimat adresi girin.</p>
                        </div>
                      </div>

                      <div className="sf-cart-checkout-grid">
                        <label>
                          Şehir
                          <input
                            type="text"
                            value={checkoutForm.city}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({
                                ...current,
                                city: event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                        <label>
                          İlçe
                          <input
                            type="text"
                            value={checkoutForm.district}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({
                                ...current,
                                district: event.target.value,
                              }))
                            }
                            required
                          />
                        </label>
                      </div>

                      <label>
                        Adres
                        <input
                          type="text"
                          value={checkoutForm.line1}
                          onChange={(event) =>
                            setCheckoutForm((current) => ({
                              ...current,
                              line1: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>

                      <div className="sf-cart-checkout-grid">
                        <label>
                          Adres Satırı 2 (Opsiyonel)
                          <input
                            type="text"
                            value={checkoutForm.line2}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({
                                ...current,
                                line2: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label>
                          Posta Kodu
                          <input
                            type="text"
                            value={checkoutForm.postalCode}
                            onChange={(event) =>
                              setCheckoutForm((current) => ({
                                ...current,
                                postalCode: event.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>
                    </section>

                    <section className="sf-cart-form-section">
                      <div className="sf-cart-form-section-head">
                        <span>03</span>
                        <div>
                          <strong>Ödeme tercihi</strong>
                          <p>Ödeme yöntemlerini kart olarak gösterdik.</p>
                        </div>
                      </div>

                      <div
                        className="sf-cart-payment-options"
                        role="radiogroup"
                        aria-label="Ödeme yöntemi seçimi"
                      >
                        {CHECKOUT_PAYMENT_OPTIONS.map((option) => {
                          const isDisabled = option.value === 'CARD' && !paytrEnabled;
                          const isSelected = checkoutForm.paymentMethod === option.value;

                          return (
                            <label
                              key={option.value}
                              className={
                                isSelected
                                  ? 'sf-cart-payment-card active'
                                  : isDisabled
                                    ? 'sf-cart-payment-card disabled'
                                    : 'sf-cart-payment-card'
                              }
                            >
                              <input
                                checked={isSelected}
                                disabled={isDisabled}
                                name="paymentMethod"
                                type="radio"
                                value={option.value}
                                onChange={(event) =>
                                  setCheckoutForm((current) => ({
                                    ...current,
                                    paymentMethod: event.target.value as CheckoutPaymentMethod,
                                  }))
                                }
                              />
                              <div className="sf-cart-payment-card-head">
                                <span className="sf-cart-payment-card-dot" aria-hidden="true" />
                                <span className="sf-cart-payment-card-badge">
                                  {isSelected
                                    ? 'Secili'
                                    : isDisabled
                                      ? 'Kapali'
                                      : 'Hazir'}
                                </span>
                              </div>
                              <div className="sf-cart-payment-card-copy">
                                <strong>{option.label}</strong>
                                <small>
                                  {option.value === 'CARD' && !paytrEnabled
                                    ? 'PAYTR ayarlardan aktifleştirilmeden kullanılamaz.'
                                    : option.note}
                                </small>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {checkoutForm.paymentMethod === 'EFT_HAVALE' ? (
                        <div
                          ref={bankTransferPanelRef}
                          className="sf-cart-bank-transfer-panel sf-cart-bank-transfer-panel-inline"
                        >
                          <div className="sf-cart-bank-transfer-head">
                            <strong>Banka hesap bilgileri</strong>
                            <small>
                              EFT / Havale seciminizden sonra odemeyi bu hesaplardan birine
                              yapin. Dekontu siparis sonrasinda musteri panelinden
                              yukleyebilirsiniz.
                            </small>
                          </div>

                          {bankAccounts.length > 0 ? (
                            <div className="sf-cart-bank-transfer-list">
                              {bankAccounts.map((account) => {
                                const isSelected = selectedBankAccountId === account.id;

                                return (
                                  <label
                                    key={account.id}
                                    className={
                                      isSelected
                                        ? 'sf-cart-bank-card active'
                                        : 'sf-cart-bank-card'
                                    }
                                  >
                                    <input
                                      checked={isSelected}
                                      name="bankTransferAccount"
                                      onChange={() => setSelectedBankAccountId(account.id)}
                                      type="radio"
                                      value={account.id}
                                    />
                                    <strong>{account.bankName}</strong>
                                    <span>{account.accountHolder}</span>
                                    <b>{formatIban(account.iban)}</b>
                                    <small>
                                      {account.branchName ? `${account.branchName} / ` : ''}
                                      {account.currency}
                                      {account.accountNumber
                                        ? ` / Hesap No: ${account.accountNumber}`
                                        : ''}
                                    </small>
                                    {account.note ? <small>{account.note}</small> : null}
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="sf-cart-bank-transfer-empty">
                              Su anda aktif banka hesabi tanimli degil.
                            </p>
                          )}

                          {eftPaymentInstructions ? (
                            <p className="sf-cart-bank-transfer-instructions">
                              {eftPaymentInstructions}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <label>
                        Sipariş Notu
                        <textarea
                          rows={4}
                          value={checkoutForm.note}
                          onChange={(event) =>
                            setCheckoutForm((current) => ({
                              ...current,
                              note: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </section>

                    <div className="sf-cart-checkout-preview">
                      <small>Seçilen ödeme:</small>
                      <strong>{paymentMethodLabel(checkoutForm.paymentMethod)}</strong>
                    </div>

                    {checkoutError ? (
                      <p className="sf-cart-checkout-error">{checkoutError}</p>
                    ) : null}

                    <div className="sf-cart-checkout-actions">
                      <button type="submit" disabled={checkoutLoading || !canCheckout}>
                        {checkoutLoading
                          ? 'Ödeme Hazırlanıyor...'
                          : checkoutForm.paymentMethod === 'CARD'
                            ? 'PAYTR Ödeme Ekranını Aç'
                            : 'Siparişi Oluştur'}
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => navigate('/cart')}
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                )}

                <aside className="sf-cart-checkout-side">
                  <h4>{paytrSession ? 'Ödeme Oturumu' : 'Ödeme Özeti'}</h4>
                  <div className="sf-cart-checkout-side-row">
                    <span>Ara Toplam</span>
                    <strong>{formatter.format(subtotal)}</strong>
                  </div>
                  <div className="sf-cart-checkout-side-row total">
                    <span>Genel Toplam</span>
                    <strong>{formatter.format(total)}</strong>
                  </div>

                  <div className="sf-checkout-summary-items">
                    {items.map((item) => (
                      <Link
                        key={item.productId}
                        className="sf-checkout-summary-item"
                        to={resolvePublicProductPath({
                          id: item.productId,
                          slug: item.product.slug,
                        })}
                      >
                        <img src={resolveCartImage(item.product)} alt={item.product.name} />
                        <div>
                          <strong>{item.product.name}</strong>
                          <small>
                            {item.quantity} x {formatter.format(parsePrice(item.product.price))}
                          </small>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {paytrSession ? (
                    <div className="sf-cart-checkout-trust">
                      <p>Sipariş Bilgisi</p>
                      <ul>
                        <li>Sipariş No: {paytrSession.orderNumber}</li>
                        <li>Merchant OID: {paytrSession.merchantOid}</li>
                        <li>Callback onayı gelmeden sipariş kesinleşmez</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="sf-cart-checkout-trust">
                      <p>Güvenlik ve Uyumluluk</p>
                      <ul>
                        <li>PAYTR ve 3D Secure destekli ödeme</li>
                        <li>SSL ile şifrelenmiş iletim</li>
                        <li>KVKK ve gizlilik metinleri aktif</li>
                      </ul>
                    </div>
                  )}

                  {paytrSession ? (
                    <button
                      type="button"
                      className="sf-cart-secondary-button"
                      onClick={() => setPaytrSession(null)}
                    >
                      Bilgileri düzenle
                    </button>
                  ) : null}

                  <div className="sf-cart-checkout-legal">
                    <Link to="/kvkk">KVKK</Link>
                    <Link to="/gizlilik">Gizlilik</Link>
                    <Link to="/satis-sozlesmesi">Satış Sözleşmesi</Link>
                  </div>
                </aside>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </PublicStorefrontLayout>
  );
}
