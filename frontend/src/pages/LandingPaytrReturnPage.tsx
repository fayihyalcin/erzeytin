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

export function LandingPaytrReturnPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order')?.trim() ?? '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
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
    let timeoutId: number | undefined;
    let currentAttempt = 0;

    const loadOrder = async () => {
      currentAttempt += 1;
      setAttemptCount(currentAttempt);

      try {
        const response = await api.get<Order>(
          `/landing-pages/public/orders/${encodeURIComponent(orderNumber)}`,
          { requiresAdminAuth: false },
        );

        if (cancelled) {
          return;
        }

        setOrder(response.data);
        setError('');

        if (
          response.data.paymentStatus === 'PAID' ||
          response.data.paymentStatus === 'FAILED' ||
          response.data.paymentStatus === 'REFUNDED'
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
        if (!cancelled) {
          setError('Odeme sonucu su anda okunamiyor. Lutfen biraz sonra tekrar deneyin.');
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [orderNumber]);

  useEffect(() => {
    if (order?.paymentStatus !== 'PAID') {
      return;
    }

    firePurchaseTrackingScripts(
      trackingScripts,
      order,
      `landing-paytr:${order.orderNumber}`,
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

  const isPaid = order?.paymentStatus === 'PAID';
  const isFailed = order?.paymentStatus === 'FAILED';
  const landingPath =
    typeof order?.sourceMeta?.landingPath === 'string' ? order.sourceMeta.landingPath : '/';

  return (
    <main className="landing-page-shell">
      <div className="landing-page-container" style={{ maxWidth: 720 }}>
        <section className="landing-form-step">
          <h1 className="landing-section-title">
            {isPaid
              ? 'Odemeniz basariyla alindi'
              : isFailed
                ? 'Odeme tamamlanamadi'
                : 'Odeme sonucu bekleniyor'}
          </h1>
          <p className="landing-section-subtitle">
            {isPaid
              ? 'Siparisiniz olusturuldu ve ekibimiz tarafindan isleme alindi.'
              : isFailed
                ? 'PAYTR odemesi basarisiz oldu. Dilerseniz tekrar deneyebilirsiniz.'
                : loading
                  ? `PAYTR callback onayi bekleniyor. Bu ekran otomatik guncellenir. (${attemptCount}/20)`
                  : error || 'Odeme sonucu alinamadi.'}
          </p>

          {order ? (
            <div className="landing-summary">
              <div className="landing-summary-row">
                <span>Siparis No</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div className="landing-summary-row">
                <span>Odeme Durumu</span>
                <strong>{order.paymentStatus}</strong>
              </div>
              <div className="landing-summary-row landing-summary-total">
                <span>Tutar</span>
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
