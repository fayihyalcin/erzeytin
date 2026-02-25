import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type { Product, PublicSettingsDto, WebsiteConfig } from '../types/api';
import './StorefrontPage.css';
import './CustomerDashboardPage.css';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1000&q=80';

type DashboardPanel = 'dashboard' | 'orders' | 'wishlist' | 'address' | 'account';
type OrderState = 'NEW' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentState = 'PAID' | 'PENDING';

interface CustomerOrderRow {
  id: string;
  createdAt: string;
  items: number;
  total: number;
  status: OrderState;
  payment: PaymentState;
}

interface CustomerMenuItem {
  key: DashboardPanel;
  label: string;
  icon: 'grid' | 'bag' | 'heart' | 'pin' | 'user';
}

const MENU_ITEMS: CustomerMenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'orders', label: 'Orders', icon: 'bag' },
  { key: 'wishlist', label: 'Wishlist', icon: 'heart' },
  { key: 'address', label: 'My Address', icon: 'pin' },
  { key: 'account', label: 'My Account', icon: 'user' },
];

const SAMPLE_ORDERS: CustomerOrderRow[] = [
  { id: 'ER-10032', createdAt: '18 Feb 2026', items: 3, total: 1480, status: 'DELIVERED', payment: 'PAID' },
  { id: 'ER-10029', createdAt: '15 Feb 2026', items: 2, total: 890, status: 'SHIPPED', payment: 'PAID' },
  { id: 'ER-10018', createdAt: '09 Feb 2026', items: 1, total: 465, status: 'PREPARING', payment: 'PENDING' },
  { id: 'ER-10011', createdAt: '03 Feb 2026', items: 4, total: 2220, status: 'DELIVERED', payment: 'PAID' },
];

function resolveProductImage(product: Product) {
  return product.featuredImage || product.images[0] || FALLBACK_PRODUCT_IMAGE;
}

function parsePrice(value: string) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0;
}

function panelTitle(panel: DashboardPanel) {
  if (panel === 'orders') {
    return 'Order History';
  }
  if (panel === 'wishlist') {
    return 'Wishlist';
  }
  if (panel === 'address') {
    return 'My Address';
  }
  if (panel === 'account') {
    return 'My Account';
  }

  return 'Dashboard';
}

function statusMeta(status: OrderState) {
  if (status === 'DELIVERED') {
    return { label: 'Delivered', className: 'delivered' };
  }
  if (status === 'SHIPPED') {
    return { label: 'Shipped', className: 'shipped' };
  }
  if (status === 'PREPARING') {
    return { label: 'Preparing', className: 'preparing' };
  }
  if (status === 'CANCELLED') {
    return { label: 'Cancelled', className: 'cancelled' };
  }

  return { label: 'New', className: 'new' };
}

function paymentMeta(payment: PaymentState) {
  if (payment === 'PAID') {
    return { label: 'Paid', className: 'paid' };
  }

  return { label: 'Pending', className: 'pending' };
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

function MenuIcon({ icon }: { icon: CustomerMenuItem['icon'] | 'logout' | 'home' }) {
  if (icon === 'grid') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.4" />
        <rect x="14" y="14" width="7" height="7" rx="1.4" />
      </svg>
    );
  }

  if (icon === 'bag') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8h12l-1.2 12a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8Z" />
        <path d="M9 8V6a3 3 0 1 1 6 0v2" />
      </svg>
    );
  }

  if (icon === 'heart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20s-7-4.3-9-8.4C1.7 8.9 3.2 6 6.5 6c2 0 3.2 1 4.1 2.3C11.3 7 12.5 6 14.5 6 17.8 6 19.3 8.9 21 11.6c-2 4.1-9 8.4-9 8.4Z" />
      </svg>
    );
  }

  if (icon === 'pin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.8" />
      </svg>
    );
  }

  if (icon === 'user') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.6-4 5-6 8-6s6.4 2 8 6" />
      </svg>
    );
  }

  if (icon === 'logout') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
        <path d="M14 16l4-4-4-4" />
        <path d="M18 12H10" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M6 10v10h12V10" />
    </svg>
  );
}

export function CustomerDashboardPage() {
  const { addProduct, itemCount: cartCount } = useStoreCart();
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const [activePanel, setActivePanel] = useState<DashboardPanel>('dashboard');
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [profileSaved, setProfileSaved] = useState('');
  const [profileForm, setProfileForm] = useState({
    fullName: 'Fatih Yilmaz',
    email: 'fatih@example.com',
    phone: '+90 555 555 55 55',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    document.body.classList.add('storefront-body');

    return () => {
      document.body.classList.remove('storefront-body');
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get<PublicSettingsDto>('/settings/public'),
      api.get<Product[]>('/catalog/public/products'),
    ])
      .then(([settingsResponse, productsResponse]) => {
        if (!mounted) {
          return;
        }

        setConfig(parseWebsiteConfig(settingsResponse.data.websiteConfig));
        setCurrency((settingsResponse.data.currency || 'TRY').toUpperCase());
        setCatalogProducts(productsResponse.data);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setConfig(defaultConfig);
        setCurrency('TRY');
      });

    return () => {
      mounted = false;
    };
  }, [defaultConfig]);

  useEffect(() => {
    if (!actionMessage && !profileSaved) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActionMessage('');
      setProfileSaved('');
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [actionMessage, profileSaved]);

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

  const wishlistProducts = useMemo(() => catalogProducts.slice(0, 4), [catalogProducts]);
  const completedOrders = useMemo(
    () => SAMPLE_ORDERS.filter((order) => order.status === 'DELIVERED').length,
    [],
  );

  const dashboardCards = [
    { label: 'Total Orders', value: String(SAMPLE_ORDERS.length) },
    { label: 'Completed', value: String(completedOrders) },
    { label: 'Wishlist Items', value: String(wishlistProducts.length) },
    { label: 'Saved Address', value: '2' },
  ];

  const crumbLabel = panelTitle(activePanel);
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
              <span>{cartCount} items</span>
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

      <main className="sf-customer-page">
        <div className="sf-container">
        <nav className="sf-customer-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">
            <span className="icon-wrap">
              <MenuIcon icon="home" />
            </span>
            Home
          </Link>
          <span className="dot" aria-hidden="true">•</span>
          <span>User Dashboard</span>
          <span className="dot" aria-hidden="true">•</span>
          <span>{crumbLabel}</span>
        </nav>

        <div className="sf-customer-layout">
          <aside className="sf-customer-sidebar">
            <div className="sf-customer-menu">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={activePanel === item.key ? 'sf-customer-menu-item active' : 'sf-customer-menu-item'}
                  onClick={() => setActivePanel(item.key)}
                >
                  <span className="menu-icon"><MenuIcon icon={item.icon} /></span>
                  <span>{item.label}</span>
                </button>
              ))}

              <Link to="/" className="sf-customer-menu-item logout">
                <span className="menu-icon"><MenuIcon icon="logout" /></span>
                <span>Log Out</span>
              </Link>
            </div>
          </aside>

          <section className="sf-customer-main">
            <header className="sf-customer-panel-head">
              <h1>{panelTitle(activePanel)}</h1>
              {actionMessage ? <p className="sf-customer-msg">{actionMessage}</p> : null}
              {profileSaved ? <p className="sf-customer-msg success">{profileSaved}</p> : null}
            </header>

            {activePanel === 'dashboard' ? (
              <div className="sf-customer-panel">
                <p className="sf-customer-intro">
                  From your account dashboard, you can easily check and view your{' '}
                  <button type="button" className="sf-customer-inline-link" onClick={() => setActivePanel('orders')}>
                    recent orders
                  </button>
                  , manage your{' '}
                  <button type="button" className="sf-customer-inline-link" onClick={() => setActivePanel('address')}>
                    shipping and billing addresses
                  </button>{' '}
                  and edit your{' '}
                  <button type="button" className="sf-customer-inline-link" onClick={() => setActivePanel('account')}>
                    password and account details
                  </button>
                  .
                </p>

                <div className="sf-customer-stats">
                  {dashboardCards.map((card) => (
                    <article key={card.label}>
                      <small>{card.label}</small>
                      <strong>{card.value}</strong>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {activePanel === 'orders' ? (
              <div className="sf-customer-panel">
                <div className="sf-customer-orders-wrap">
                  <table className="sf-customer-orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_ORDERS.map((order) => {
                        const status = statusMeta(order.status);
                        const payment = paymentMeta(order.payment);
                        return (
                          <tr key={order.id}>
                            <td data-label="Order ID">{order.id}</td>
                            <td data-label="Date">{order.createdAt}</td>
                            <td data-label="Items">{order.items}</td>
                            <td data-label="Total">{formatter.format(order.total)}</td>
                            <td data-label="Status">
                              <span className={`sf-order-badge ${status.className}`}>{status.label}</span>
                            </td>
                            <td data-label="Payment">
                              <span className={`sf-payment-badge ${payment.className}`}>{payment.label}</span>
                            </td>
                            <td data-label="Action">
                              <button type="button">Track</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {activePanel === 'wishlist' ? (
              <div className="sf-customer-panel">
                {wishlistProducts.length > 0 ? (
                  <div className="sf-customer-wishlist-grid">
                    {wishlistProducts.map((product) => (
                      <article key={product.id} className="sf-customer-wishlist-card">
                        <Link to={`/product/${product.id}`} className="media">
                          <img src={resolveProductImage(product)} alt={product.name} />
                        </Link>
                        <h3>
                          <Link to={`/product/${product.id}`}>{product.name}</Link>
                        </h3>
                        <p>{product.category?.name || 'Food & Grocery'}</p>
                        <strong>{formatter.format(parsePrice(product.price))}</strong>
                        <div className="actions">
                          <button
                            type="button"
                            onClick={() => {
                              addProduct(product, 1);
                              setActionMessage('Product added to cart.');
                            }}
                          >
                            Add to cart
                          </button>
                          <Link to={`/product/${product.id}`}>Details</Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="sf-customer-empty">Wishlist products are loading. Please check again.</p>
                )}
              </div>
            ) : null}

            {activePanel === 'address' ? (
              <div className="sf-customer-panel">
                <div className="sf-customer-address-grid">
                  <article>
                    <header>
                      <h3>Shipping Address</h3>
                      <button type="button">Edit</button>
                    </header>
                    <p>Fatih Yilmaz</p>
                    <p>Ayvalik Mah. Zeytin Sok. No:12</p>
                    <p>Balikesir / Turkiye</p>
                    <p>+90 555 555 55 55</p>
                  </article>

                  <article>
                    <header>
                      <h3>Billing Address</h3>
                      <button type="button">Edit</button>
                    </header>
                    <p>Fatih Yilmaz</p>
                    <p>Kurumsal Plaza, Kat:3 No:14</p>
                    <p>Istanbul / Turkiye</p>
                    <p>fatih@example.com</p>
                  </article>
                </div>
              </div>
            ) : null}

            {activePanel === 'account' ? (
              <div className="sf-customer-panel">
                <form
                  className="sf-customer-account-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setProfileSaved('Account details updated.');
                    setProfileForm((current) => ({ ...current, password: '', confirmPassword: '' }));
                  }}
                >
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, fullName: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    E-mail
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, email: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={profileForm.password}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, password: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Confirm Password
                    <input
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                    />
                  </label>
                  <div className="form-actions">
                    <button type="submit">Save Changes</button>
                  </div>
                </form>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      </main>

      <section className="sf-newsletter sf-customer-newsletter">
        <div className="sf-container sf-newsletter-inner">
          <div>
            <h3>Subscribe to our newsletter</h3>
            <p>Get campaign updates and weekly olive oil offers.</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input type="email" placeholder="E-mail address" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}
