import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type { PublicSettingsDto, WebsiteConfig } from '../types/api';
import './StorefrontPage.css';
import './CartPage.css';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1000&q=80';

function resolveCartImage(images: string[], featuredImage: string | null) {
  return featuredImage || images[0] || FALLBACK_PRODUCT_IMAGE;
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

export function CartPage() {
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const { items, itemCount, subtotal, setQuantity, removeProduct, clearCart } = useStoreCart();
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

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
            <a href="/#footer">About us</a>
            <a href="/#footer">My Account</a>
            <a href="/#footer">Order Tracking</a>
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
            <Link className="sf-customer-btn" to="/customer/dashboard">
              Musteri Giris
            </Link>
            <Link className="sf-account-btn" to="/admin">
              {config.theme.adminButtonLabel}
            </Link>
            <Link className="sf-cart-btn" to="/cart">
              Cart
              <span>{itemCount} items</span>
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
            <span>Cart</span>
          </nav>

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
                  <h1>Shopping Cart</h1>
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
                            src={resolveCartImage(item.product.images, item.product.featuredImage)}
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

                  <button type="button">Guvenli Odemeye Gec</button>
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
    </div>
  );
}
