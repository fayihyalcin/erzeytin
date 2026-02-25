import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type {
  AdminUser,
  FulfillmentStatus,
  Order,
  OrderActivity,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types/api';

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
];

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  'CARD',
  'CASH_ON_DELIVERY',
  'BANK_TRANSFER',
  'EFT_HAVALE',
  'PAYPAL',
  'OTHER',
];

const FULFILLMENT_STATUS_OPTIONS: FulfillmentStatus[] = [
  'UNFULFILLED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Yeni',
  CONFIRMED: 'Onaylandi',
  PREPARING: 'Hazirlaniyor',
  SHIPPED: 'Kargoda',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'Iptal',
  REFUNDED: 'Iade',
  PENDING: 'Bekliyor',
  PAID: 'Odendi',
  FAILED: 'Basarisiz',
  UNFULFILLED: 'Hazirlanmadi',
  PROCESSING: 'Hazirlaniyor',
  CARD: 'Kredi/Banka Karti',
  CASH_ON_DELIVERY: 'Kapida Odeme',
  BANK_TRANSFER: 'Banka Havalesi',
  EFT_HAVALE: 'EFT/Havale',
  PAYPAL: 'PayPal',
  OTHER: 'Diger',
};

interface UpdateFormState {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentProvider: string;
  paymentTransactionId: string;
  fulfillmentStatus: FulfillmentStatus;
  shippingMethod: string;
  shippingCompany: string;
  trackingNumber: string;
  trackingUrl: string;
  assignedRepresentativeId: string;
  assignmentNote: string;
  adminNote: string;
}

function formatCurrency(value: string, currency: string) {
  const numeric = Number(value);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('tr-TR');
}

function normalizeWhatsappPhone(phone?: string | null) {
  if (!phone) {
    return null;
  }

  let digits = phone.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    digits = `90${digits.slice(1)}`;
  } else if (!digits.startsWith('90') && digits.length === 10) {
    digits = `90${digits}`;
  }

  return digits.length >= 10 ? digits : null;
}

function toUpdateForm(order: Order): UpdateFormState {
  return {
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentProvider: order.paymentProvider ?? '',
    paymentTransactionId: order.paymentTransactionId ?? '',
    fulfillmentStatus: order.fulfillmentStatus,
    shippingMethod: order.shippingMethod ?? '',
    shippingCompany: order.shippingCompany ?? '',
    trackingNumber: order.trackingNumber ?? '',
    trackingUrl: order.trackingUrl ?? '',
    assignedRepresentativeId: order.assignedRepresentativeId ?? '',
    assignmentNote: order.assignmentNote ?? '',
    adminNote: order.adminNote ?? '',
  };
}

export function OrderDetailPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orderId } = useParams<{ orderId: string }>();

  const isAdmin = user?.role === 'ADMIN';
  const isRepresentative = user?.role === 'REPRESENTATIVE';

  const [order, setOrder] = useState<Order | null>(null);
  const [activities, setActivities] = useState<OrderActivity[]>([]);
  const [representatives, setRepresentatives] = useState<AdminUser[]>([]);
  const [updateForm, setUpdateForm] = useState<UpdateFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orderNotFound, setOrderNotFound] = useState(false);

  const fetchOrderDetail = async () => {
    if (!orderId) {
      setOrderNotFound(true);
      return;
    }

    const [orderResponse, activityResponse] = await Promise.all([
      api.get<Order>(`/orders/${orderId}`),
      api.get<OrderActivity[]>(`/orders/${orderId}/activities`),
    ]);

    setOrder(orderResponse.data);
    setUpdateForm(toUpdateForm(orderResponse.data));
    setActivities(activityResponse.data);
  };

  useEffect(() => {
    let mounted = true;

    const loadPage = async () => {
      setLoading(true);
      setMessage(null);
      setOrderNotFound(false);

      try {
        if (isAdmin) {
          const representativesResponse = await api.get<AdminUser[]>(
            '/users/representatives',
          );
          if (mounted) {
            setRepresentatives(representativesResponse.data);
          }
        }

        await fetchOrderDetail();
      } catch {
        if (mounted) {
          setOrderNotFound(true);
          setMessage('Siparis bulunamadi veya erisim yetkiniz yok.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPage();

    return () => {
      mounted = false;
    };
  }, [orderId, isAdmin]);

  const handleStatusUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!order || !updateForm) {
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = {
        status: updateForm.status,
        paymentStatus: updateForm.paymentStatus,
        paymentMethod: updateForm.paymentMethod,
        paymentProvider: updateForm.paymentProvider,
        paymentTransactionId: updateForm.paymentTransactionId,
        fulfillmentStatus: updateForm.fulfillmentStatus,
        shippingMethod: updateForm.shippingMethod,
        shippingCompany: updateForm.shippingCompany,
        trackingNumber: updateForm.trackingNumber,
        trackingUrl: updateForm.trackingUrl,
        assignmentNote: updateForm.assignmentNote,
        adminNote: updateForm.adminNote,
      };

      if (isAdmin) {
        if (updateForm.assignedRepresentativeId) {
          payload.assignedRepresentativeId = updateForm.assignedRepresentativeId;
        } else if (order.assignedRepresentativeId) {
          payload.clearAssignment = true;
        }
      } else if (isRepresentative && user) {
        payload.assignedRepresentativeId =
          order.assignedRepresentativeId ?? user.id;
      }

      const updated = await api.patch<Order>(`/orders/${order.id}`, payload);

      setOrder(updated.data);
      setUpdateForm(toUpdateForm(updated.data));
      const activityResponse = await api.get<OrderActivity[]>(
        `/orders/${order.id}/activities`,
      );
      setActivities(activityResponse.data);
      setMessage('Siparis guncellendi.');
    } catch {
      setMessage('Siparis guncellenemedi.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <section className="panel-card">Siparis detayi yukleniyor...</section>;
  }

  if (orderNotFound || !order || !updateForm) {
    return (
      <section className="panel-card">
        <div className="panel-title-row">
          <h3>Siparis Bulunamadi</h3>
          <button
            className="tiny secondary"
            type="button"
            onClick={() => navigate('/dashboard/orders')}
          >
            Siparis Listesi
          </button>
        </div>
        {message ? <p className="message">{message}</p> : null}
      </section>
    );
  }

  const whatsappPhone = normalizeWhatsappPhone(order.customerPhone);
  const whatsappLink = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `${order.orderNumber} siparisiniz icin destek hattina baglandiniz.`,
      )}`
    : null;

  return (
    <section className="orders-page-grid">
      <article className="panel-card order-detail-card">
        <div className="panel-title-row">
          <h3>Siparis Detayi</h3>
          <button
            className="tiny secondary"
            type="button"
            onClick={() => navigate('/dashboard/orders')}
          >
            Siparis Listesi
          </button>
        </div>

        <div className="order-meta-grid">
          <div>
            <small>Siparis No</small>
            <p>{order.orderNumber}</p>
          </div>
          <div>
            <small>Tarih</small>
            <p>{formatDate(order.placedAt)}</p>
          </div>
          <div>
            <small>Musteri</small>
            <p>{order.customerName}</p>
          </div>
          <div>
            <small>E-Posta</small>
            <p>{order.customerEmail}</p>
          </div>
          <div>
            <small>Telefon</small>
            <p>{order.customerPhone ?? '-'}</p>
            {whatsappLink ? (
              <a
                className="tiny whatsapp"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp Uzerinden Yaz
              </a>
            ) : null}
          </div>
          <div>
            <small>Temsilci</small>
            <p>{order.assignedRepresentative?.fullName ?? 'Zimmet Yok'}</p>
          </div>
          <div>
            <small>Odeme Yontemi</small>
            <p>{STATUS_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
          </div>
          <div>
            <small>Odeme Durumu</small>
            <p>{STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}</p>
          </div>
          <div>
            <small>Kargo Durumu</small>
            <p>{STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}</p>
          </div>
          <div>
            <small>Odeme Saglayici</small>
            <p>{order.paymentProvider ?? '-'}</p>
          </div>
          <div>
            <small>Islem No</small>
            <p>{order.paymentTransactionId ?? '-'}</p>
          </div>
          <div>
            <small>Kargo Metodu</small>
            <p>{order.shippingMethod ?? '-'}</p>
          </div>
          <div>
            <small>Kargo Firmasi</small>
            <p>{order.shippingCompany ?? '-'}</p>
          </div>
          <div>
            <small>Takip No</small>
            <p>{order.trackingNumber ?? '-'}</p>
          </div>
          <div>
            <small>Odenme Tarihi</small>
            <p>{order.paidAt ? formatDate(order.paidAt) : '-'}</p>
          </div>
          <div>
            <small>Toplam</small>
            <p>{formatCurrency(order.grandTotal, order.currency)}</p>
          </div>
        </div>

        <div className="order-address">
          <small>Teslimat Adresi</small>
          <p>
            {order.shippingAddress.fullName} - {order.shippingAddress.line1}{' '}
            {order.shippingAddress.line2 ?? ''}, {order.shippingAddress.district ?? ''}{' '}
            {order.shippingAddress.city} / {order.shippingAddress.country}
          </p>
        </div>

        <div className="order-items">
          <small>Urunler</small>
          <ul>
            {order.items.map((item, index) => (
              <li key={`${item.sku ?? item.productName}-${index}`}>
                <span>{item.productName}</span>
                <span>
                  {item.quantity} x {formatCurrency(String(item.unitPrice), order.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <form className="orders-update-form" onSubmit={handleStatusUpdate}>
          {isAdmin ? (
            <label>
              Zimmet (Temsilci)
              <select
                value={updateForm.assignedRepresentativeId}
                onChange={(event) =>
                  setUpdateForm({
                    ...updateForm,
                    assignedRepresentativeId: event.target.value,
                  })
                }
              >
                <option value="">Zimmet Yok</option>
                {representatives.map((representative) => (
                  <option key={representative.id} value={representative.id}>
                    {representative.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Zimmet (Temsilci)
              <input
                value={order.assignedRepresentative?.fullName ?? user?.fullName ?? ''}
                readOnly
              />
            </label>
          )}

          <label>
            Zimmet Notu
            <input
              value={updateForm.assignmentNote}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, assignmentNote: event.target.value })
              }
            />
          </label>

          <label>
            Siparis Durumu
            <select
              value={updateForm.status}
              onChange={(event) =>
                setUpdateForm({
                  ...updateForm,
                  status: event.target.value as OrderStatus,
                })
              }
            >
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Odeme Durumu
            <select
              value={updateForm.paymentStatus}
              onChange={(event) =>
                setUpdateForm({
                  ...updateForm,
                  paymentStatus: event.target.value as PaymentStatus,
                })
              }
            >
              {PAYMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Odeme Yontemi
            <select
              value={updateForm.paymentMethod}
              onChange={(event) =>
                setUpdateForm({
                  ...updateForm,
                  paymentMethod: event.target.value as PaymentMethod,
                })
              }
            >
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <option key={method} value={method}>
                  {STATUS_LABELS[method] ?? method}
                </option>
              ))}
            </select>
          </label>

          <label>
            Odeme Saglayici
            <input
              value={updateForm.paymentProvider}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, paymentProvider: event.target.value })
              }
              placeholder="Iyzico / Stripe / Pos"
            />
          </label>

          <label>
            Islem/Provizyon No
            <input
              value={updateForm.paymentTransactionId}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, paymentTransactionId: event.target.value })
              }
              placeholder="TRX-..."
            />
          </label>

          <label>
            Kargo Durumu
            <select
              value={updateForm.fulfillmentStatus}
              onChange={(event) =>
                setUpdateForm({
                  ...updateForm,
                  fulfillmentStatus: event.target.value as FulfillmentStatus,
                })
              }
            >
              {FULFILLMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Kargo Metodu
            <input
              value={updateForm.shippingMethod}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, shippingMethod: event.target.value })
              }
              placeholder="Standart / Ekspres"
            />
          </label>

          <label>
            Kargo Firmasi
            <input
              value={updateForm.shippingCompany}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, shippingCompany: event.target.value })
              }
            />
          </label>

          <label>
            Takip Numarasi
            <input
              value={updateForm.trackingNumber}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, trackingNumber: event.target.value })
              }
            />
          </label>

          <label>
            Takip Linki
            <input
              value={updateForm.trackingUrl}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, trackingUrl: event.target.value })
              }
              placeholder="https://..."
            />
          </label>

          <label className="field-span-2">
            Admin Notu
            <textarea
              rows={4}
              value={updateForm.adminNote}
              onChange={(event) =>
                setUpdateForm({ ...updateForm, adminNote: event.target.value })
              }
            />
          </label>

          <button type="submit" disabled={updating}>
            {updating ? 'Guncelleniyor...' : 'Siparisi Guncelle'}
          </button>
        </form>

        {message ? <p className="message">{message}</p> : null}
      </article>

      <article className="panel-card">
        <div className="panel-title-row">
          <h3>Islem Gecmisi</h3>
          <span>Takip Kayitlari</span>
        </div>
        <ul className="activity-list">
          {activities.length === 0 ? (
            <li className="muted">Henuz aktivite kaydi yok.</li>
          ) : (
            activities.map((activity) => (
              <li key={activity.id} className="activity-item">
                <div>
                  <strong>{activity.message}</strong>
                  <small>
                    {activity.actor?.fullName ??
                      activity.actorUsername ??
                      'system'}{' '}
                    - {formatDate(activity.createdAt)}
                  </small>
                </div>
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
