import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStoreCart } from '../context/StoreCartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { resolveProductImage as resolveCatalogProductImage } from '../lib/product-images';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
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
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0;
}

function parseBooleanSetting(value?: string) {
  if (!value) {
    return false;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function resolveStorefrontHref(href: string) {
  if (!href) {
    return '/';
  }

  if (href.startsWith('#')) {
    return `/${href}`;
  }

  return href;
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

export function CartPage() {
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const { items, itemCount, subtotal, setQuantity, removeProduct, clearCart } = useStoreCart();
  const {
    user: customerUser,
    isAuthenticated: isCustomerAuthenticated,
    ensureCheckoutAccount,
    logout,
    linkOrderToEmail,
  } = useCustomerAuth();
  const { showToast } = useToast();

  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [paytrEnabled, setPaytrEnabled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [paytrSession, setPaytrSession] = useState<PaytrCheckoutSession | null>(null);
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
    if (!checkoutOpen) {
      document.body.classList.remove('sf-modal-open');
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCheckoutOpen(false);
      }
    };

    document.body.classList.add('sf-modal-open');
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('sf-modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [checkoutOpen]);

  useEffect(() => {
    if (paytrEnabled || checkoutForm.paymentMethod !== 'CARD') {
      return;
    }

    setCheckoutForm((current) => ({
      ...current,
      paymentMethod: 'CASH_ON_DELIVERY',
    }));
  }, [checkoutForm.paymentMethod, paytrEnabled]);

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

  const freeShippingThreshold = 1000;
  const shipping = itemCount > 0 && subtotal < freeShippingThreshold ? 79.9 : 0;
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);
  const freeShippingProgress =
    freeShippingThreshold > 0 ? Math.min((subtotal / freeShippingThreshold) * 100, 100) : 100;
  const navItems = config.navItems.length > 0 ? config.navItems : defaultConfig.navItems;

  const canCheckout = items.length > 0 && !checkoutLoading;
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
    shippingFee: Number(shipping.toFixed(2)),
    taxAmount: 0,
    discountAmount: 0,
    currency,
    paymentMethod: checkoutForm.paymentMethod,
    paymentStatus: 'PENDING' as const,
    paymentProvider: checkoutForm.paymentMethod === 'CARD' ? 'PAYTR' : 'MANUAL',
    shippingMethod: 'Standart Kargo',
    customerNote: checkoutForm.note.trim(),
  };

  const submitOrder = async () => {
    setCheckoutError('');
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
    const isMissingRequired = requiredFields.some((field) => checkoutForm[field].trim().length === 0);
    if (isMissingRequired || !checkoutForm.email.includes('@')) {
      setCheckoutError('Lütfen zorunlu teslimat ve iletişim alanlarını doldurun.');
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
      setCreatedOrderNumber(orderNumber);
      setCheckoutOpen(false);
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
    <div className="storefront-page">
      <div className="sf-top-strip">
        <div className="sf-container sf-top-inner">
          <div className="sf-top-left">
            <span>Desteğe mi ihtiyacınız var?</span>
            <strong>Bizi Arayın</strong>
            <a href="tel:+905305165498">0530 516 54 98</a>
          </div>

          <div className="sf-top-center">
            <span>Türkçe</span>
            <span>{currency}</span>
            <span className="sf-top-badge">%25 İndirim</span>
            <span>{config.announcement}</span>
          </div>

          <div className="sf-top-right">
            <Link to={isCustomerAuthenticated ? '/customer/dashboard' : '/customer/login'}>
              {isCustomerAuthenticated ? 'Hesab\u0131m' : 'M\u00fc\u015fteri Giri\u015fi'}
            </Link>
            <Link to="/satis-sozlesmesi">Satış Sözleşmesi</Link>
            <Link to="/iletisim">İletişim</Link>
          </div>
        </div>
      </div>

      <header className="sf-main-header">
        <div className="sf-container sf-brand-row">
          <Link className="sf-logo" to="/">
            <span className="sf-logo-mark">Z</span>
            <span className="sf-logo-text">
              <strong>{config.theme.brandName}</strong>
              <small>{config.theme.tagline}</small>
            </span>
          </Link>

          <form
            className="sf-search-form"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              type="search"
              placeholder="Zeytinyağı, zeytin, kategoriler ara"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" aria-label="Ürün ara">
              Ara
            </button>
          </form>

          <div className="sf-header-actions">
            <Link
              className="sf-customer-btn"
              to={isCustomerAuthenticated ? '/customer/dashboard' : '/customer/login'}
            >
              {isCustomerAuthenticated ? 'Hesab\u0131m' : 'M\u00fc\u015fteri Giri\u015fi'}
            </Link>
            {isCustomerAuthenticated ? (
              <button
                className="sf-account-btn"
                type="button"
                onClick={() => {
                  logout();
                  setCheckoutOpen(false);
                  setPaytrSession(null);
                  showToast({
                    title: 'Oturum kapat\u0131ld\u0131',
                    description: 'M\u00fc\u015fteri hesab\u0131n\u0131zdan g\u00fcvenli \u00e7\u0131k\u0131\u015f yap\u0131ld\u0131.',
                    tone: 'info',
                  });
                }}
              >
                \u00c7\u0131k\u0131\u015f
              </button>
            ) : null}
            <Link className="sf-cart-btn" to="/cart">
              Sepetim
              <span>{itemCount} ürün</span>
            </Link>
          </div>

          <button
            className="sf-mobile-toggle"
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            MENÜ
          </button>
        </div>

        <div className="sf-nav-row">
          <div className="sf-container sf-nav-inner">
            <a className="sf-all-categories" href="/#categories">
              Tüm Kategorileri Keşfet
            </a>

            <nav className={mobileMenuOpen ? 'sf-nav sf-nav-open' : 'sf-nav'}>
              {navItems.map((item) => (
                <a
                  key={`${item.label}-${item.href}`}
                  href={resolveStorefrontHref(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="sf-support-right">
              <span>7/24 Destek</span>
              <strong>0530 516 54 98</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="sf-cart-page">
        <div className="sf-container">
          <nav className="sf-cart-breadcrumb" aria-label="Sayfa yolu">
            <Link to="/">Ana Sayfa</Link>
            <span>/</span>
            <span>Sepetim</span>
          </nav>

          {createdOrderNumber ? (
            <section className="sf-cart-order-success" aria-live="polite">
              <h2>Siparişiniz alındı</h2>
              <p>
                Sipariş numaranız: <strong>{createdOrderNumber}</strong>
              </p>
              <div className="sf-cart-order-success-actions">
                <Link to="/customer/dashboard">Müşteri Paneline Git</Link>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(true);
                    setCreatedOrderNumber('');
                  }}
                >
                  Yeni Sipariş Oluştur
                </button>
              </div>
            </section>
          ) : null}

          {items.length === 0 ? (
            <section className="sf-cart-empty">
              <h1>Sepetiniz Boş</h1>
              <p>Ürünleri keşfetmek için mağaza sayfasına dönün.</p>
              <Link to="/">Alışverişe Başla</Link>
            </section>
          ) : (
            <>
              <section className="sf-cart-hero">
                <div>
                  <h1>Sepetim</h1>
                  <p>Sepetinizde {itemCount} ürün bulunuyor.</p>
                </div>
                <div className="sf-cart-head-actions">
                  <Link to="/">Mağazaya Dön</Link>
                  <button type="button" onClick={clearCart}>
                    Sepeti Temizle
                  </button>
                </div>
              </section>

              <div className="sf-cart-kpis">
                <article>
                  <span>Toplam Ürün</span>
                  <strong>{itemCount}</strong>
                </article>
                <article>
                  <span>Ara Toplam</span>
                  <strong>{formatter.format(subtotal)}</strong>
                </article>
                <article>
                  <span>Kargo Durumu</span>
                  <strong>{shipping > 0 ? 'Standart' : 'Ücretsiz'}</strong>
                </article>
              </div>

              <section className="sf-cart-shipping-meter" aria-label="Ücretsiz kargo ilerleme durumu">
                {remainingForFreeShipping > 0 ? (
                  <p>
                    Ücretsiz kargo için <strong>{formatter.format(remainingForFreeShipping)}</strong> daha ekleyin.
                  </p>
                ) : (
                  <p>Ücretsiz kargo aktif. Siparişiniz avantajlı şekilde hazırlandı.</p>
                )}
                <div className="sf-cart-shipping-track">
                  <span style={{ width: `${freeShippingProgress}%` }} />
                </div>
              </section>

              <div className="sf-cart-layout">
                <section className="sf-cart-items">
                  {items.map((item) => {
                    const unitPrice = parsePrice(item.product.price);
                    const lineTotal = unitPrice * item.quantity;

                    return (
                      <article key={item.productId} className="sf-cart-item">
                        <Link to={`/product/${item.productId}`} className="sf-cart-item-media">
                          <img
                            src={resolveCartImage(item.product)}
                            alt={item.product.name}
                          />
                        </Link>

                        <div className="sf-cart-item-info">
                          <p className="sf-cart-item-category">{item.product.categoryName || 'Zeytin ve Zeytinyagi'}</p>
                          <Link to={`/product/${item.productId}`} className="sf-cart-item-title">
                            {item.product.name}
                          </Link>
                          <div className="sf-cart-item-price">
                            <strong>{formatter.format(unitPrice)}</strong>
                            <span>Birim fiyat</span>
                          </div>
                          <div className="sf-cart-item-actions">
                            <Link to={`/product/${item.productId}`}>Detay</Link>
                            <button type="button" onClick={() => removeProduct(item.productId)}>
                              Kaldır
                            </button>
                          </div>
                        </div>

                        <div className="sf-cart-item-qty">
                          <button
                            type="button"
                            aria-label="Miktarı azalt"
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Miktarı artır"
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>

                        <div className="sf-cart-item-total">
                          <small>Satır Toplamı</small>
                          <strong>{formatter.format(lineTotal)}</strong>
                        </div>
                      </article>
                    );
                  })}
                </section>

                <aside className="sf-cart-summary">
                  <h2>Sipariş Özeti</h2>

                  <div className="sf-cart-summary-row">
                    <span>Ara Toplam</span>
                    <strong>{formatter.format(subtotal)}</strong>
                  </div>
                  <div className="sf-cart-summary-row">
                    <span>Kargo</span>
                    <strong>{shipping > 0 ? formatter.format(shipping) : 'Ücretsiz'}</strong>
                  </div>
                  <div className="sf-cart-summary-row total">
                    <span>Genel Toplam</span>
                    <strong>{formatter.format(total)}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutOpen(true);
                      setCheckoutError('');
                    }}
                  >
                    {paytrSession
                      ? 'Bekleyen PAYTR Ödemesine Dön'
                      : checkoutOpen
                        ? 'Ödeme Paneli Açık'
                        : 'Güvenli Ödemeye Geç'}
                  </button>

                  <Link to="/" className="sf-cart-summary-link">
                    Alışverişe Devam Et
                  </Link>
                  <small>{freeShippingThreshold} TL ve üzeri siparişlerde kargo ücretsizdir.</small>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

      {items.length > 0 ? (
        <div className="sf-cart-mobile-dock">
          <div className="sf-cart-mobile-dock-meta">
            <span>{itemCount} ürün</span>
            <strong>{formatter.format(total)}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              setCheckoutOpen(true);
              setCheckoutError('');
            }}
          >
            Ödemeye Geç
          </button>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div
          className="sf-cart-checkout-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setCheckoutOpen(false);
          }}
        >
          <section
            className="sf-cart-checkout-panel"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <header className="sf-cart-checkout-panel-head">
              <div>
                <h3>Güvenli Ödeme ve Teslimat</h3>
                <p>
                  {isCustomerAuthenticated
                    ? 'Hesap bilgilerinizle hızlı sipariş oluşturuyorsunuz.'
                    : 'Bilgilerinizi tamamladığınız anda hızlı üyeliğiniz açılır ve ödeme adımına geçilir.'}
                </p>
              </div>
              <button
                type="button"
                className="sf-cart-checkout-close"
                onClick={() => {
                  setCheckoutOpen(false);
                }}
              >
                Kapat
              </button>
            </header>

            <div className={paytrSession ? 'sf-cart-checkout-panel-grid paytr' : 'sf-cart-checkout-panel-grid'}>
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
                    <span className={paytrSession ? 'active' : ''}>3 Ödeme</span>
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
                            setCheckoutForm((current) => ({ ...current, fullName: event.target.value }))
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
                            setCheckoutForm((current) => ({ ...current, phone: event.target.value }))
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
                          setCheckoutForm((current) => ({ ...current, email: event.target.value }))
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
                            setCheckoutForm((current) => ({ ...current, city: event.target.value }))
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
                            setCheckoutForm((current) => ({ ...current, district: event.target.value }))
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
                          setCheckoutForm((current) => ({ ...current, line1: event.target.value }))
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
                            setCheckoutForm((current) => ({ ...current, line2: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Posta Kodu
                        <input
                          type="text"
                          value={checkoutForm.postalCode}
                          onChange={(event) =>
                            setCheckoutForm((current) => ({ ...current, postalCode: event.target.value }))
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
                        <p>Mobilde daha hızlı seçim için ödeme yöntemlerini kart olarak gösterdik.</p>
                      </div>
                    </div>

                    <div className="sf-cart-payment-options" role="radiogroup" aria-label="Ödeme yöntemi seçimi">
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
                            <div>
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

                    <label>
                      Sipariş Notu
                      <textarea
                        rows={4}
                        value={checkoutForm.note}
                        onChange={(event) =>
                          setCheckoutForm((current) => ({ ...current, note: event.target.value }))
                        }
                      />
                    </label>
                  </section>

                  <div className="sf-cart-checkout-preview">
                    <small>Seçilen ödeme:</small>
                    <strong>{paymentMethodLabel(checkoutForm.paymentMethod)}</strong>
                  </div>

                  {checkoutError ? <p className="sf-cart-checkout-error">{checkoutError}</p> : null}

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
                      onClick={() => {
                        setCheckoutOpen(false);
                      }}
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
                <div className="sf-cart-checkout-side-row">
                  <span>Kargo</span>
                  <strong>{shipping > 0 ? formatter.format(shipping) : 'Ücretsiz'}</strong>
                </div>
                <div className="sf-cart-checkout-side-row total">
                  <span>Genel Toplam</span>
                  <strong>{formatter.format(total)}</strong>
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
        </div>
      ) : null}

      <footer className="sf-footer">
        <div className="sf-container sf-footer-legal-links">
          <Link to="/satis-sozlesmesi">Satış Sözleşmesi</Link>
          <Link to="/kvkk">KVKK</Link>
          <Link to="/gizlilik">Gizlilik</Link>
        </div>

        <div className="sf-container sf-footer-bottom">
          <span>
            {config.theme.brandName} (c) {new Date().getFullYear()} - Tüm hakları saklıdır.
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Yukarı Dön
          </button>
        </div>
      </footer>

    </div>
  );
}



