import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StorefrontWhatsAppButton } from '../components/StorefrontWhatsAppButton';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type { Order, PublicSettingsDto, WebsiteConfig } from '../types/api';
import './StorefrontPage.css';
import './CustomerDashboardPage.css';

type DashboardTab =
  | 'overview'
  | 'orders'
  | 'tracking'
  | 'receipts'
  | 'payments'
  | 'addresses'
  | 'settings';

const TABS: Array<{ key: DashboardTab; label: string }> = [
  { key: 'overview', label: 'Genel Durum' },
  { key: 'orders', label: 'Siparislerim' },
  { key: 'tracking', label: 'Kargo Takip' },
  { key: 'receipts', label: 'Makbuzlar' },
  { key: 'payments', label: 'Odemeler' },
  { key: 'addresses', label: 'Adreslerim' },
  { key: 'settings', label: 'Ayarlar' },
];

function resolveStorefrontHref(href: string) {
  if (!href) {
    return '/';
  }
  if (href.startsWith('#')) {
    return `/${href}`;
  }
  return href;
}

function parsePrice(value: string | number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function statusMeta(status: Order['status']) {
  if (status === 'DELIVERED') return { label: 'Teslim Edildi', className: 'delivered' };
  if (status === 'SHIPPED') return { label: 'Kargoda', className: 'shipped' };
  if (status === 'PREPARING') return { label: 'Hazirlaniyor', className: 'preparing' };
  if (status === 'CONFIRMED') return { label: 'Onaylandi', className: 'confirmed' };
  if (status === 'CANCELLED' || status === 'REFUNDED') return { label: 'Iptal/Iade', className: 'cancelled' };
  return { label: 'Alindi', className: 'new' };
}

function paymentMeta(status: Order['paymentStatus']) {
  if (status === 'PAID') return { label: 'Odendi', className: 'paid' };
  if (status === 'FAILED') return { label: 'Basarisiz', className: 'failed' };
  if (status === 'REFUNDED') return { label: 'Iade', className: 'refunded' };
  return { label: 'Bekliyor', className: 'pending' };
}

function paymentMethodLabel(method: Order['paymentMethod']) {
  if (method === 'CARD') return 'Kredi Karti';
  if (method === 'CASH_ON_DELIVERY') return 'Kapida Odeme';
  if (method === 'EFT_HAVALE') return 'EFT / Havale';
  if (method === 'BANK_TRANSFER') return 'Banka Havalesi';
  return 'Diger';
}

function downloadReceipt(order: Order) {
  const lines = [
    `Siparis No: ${order.orderNumber}`,
    `Musteri: ${order.customerName}`,
    `Tarih: ${formatDate(order.placedAt)}`,
    `Odeme: ${paymentMethodLabel(order.paymentMethod)} / ${paymentMeta(order.paymentStatus).label}`,
    '',
    ...order.items.map((item) => `${item.productName} x${item.quantity} = ${item.lineTotal.toFixed(2)}`),
    '',
    `Genel Toplam: ${order.grandTotal} ${order.currency}`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `makbuz-${order.orderNumber}.txt`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const { itemCount: cartCount } = useStoreCart();
  const {
    user,
    logout,
    addOrderNumber,
    updateProfile,
    upsertAddress,
    removeAddress,
    upsertPaymentCard,
    removePaymentCard,
    updatePreferences,
  } = useCustomerAuth();

  const [tab, setTab] = useState<DashboardTab>('overview');
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [trackingOrderNo, setTrackingOrderNo] = useState('');
  const [manualOrderNo, setManualOrderNo] = useState('');
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [addressForm, setAddressForm] = useState({
    id: '',
    title: '',
    fullName: '',
    phone: '',
    city: '',
    district: '',
    postalCode: '',
    line1: '',
    line2: '',
  });
  const [cardForm, setCardForm] = useState({
    label: '',
    holderName: '',
    number: '',
    provider: 'VISA',
    expiresAt: '',
    isDefault: false,
  });
  const [preferencesForm, setPreferencesForm] = useState({
    newsletter: true,
    sms: false,
    campaignEmail: true,
  });

  useEffect(() => {
    document.body.classList.add('storefront-body');
    return () => {
      document.body.classList.remove('storefront-body');
    };
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && TABS.some((item) => item.key === requestedTab)) {
      setTab(requestedTab as DashboardTab);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    api
      .get<PublicSettingsDto>('/settings/public')
      .then((response) => {
        if (!mounted) return;
        setConfig(parseWebsiteConfig(response.data.websiteConfig));
        setCurrency((response.data.currency || 'TRY').toUpperCase());
      })
      .catch(() => {
        if (!mounted) return;
        setConfig(defaultConfig);
      });
    return () => {
      mounted = false;
    };
  }, [defaultConfig]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ fullName: user.fullName, phone: user.phone });
    setPreferencesForm({
      newsletter: user.preferences.newsletter,
      sms: user.preferences.sms,
      campaignEmail: user.preferences.campaignEmail,
    });
  }, [user]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 2200);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!user) return;
    if (user.orderNumbers.length === 0) {
      setOrders([]);
      setOrdersError('');
      return;
    }

    let mounted = true;
    setOrdersLoading(true);
    setOrdersError('');

    Promise.all(
      user.orderNumbers.map((orderNo) =>
        api
          .get<Order>(`/shop/orders/${encodeURIComponent(orderNo)}`)
          .then((response) => response.data)
          .catch(() => null),
      ),
    )
      .then((result) => {
        if (!mounted) return;
        const found = result
          .filter((item): item is Order => item !== null)
          .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
        setOrders(found);
        if (!trackingOrderNo && found.length > 0) {
          setTrackingOrderNo(found[0].orderNumber);
        }
        if (found.length === 0) {
          setOrdersError('Siparis bulunamadi. Siparis numarasi ekleyerek tekrar deneyin.');
        }
      })
      .finally(() => {
        if (mounted) setOrdersLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 });
    } catch {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 });
    }
  }, [currency]);

  const navItems = config.navItems.length > 0 ? config.navItems : defaultConfig.navItems;
  const selectedTrackingOrder = orders.find((item) => item.orderNumber === trackingOrderNo) || orders[0] || null;
  const totalSpent = orders.reduce((acc, order) => acc + parsePrice(order.grandTotal), 0);

  if (!user) {
    return null;
  }

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
            <Link to="/satis-sozlesmesi">Satis Sozlesmesi</Link>
            <Link to="/kvkk">KVKK</Link>
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

          <form className="sf-search-form" onSubmit={(event) => event.preventDefault()}>
            <input type="search" placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)} />
            <button type="submit" aria-label="Search products">Ara</button>
          </form>

          <div className="sf-header-actions">
            <Link className="sf-customer-btn" to="/customer/dashboard">Hesabim</Link>
            <Link className="sf-cart-btn" to="/cart">Sepetim<span>{cartCount} ürün</span></Link>
          </div>

          <button className="sf-mobile-toggle" type="button" onClick={() => setMobileMenuOpen((current) => !current)}>MENU</button>
        </div>

        <div className="sf-nav-row">
          <div className="sf-container sf-nav-inner">
            <a className="sf-all-categories" href="/#categories">Explore All Categories</a>
            <nav className={mobileMenuOpen ? 'sf-nav sf-nav-open' : 'sf-nav'}>
              {navItems.map((item) => (
                <a key={`${item.label}-${item.href}`} href={resolveStorefrontHref(item.href)} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="sf-support-right"><span>24/7 Support</span><strong>888-777-999</strong></div>
          </div>
        </div>
      </header>

      <main className="sf-customer-page">
        <div className="sf-container">
          <div className="sf-customer-layout">
            <aside className="sf-customer-sidebar">
              <div className="sf-customer-user-card">
                <strong>{user.fullName}</strong>
                <small>{user.email}</small>
              </div>
              <div className="sf-customer-menu">
                {TABS.map((item) => (
                  <button key={item.key} type="button" className={tab === item.key ? 'sf-customer-menu-item active' : 'sf-customer-menu-item'} onClick={() => setTab(item.key)}>
                    <span>{item.label}</span>
                  </button>
                ))}
                <button type="button" className="sf-customer-menu-item logout" onClick={() => { logout(); navigate('/customer/login'); }}>
                  <span>Cikis Yap</span>
                </button>
              </div>
            </aside>

            <section className="sf-customer-main">
              <header className="sf-customer-panel-head">
                <h1>{TABS.find((item) => item.key === tab)?.label || 'Panel'}</h1>
                {message ? <p className="sf-customer-msg success">{message}</p> : null}
              </header>

              {tab === 'overview' ? <div className="sf-customer-panel sf-simple-grid">
                <article><small>Toplam Siparis</small><strong>{orders.length}</strong></article>
                <article><small>Toplam Harcama</small><strong>{formatter.format(totalSpent)}</strong></article>
                <article><small>Kayitli Adres</small><strong>{user.addresses.length}</strong></article>
                <article><small>Kayitli Kart</small><strong>{user.paymentCards.length}</strong></article>
              </div> : null}

              {tab === 'orders' ? <div className="sf-customer-panel">
                <div className="sf-customer-order-linker">
                  <input value={manualOrderNo} onChange={(event) => setManualOrderNo(event.target.value)} placeholder="Siparis numarasi ekle (ZYT-...)" />
                  <button type="button" onClick={() => {
                    const normalized = manualOrderNo.trim().toUpperCase();
                    if (!normalized) return;
                    addOrderNumber(normalized);
                    setManualOrderNo('');
                    setMessage('Siparis numarasi eklendi.');
                  }}>Ekle</button>
                </div>
                {ordersLoading ? <p className="sf-customer-empty">Siparisler yukleniyor...</p> : null}
                {ordersError ? <p className="sf-customer-empty">{ordersError}</p> : null}
                <div className="sf-customer-orders-wrap">
                  <table className="sf-customer-orders-table">
                    <thead><tr><th>No</th><th>Tarih</th><th>Tutar</th><th>Durum</th><th>Odeme</th><th>Islem</th></tr></thead>
                    <tbody>
                      {orders.map((order) => {
                        const status = statusMeta(order.status);
                        const payment = paymentMeta(order.paymentStatus);
                        return <tr key={order.id}>
                          <td data-label="No">{order.orderNumber}</td>
                          <td data-label="Tarih">{formatDate(order.placedAt)}</td>
                          <td data-label="Tutar">{formatter.format(parsePrice(order.grandTotal))}</td>
                          <td data-label="Durum"><span className={`sf-order-badge ${status.className}`}>{status.label}</span></td>
                          <td data-label="Odeme"><span className={`sf-payment-badge ${payment.className}`}>{payment.label}</span></td>
                          <td data-label="Islem"><div className="sf-customer-order-actions">
                            <button type="button" onClick={() => { setTrackingOrderNo(order.orderNumber); setTab('tracking'); }}>Takip</button>
                            <button type="button" onClick={() => downloadReceipt(order)}>Makbuz</button>
                          </div></td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div> : null}

              {tab === 'tracking' ? <div className="sf-customer-panel">
                {selectedTrackingOrder ? <>
                  <div className="sf-customer-tracking-select">
                    <select value={selectedTrackingOrder.orderNumber} onChange={(event) => setTrackingOrderNo(event.target.value)}>
                      {orders.map((order) => <option key={order.id} value={order.orderNumber}>{order.orderNumber}</option>)}
                    </select>
                    <p>Kargo: {selectedTrackingOrder.shippingCompany || 'Atama bekleniyor'} / Takip No: {selectedTrackingOrder.trackingNumber || 'Yok'}</p>
                  </div>
                  <div className="sf-tracking-stepper">
                    <article className="done"><strong>Siparis alindi</strong><small>{formatDate(selectedTrackingOrder.placedAt)}</small></article>
                    <article className={selectedTrackingOrder.status === 'NEW' ? '' : 'done'}><strong>Onay</strong><small>{formatDate(selectedTrackingOrder.confirmedAt)}</small></article>
                    <article className={selectedTrackingOrder.status === 'SHIPPED' || selectedTrackingOrder.status === 'DELIVERED' ? 'done' : ''}><strong>Kargo</strong><small>{formatDate(selectedTrackingOrder.shippedAt)}</small></article>
                    <article className={selectedTrackingOrder.status === 'DELIVERED' ? 'done' : ''}><strong>Teslimat</strong><small>{formatDate(selectedTrackingOrder.deliveredAt)}</small></article>
                  </div>
                  {selectedTrackingOrder.trackingUrl ? <a className="sf-tracking-link" href={selectedTrackingOrder.trackingUrl} target="_blank" rel="noreferrer">Canli Kargo Takip</a> : null}
                </> : <p className="sf-customer-empty">Takip edilecek siparis yok.</p>}
              </div> : null}

              {tab === 'receipts' ? <div className="sf-customer-panel"><div className="sf-receipt-grid">
                {orders.map((order) => <article key={order.id}><strong>{order.orderNumber}</strong><small>{formatDate(order.placedAt)}</small><p>{formatter.format(parsePrice(order.grandTotal))}</p><button type="button" onClick={() => downloadReceipt(order)}>Makbuz Indir</button></article>)}
              </div></div> : null}

              {tab === 'payments' ? <div className="sf-customer-panel">
                <div className="sf-payment-cards">
                  {user.paymentCards.map((card) => <article key={card.id} className={card.isDefault ? 'default' : ''}><strong>{card.label}</strong><p>{card.maskedNumber}</p><small>{card.provider} / {card.expiresAt}</small><button type="button" onClick={() => { removePaymentCard(card.id); setMessage('Kart silindi.'); }}>Sil</button></article>)}
                </div>
                <form className="sf-payment-card-form" onSubmit={(event) => {
                  event.preventDefault();
                  upsertPaymentCard(cardForm);
                  setCardForm({ label: '', holderName: '', number: '', provider: 'VISA', expiresAt: '', isDefault: false });
                  setMessage('Kart eklendi.');
                }}>
                  <h3>Yeni Kart</h3>
                  <input placeholder="Kart etiketi" value={cardForm.label} onChange={(event) => setCardForm((current) => ({ ...current, label: event.target.value }))} required />
                  <input placeholder="Kart sahibi" value={cardForm.holderName} onChange={(event) => setCardForm((current) => ({ ...current, holderName: event.target.value }))} required />
                  <input placeholder="Kart numarasi" value={cardForm.number} onChange={(event) => setCardForm((current) => ({ ...current, number: event.target.value }))} required />
                  <div className="sf-payment-card-grid">
                    <input placeholder="VISA" value={cardForm.provider} onChange={(event) => setCardForm((current) => ({ ...current, provider: event.target.value }))} required />
                    <input placeholder="12/28" value={cardForm.expiresAt} onChange={(event) => setCardForm((current) => ({ ...current, expiresAt: event.target.value }))} required />
                  </div>
                  <label className="sf-checkbox-row"><input type="checkbox" checked={cardForm.isDefault} onChange={(event) => setCardForm((current) => ({ ...current, isDefault: event.target.checked }))} />Varsayilan kart</label>
                  <button type="submit">Kaydet</button>
                </form>
              </div> : null}

              {tab === 'addresses' ? <div className="sf-customer-panel">
                <div className="sf-customer-address-grid">
                  {user.addresses.map((address) => <article key={address.id}><header><h3>{address.title}</h3><div className="sf-address-actions"><button type="button" onClick={() => setAddressForm(address)}>Duzenle</button><button type="button" onClick={() => { removeAddress(address.id); setMessage('Adres silindi.'); }}>Sil</button></div></header><p>{address.fullName}</p><p>{address.line1}</p><p>{address.district} / {address.city}</p><p>{address.phone}</p></article>)}
                </div>
                <form className="sf-address-form" onSubmit={(event) => {
                  event.preventDefault();
                  upsertAddress(addressForm);
                  setAddressForm({ id: '', title: '', fullName: user.fullName, phone: user.phone, city: '', district: '', postalCode: '', line1: '', line2: '' });
                  setMessage('Adres kaydedildi.');
                }}>
                  <h3>Adres Ekle / Duzenle</h3>
                  <input placeholder="Baslik" value={addressForm.title} onChange={(event) => setAddressForm((current) => ({ ...current, title: event.target.value }))} required />
                  <input placeholder="Ad Soyad" value={addressForm.fullName} onChange={(event) => setAddressForm((current) => ({ ...current, fullName: event.target.value }))} required />
                  <input placeholder="Telefon" value={addressForm.phone} onChange={(event) => setAddressForm((current) => ({ ...current, phone: event.target.value }))} required />
                  <div className="sf-address-grid">
                    <input placeholder="Sehir" value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} required />
                    <input placeholder="Ilce" value={addressForm.district} onChange={(event) => setAddressForm((current) => ({ ...current, district: event.target.value }))} required />
                  </div>
                  <input placeholder="Posta Kodu" value={addressForm.postalCode} onChange={(event) => setAddressForm((current) => ({ ...current, postalCode: event.target.value }))} />
                  <input placeholder="Adres Satiri 1" value={addressForm.line1} onChange={(event) => setAddressForm((current) => ({ ...current, line1: event.target.value }))} required />
                  <input placeholder="Adres Satiri 2" value={addressForm.line2} onChange={(event) => setAddressForm((current) => ({ ...current, line2: event.target.value }))} />
                  <button type="submit">Kaydet</button>
                </form>
              </div> : null}

              {tab === 'settings' ? <div className="sf-customer-panel">
                <form className="sf-customer-account-form" onSubmit={(event) => {
                  event.preventDefault();
                  updateProfile(profileForm);
                  updatePreferences(preferencesForm);
                  setMessage('Ayarlar kaydedildi.');
                }}>
                  <label>Ad Soyad<input value={profileForm.fullName} onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))} required /></label>
                  <label>E-posta<input value={user.email} disabled /></label>
                  <label>Telefon<input value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} required /></label>
                  <label className="sf-checkbox-row"><input type="checkbox" checked={preferencesForm.newsletter} onChange={(event) => setPreferencesForm((current) => ({ ...current, newsletter: event.target.checked }))} />Bulten e-postalari</label>
                  <label className="sf-checkbox-row"><input type="checkbox" checked={preferencesForm.sms} onChange={(event) => setPreferencesForm((current) => ({ ...current, sms: event.target.checked }))} />SMS bildirimleri</label>
                  <label className="sf-checkbox-row"><input type="checkbox" checked={preferencesForm.campaignEmail} onChange={(event) => setPreferencesForm((current) => ({ ...current, campaignEmail: event.target.checked }))} />Kampanya duyurulari</label>
                  <div className="form-actions"><button type="submit">Kaydet</button></div>
                </form>
              </div> : null}
            </section>
          </div>
        </div>
      </main>

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
