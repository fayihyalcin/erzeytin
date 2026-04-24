import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { PublicStorefrontLayout } from '../components/public/PublicStorefrontLayout';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { buildDefaultSeoImageUrl, buildPageTitle, buildKeywordSet, summarizeText, toAbsoluteSiteUrl } from '../lib/public-seo';
import { useSeo } from '../lib/seo';
import { firePurchaseTrackingScripts } from '../lib/tracking';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type { Order, PublicSettingsDto, WebsiteConfig } from '../types/api';
import './StorefrontPage.css';
import './CartPage.css';

function parsePrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PaytrReturnPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { clearCart } = useStoreCart();
  const { isAuthenticated, addOrderNumber, linkOrderToEmail } = useCustomerAuth();
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [currency, setCurrency] = useState('TRY');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [trackingScripts, setTrackingScripts] = useState({
    metaPixelPurchaseScript: '',
    tiktokPixelPurchaseScript: '',
  });

  const orderNumber = searchParams.get('order')?.trim() ?? '';
  const resultHint = searchParams.get('result')?.trim() ?? '';
  const isEmbedded = typeof window !== 'undefined' ? window.top !== window.self : false;

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
        setTrackingScripts({
          metaPixelPurchaseScript: response.data.metaPixelPurchaseScript ?? '',
          tiktokPixelPurchaseScript: response.data.tiktokPixelPurchaseScript ?? '',
        });
      })
      .catch(() => {
        if (mounted) {
          setConfig(defaultConfig);
        }
      });

    return () => {
      mounted = false;
    };
  }, [defaultConfig]);

  useEffect(() => {
    if (!isEmbedded) {
      return;
    }

    window.top?.location.replace(window.location.href);
  }, [isEmbedded]);

  useEffect(() => {
    if (!orderNumber || isEmbedded) {
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;
    let currentAttempt = 0;

    const loadOrder = async () => {
      currentAttempt += 1;
      setAttemptCount(currentAttempt);

      try {
        const response = await api.get<Order>(`/shop/orders/${encodeURIComponent(orderNumber)}`);
        if (cancelled) {
          return;
        }

        const nextOrder = response.data;
        setOrder(nextOrder);
        setError('');

        if (nextOrder.paymentStatus === 'PAID') {
          clearCart();
        }

        linkOrderToEmail(nextOrder.orderNumber, nextOrder.customerEmail);
        if (isAuthenticated) {
          addOrderNumber(nextOrder.orderNumber);
        }

        if (
          nextOrder.paymentStatus === 'PAID' ||
          nextOrder.paymentStatus === 'FAILED' ||
          nextOrder.paymentStatus === 'REFUNDED'
        ) {
          setLoading(false);
          return;
        }

        if (currentAttempt < 20) {
          timeoutId = window.setTimeout(() => {
            void loadOrder();
          }, 1500);
          return;
        }

        setLoading(false);
      } catch {
        if (cancelled) {
          return;
        }

        setError('Siparis sonucu su anda okunamiyor. Lutfen biraz sonra tekrar deneyin.');
        setLoading(false);
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [addOrderNumber, clearCart, isAuthenticated, isEmbedded, linkOrderToEmail, orderNumber]);

  useEffect(() => {
    if (order?.paymentStatus !== 'PAID') {
      return;
    }

    firePurchaseTrackingScripts(
      trackingScripts,
      order,
      `checkout-paytr:${order.orderNumber}`,
    );
  }, [order, trackingScripts]);

  const orderCurrency = order?.currency || currency;
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: orderCurrency,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 2,
      });
    }
  }, [orderCurrency]);
  const siteName = config.theme.brandName;
  const pageTitle =
    order?.paymentStatus === 'PAID'
      ? 'Ödeme Başarılı'
      : order?.paymentStatus === 'FAILED'
        ? 'Ödeme Başarısız'
        : 'Ödeme Sonucu';
  const pageDescription = summarizeText(
    order
      ? `${siteName} siparişiniz için ödeme sonucu görüntüleniyor. Sipariş no: ${order.orderNumber}.`
      : `${siteName} ödeme sonucu sayfası yükleniyor.`,
    155,
  );

  useSeo({
    title: buildPageTitle(pageTitle, siteName),
    description: pageDescription,
    canonicalUrl: toAbsoluteSiteUrl(null, '/checkout/paytr/return'),
    keywords: buildKeywordSet(siteName, ['ödeme sonucu', 'paytr', 'sipariş durumu']),
    robots: 'noindex,follow,max-image-preview:large',
    siteName,
    imageUrl: buildDefaultSeoImageUrl(null),
    imageAlt: `${siteName} ödeme sonucu`,
  });

  if (!orderNumber) {
    return <Navigate to="/cart" replace />;
  }

  if (isEmbedded) {
    return (
      <main className="sf-paytr-return-page">
        <section className="sf-paytr-return-card">
          <h1>Odeme sonucu hazirlaniyor</h1>
          <p>Sonuc ekranina yonlendiriliyorsunuz...</p>
        </section>
      </main>
    );
  }

  const isPaid = order?.paymentStatus === 'PAID';
  const isFailed = order?.paymentStatus === 'FAILED';
  const title = isPaid
    ? 'Odemeniz basariyla alindi'
    : isFailed
      ? 'Odeme tamamlanamadi'
      : loading
        ? 'Odeme sonucu bekleniyor'
        : resultHint === 'success'
          ? 'Odeme sonucu kontrol ediliyor'
          : 'Odeme sonucu alinamadi';
  const description = isPaid
    ? 'Siparisiniz onaylandi ve ekibimiz tarafindan isleme alindi.'
    : isFailed
      ? 'PAYTR odeme bildirimi basarisiz dondu. Dilerseniz sepetinizden yeniden deneyebilirsiniz.'
      : loading
        ? `PAYTR callback onayi bekleniyor. Bu ekran otomatik guncellenir. (${attemptCount}/20)`
        : error || 'Siparis sonucunu kontrol etmek icin tekrar deneyin.';

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="sf-paytr-return-page">
        <section className="sf-paytr-return-card">
          <span className={isPaid ? 'sf-paytr-return-badge paid' : isFailed ? 'sf-paytr-return-badge failed' : 'sf-paytr-return-badge pending'}>
            {isPaid ? 'Odeme Basarili' : isFailed ? 'Odeme Basarisiz' : 'Bekleniyor'}
          </span>
          <h1>{title}</h1>
          <p>{description}</p>

          {order ? (
            <div className="sf-paytr-return-grid">
              <article>
                <small>Siparis No</small>
                <strong>{order.orderNumber}</strong>
              </article>
              <article>
                <small>Odeme Durumu</small>
                <strong>{order.paymentStatus}</strong>
              </article>
              <article>
                <small>Siparis Tutari</small>
                <strong>{formatter.format(parsePrice(order.grandTotal))}</strong>
              </article>
              <article>
                <small>Odeme Saglayici</small>
                <strong>{order.paymentProvider || 'PAYTR'}</strong>
              </article>
            </div>
          ) : null}

          <div className="sf-paytr-return-actions">
            <Link to={isPaid ? '/customer/dashboard?tab=orders' : '/cart'}>
              {isPaid ? 'Siparislerime Git' : 'Sepete Don'}
            </Link>
            <Link to="/">Ana Sayfaya Don</Link>
          </div>
        </section>
      </div>
    </PublicStorefrontLayout>
  );
}
