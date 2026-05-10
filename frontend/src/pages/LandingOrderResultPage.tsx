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
    return 'Kapıda nakit ödeme';
  }

  if (value === 'CARD_ON_DELIVERY') {
    return 'Kapıda kart ile ödeme';
  }

  if (value === 'CARD') {
    return 'Online kart ödemesi';
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
          setError('Sipariş sonucu şu anda okunamıyor. Lütfen biraz sonra tekrar deneyin.');
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
    <main className="landing-page-shell landing-result-shell">
      <div className="landing-page-container landing-result-container">
        <section className="landing-result-card">
          <div className="landing-result-hero">
            <span className="landing-result-check" aria-hidden="true">
              ✓
            </span>
            <span className="landing-result-eyebrow">Sipariş onayı</span>
            <h1 className="landing-result-title">Siparişiniz alındı</h1>
            <p className="landing-result-copy">
              {loading
                ? 'Sipariş bilginiz hazırlanıyor...'
                : order
                  ? 'Siparişiniz başarıyla oluşturuldu. Ekibimiz en kısa sürede sizinle iletişime geçecek.'
                  : error || 'Sipariş sonucu görüntülenemedi.'}
            </p>
          </div>

          {order ? (
            <>
              <div className="landing-result-order-number">
                <span>Sipariş No</span>
                <strong>{order.orderNumber}</strong>
              </div>

              <div className="landing-result-details">
                <div className="landing-result-detail landing-result-detail-wide">
                  <span>Paket</span>
                  <strong>{packageTitle}</strong>
                </div>
                <div className="landing-result-detail">
                  <span>Müşteri</span>
                  <strong>{order.customerName}</strong>
                </div>
                <div className="landing-result-detail">
                  <span>Telefon</span>
                  <strong>{order.customerPhone ?? '-'}</strong>
                </div>
                <div className="landing-result-detail">
                  <span>Ödeme yöntemi</span>
                  <strong>{paymentMethodLabel(order.paymentMethod)}</strong>
                </div>
                <div className="landing-result-detail">
                  <span>Adres</span>
                  <strong>{addressText}</strong>
                </div>
              </div>

              <div className="landing-result-total">
                <span>Toplam</span>
                <strong>{formatter.format(parsePrice(order.grandTotal))}</strong>
              </div>
            </>
          ) : null}

          <div className="landing-result-actions">
            <Link className="landing-result-primary-action" to={landingPath}>
              Satış sayfasına dön
            </Link>
            {order ? (
              <p className="landing-result-note">
                Sipariş numaranızı saklayın. Destek ekibimiz görüşmede bu numara ile yardımcı olur.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
