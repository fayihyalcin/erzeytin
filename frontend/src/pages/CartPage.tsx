import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontWhatsAppButton } from '../components/StorefrontWhatsAppButton';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { resolveProductImage as resolveCatalogProductImage } from '../lib/product-images';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type { Order, PublicSettingsDto, WebsiteConfig } from '../types/api';
import './StorefrontPage.css';
import './CartPage.css';

type CheckoutPaymentMethod = 'CARD' | 'CASH_ON_DELIVERY' | 'EFT_HAVALE';

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
}) {
  return resolveCatalogProductImage({
    id: product.id,
    name: product.name,
    categoryName: product.categoryName,
  });
}

function parsePrice(value: string) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0;
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
    return 'Kapida Odeme';
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
    addOrderNumber,
    linkOrderToEmail,
  } = useCustomerAuth();

  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
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
      setCheckoutError('Lutfen zorunlu teslimat ve iletisim alanlarini doldurun.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const payload = {
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
          sku: item.product.id,
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

      const response = await api.post<Order>('/shop/orders', payload);
      const orderNumber = response.data.orderNumber;
      setCreatedOrderNumber(orderNumber);
      setCheckoutOpen(false);
      clearCart();

      linkOrderToEmail(orderNumber, checkoutForm.email);
      if (isCustomerAuthenticated) {
        addOrderNumber(orderNumber);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setCheckoutError(error.response?.data?.message || 'Siparis olusturulamadi. Lutfen tekrar deneyin.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="storefront-page">
      <div className="sf-top-strip">
        <div className="sf-container sf-top-inner">
          <div className="sf-top-left">
            <span>Need Support?</span>
            <strong>Call Us</strong>
            <a href="tel:+902120000000">(+90 212-000-0103)</a>
          </div>

          <div className="sf-top-center">
            <span>English</span>
            <span>{currency}</span>
            <span className="sf-top-badge">%25 OFF</span>
            <span>{config.announcement}</span>
          </div>

          <div className="sf-top-right">
            <Link to="/customer/dashboard">Hesabim</Link>
            <Link to="/satis-sozlesmesi">Satis Sozlesmesi</Link>
            <Link to="/iletisim">Iletisim</Link>
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
              placeholder="Search olive oil, olives, categories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" aria-label="Search products">
              Ara
            </button>
          </form>

          <div className="sf-header-actions">
            <Link
              className="sf-customer-btn"
              to={isCustomerAuthenticated ? '/customer/dashboard' : '/customer/login'}
            >
              {isCustomerAuthenticated ? 'Hesabim' : 'Musteri Giris'}
            </Link>
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
            MENU
          </button>
        </div>

        <div className="sf-nav-row">
          <div className="sf-container sf-nav-inner">
            <a className="sf-all-categories" href="/#categories">
              Explore All Categories
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
              <span>24/7 Support</span>
              <strong>888-777-999</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="sf-cart-page">
        <div className="sf-container">
          <nav className="sf-cart-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <span>Sepetim</span>
          </nav>

          {createdOrderNumber ? (
            <section className="sf-cart-order-success" aria-live="polite">
              <h2>Siparisiniz alindi</h2>
              <p>
                Siparis numaraniz: <strong>{createdOrderNumber}</strong>
              </p>
              <div className="sf-cart-order-success-actions">
                <Link to="/customer/dashboard">Musteri Paneline Git</Link>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(true);
                    setCreatedOrderNumber('');
                  }}
                >
                  Yeni Siparis Olustur
                </button>
              </div>
            </section>
          ) : null}

          {items.length === 0 ? (
            <section className="sf-cart-empty">
              <h1>Sepetiniz Bos</h1>
              <p>Urunleri kesfetmek icin magaza sayfasina donun.</p>
              <Link to="/">Alisverise Basla</Link>
            </section>
          ) : (
            <>
              <section className="sf-cart-hero">
                <div>
                  <h1>Sepetim</h1>
                  <p>Sepetinizde {itemCount} urun bulunuyor.</p>
                </div>
                <div className="sf-cart-head-actions">
                  <Link to="/">Magazaya Don</Link>
                  <button type="button" onClick={clearCart}>
                    Sepeti Temizle
                  </button>
                </div>
              </section>

              <div className="sf-cart-kpis">
                <article>
                  <span>Toplam Urun</span>
                  <strong>{itemCount}</strong>
                </article>
                <article>
                  <span>Ara Toplam</span>
                  <strong>{formatter.format(subtotal)}</strong>
                </article>
                <article>
                  <span>Kargo Durumu</span>
                  <strong>{shipping > 0 ? 'Standart' : 'Ucretsiz'}</strong>
                </article>
              </div>

              <section className="sf-cart-shipping-meter" aria-label="Free shipping progress">
                {remainingForFreeShipping > 0 ? (
                  <p>
                    Ucretsiz kargo icin <strong>{formatter.format(remainingForFreeShipping)}</strong> daha ekleyin.
                  </p>
                ) : (
                  <p>Ucretsiz kargo aktif. Siparisiniz avantajli sekilde hazirlandi.</p>
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
                              Kaldir
                            </button>
                          </div>
                        </div>

                        <div className="sf-cart-item-qty">
                          <button
                            type="button"
                            aria-label="Miktari azalt"
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Miktari arttir"
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>

                        <div className="sf-cart-item-total">
                          <small>Satir Toplami</small>
                          <strong>{formatter.format(lineTotal)}</strong>
                        </div>
                      </article>
                    );
                  })}
                </section>

                <aside className="sf-cart-summary">
                  <h2>Order Summary</h2>

                  <div className="sf-cart-summary-row">
                    <span>Ara Toplam</span>
                    <strong>{formatter.format(subtotal)}</strong>
                  </div>
                  <div className="sf-cart-summary-row">
                    <span>Kargo</span>
                    <strong>{shipping > 0 ? formatter.format(shipping) : 'Ucretsiz'}</strong>
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
                    {checkoutOpen ? 'Odeme Paneli Acik' : 'Guvenli Odemeye Gec'}
                  </button>

                  <Link to="/" className="sf-cart-summary-link">
                    Alisverise Devam Et
                  </Link>
                  <small>{freeShippingThreshold} TL ve uzeri siparislerde kargo ucretsizdir.</small>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

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
                <h3>Guvenli Odeme ve Teslimat</h3>
                <p>
                  {isCustomerAuthenticated
                    ? 'Hesap bilgilerinizle hizli siparis olusturuyorsunuz.'
                    : 'Siparis olusturduktan sonra ayni e-posta ile kayit olursaniz bu siparisi panelinizde gorebilirsiniz.'}
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

            <div className="sf-cart-checkout-panel-grid">
              <form
                className="sf-cart-checkout-form sf-cart-checkout-form-wide"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitOrder();
                }}
              >
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

                <div className="sf-cart-checkout-grid">
                  <label>
                    Sehir
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
                    Ilce
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

                <label>
                  Adres Satir 2 (Opsiyonel)
                  <input
                    type="text"
                    value={checkoutForm.line2}
                    onChange={(event) =>
                      setCheckoutForm((current) => ({ ...current, line2: event.target.value }))
                    }
                  />
                </label>

                <div className="sf-cart-checkout-grid">
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
                  <label>
                    Odeme Yontemi
                    <select
                      value={checkoutForm.paymentMethod}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          paymentMethod: event.target.value as CheckoutPaymentMethod,
                        }))
                      }
                    >
                      <option value="CARD">Kredi Karti (PAYTR)</option>
                      <option value="CASH_ON_DELIVERY">Kapida Odeme</option>
                      <option value="EFT_HAVALE">EFT / Havale</option>
                    </select>
                  </label>
                </div>

                <label>
                  Siparis Notu
                  <textarea
                    rows={4}
                    value={checkoutForm.note}
                    onChange={(event) =>
                      setCheckoutForm((current) => ({ ...current, note: event.target.value }))
                    }
                  />
                </label>

                <div className="sf-cart-checkout-preview">
                  <small>Secilen odeme:</small>
                  <strong>{paymentMethodLabel(checkoutForm.paymentMethod)}</strong>
                </div>

                {checkoutError ? <p className="sf-cart-checkout-error">{checkoutError}</p> : null}

                <div className="sf-cart-checkout-actions">
                  <button type="submit" disabled={checkoutLoading || !canCheckout}>
                    {checkoutLoading ? 'Siparis Olusturuluyor...' : 'Siparisi Olustur'}
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setCheckoutOpen(false);
                    }}
                  >
                    Iptal
                  </button>
                </div>
              </form>

              <aside className="sf-cart-checkout-side">
                <h4>Odeme Ozeti</h4>
                <div className="sf-cart-checkout-side-row">
                  <span>Ara Toplam</span>
                  <strong>{formatter.format(subtotal)}</strong>
                </div>
                <div className="sf-cart-checkout-side-row">
                  <span>Kargo</span>
                  <strong>{shipping > 0 ? formatter.format(shipping) : 'Ucretsiz'}</strong>
                </div>
                <div className="sf-cart-checkout-side-row total">
                  <span>Genel Toplam</span>
                  <strong>{formatter.format(total)}</strong>
                </div>

                <div className="sf-cart-checkout-trust">
                  <p>Guvenlik ve Uyumluluk</p>
                  <ul>
                    <li>PAYTR ve 3D Secure destekli odeme</li>
                    <li>SSL ile sifrelenmis iletim</li>
                    <li>KVKK ve gizlilik metinleri aktif</li>
                  </ul>
                </div>

                <div className="sf-cart-checkout-legal">
                  <Link to="/kvkk">KVKK</Link>
                  <Link to="/gizlilik">Gizlilik</Link>
                  <Link to="/satis-sozlesmesi">Satis Sozlesmesi</Link>
                </div>
              </aside>
            </div>
          </section>
        </div>
      ) : null}

      <footer className="sf-footer">
        <div className="sf-container sf-footer-legal-links">
          <Link to="/satis-sozlesmesi">Satis Sozlesmesi</Link>
          <Link to="/kvkk">KVKK</Link>
          <Link to="/gizlilik">Gizlilik</Link>
        </div>

        <div className="sf-container sf-footer-bottom">
          <span>
            {config.theme.brandName} (c) {new Date().getFullYear()} - Tum haklari saklidir.
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Yukari Don
          </button>
        </div>
      </footer>

      <StorefrontWhatsAppButton />
    </div>
  );
}
