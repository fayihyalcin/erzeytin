import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { firePurchaseTrackingScripts } from '../lib/tracking';
import type { Order, PublicSettingsDto } from '../types/api';
import '../components/landing/LandingPageRenderer.css';

function parsePrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentMethodLabel(value: Order['paymentMethod']) {
  if (value === 'CASH_ON_DELIVERY') {
    return 'Kapida nakit odeme';
  }

  if (value === 'CARD_ON_DELIVERY') {
    return 'Kapida kart ile odeme';
  }

  if (value === 'CARD') {
    return 'Online kart odemesi';
  }

  return value;
}

export function LandingOrderResultPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order')?.trim() ?? '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingScripts, setTrackingScripts] = useState({
    metaPixelPurchaseScript: '',
    tiktokPixelPurchaseScript: '',
  });

  useEffect(() => {
    let mounted = true;

    api
      .get<PublicSettingsDto>('/settings/public', { requiresAdminAuth: false })
      .then((response) => {
        if (!mounted) {
          return;
        }

        setTrackingScripts({
          metaPixelPurchaseScript: response.data.metaPixelPurchaseScript ?? '',
          tiktokPixelPurchaseScript: response.data.tiktokPixelPurchaseScript ?? '',
        });
      })
      .catch(() => {
        if (mounted) {
          setTrackingScripts({
            metaPixelPurchaseScript: '',
            tiktokPixelPurchaseScript: '',
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    let cancelled = false;

    api
      .get<Order>(`/landing-pages/public/orders/${encodeURIComponent(orderNumber)}`, {
        requiresAdminAuth: false,
      })
      .then((response) => {
        if (cancelled) {
          return;
        }

        setOrder(response.data);
        setError('');
      })
      .catch(() => {
        if (!cancelled) {
          setError('Siparis sonucu su anda okunamiyor. Lutfen biraz sonra tekrar deneyin.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  useEffect(() => {
    if (!order) {
      return;
    }

    firePurchaseTrackingScripts(
      trackingScripts,
      order,
      `landing-result:${order.orderNumber}`,
    );
  }, [order, trackingScripts]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: order?.currency || 'TRY',
        maximumFractionDigits: 2,
      }),
    [order?.currency],
  );

  if (!orderNumber) {
    return <Navigate replace to="/" />;
  }

  const landingPath =
    typeof order?.sourceMeta?.landingPath === 'string' ? order.sourceMeta.landingPath : '/';
  const packageTitle =
    typeof order?.sourceMeta?.selectedPackageTitle === 'string'
      ? order.sourceMeta.selectedPackageTitle
      : order?.items[0]?.productName ?? '-';
  const addressText = order
    ? [
        order.shippingAddress.line1,
        order.shippingAddress.line2,
        order.shippingAddress.district,
        order.shippingAddress.city,
      ]
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .join(', ') || 'Adres belirtilmedi'
    : '-';

  return (
    <main className="landing-page-shell">
      <div className="landing-page-container" style={{ maxWidth: 760 }}>
        <section className="landing-form-step">
          <h1 className="landing-section-title">Siparisiniz alindi</h1>
          <p className="landing-section-subtitle">
            {loading
              ? 'Siparis bilginiz hazirlaniyor...'
              : order
                ? 'Siparisiniz basariyla olusturuldu. Ekibimiz en kisa surede sizinle iletisime gececek.'
                : error || 'Siparis sonucu goruntulenemedi.'}
          </p>

          {order ? (
            <div className="landing-summary">
              <div className="landing-summary-row">
                <span>Siparis No</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className="landing-summary-row">
                <span>Paket</span>
                <strong>{packageTitle}</strong>
              </div>
              <div className="landing-summary-row">
                <span>Musteri</span>
                <strong>{order.customerName}</strong>
              </div>
              <div className="landing-summary-row">
                <span>Telefon</span>
                <strong>{order.customerPhone ?? '-'}</strong>
              </div>
              <div className="landing-summary-row">
                <span>Odeme Yontemi</span>
                <strong>{paymentMethodLabel(order.paymentMethod)}</strong>
              </div>
              <div className="landing-summary-row">
                <span>Adres</span>
                <strong>{addressText}</strong>
              </div>
              <div className="landing-summary-row landing-summary-total">
                <span>Toplam</span>
                <strong>{formatter.format(parsePrice(order.grandTotal))}</strong>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link className="landing-info-cta" to={landingPath}>
              Landing sayfasina don
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
