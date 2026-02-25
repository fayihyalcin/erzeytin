import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type {
  AdminUser,
  FulfillmentStatus,
  Order,
  OrderStatus,
  OrdersSummary,
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
  CARD: 'Kredi/Banka Karti',
  CASH_ON_DELIVERY: 'Kapida Odeme',
  BANK_TRANSFER: 'Banka Havalesi',
  EFT_HAVALE: 'EFT/Havale',
  PAYPAL: 'PayPal',
  OTHER: 'Diger',
  UNFULFILLED: 'Hazirlanmadi',
  PROCESSING: 'Hazirlaniyor',
};

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

function buildWhatsappLink(order: Order) {
  const phone = normalizeWhatsappPhone(order.customerPhone);
  if (!phone) {
    return null;
  }

  const text = encodeURIComponent(
    `${order.orderNumber} siparisiniz icin destek hattina baglandiniz.`,
  );
  return `https://wa.me/${phone}?text=${text}`;
}

function badgeClass(status: string) {
  if (status === 'DELIVERED' || status === 'PAID') {
    return 'badge badge-success';
  }
  if (status === 'CANCELLED' || status === 'FAILED' || status === 'REFUNDED') {
    return 'badge badge-danger';
  }
  if (status === 'SHIPPED' || status === 'PROCESSING' || status === 'PREPARING') {
    return 'badge badge-info';
  }
  return 'badge badge-muted';
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isRepresentative = user?.role === 'REPRESENTATIVE';
  const isAdmin = user?.role === 'ADMIN';

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [representatives, setRepresentatives] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('');
  const [assignedRepresentativeFilter, setAssignedRepresentativeFilter] = useState<string>('');
  const [mineOnly, setMineOnly] = useState<boolean>(isRepresentative);
  const [search, setSearch] = useState('');

  const fetchRepresentatives = async () => {
    const response = await api.get<AdminUser[]>('/users/representatives');
    setRepresentatives(response.data);
  };

  const fetchOrders = async () => {
    const params: Record<string, string> = {};
    if (statusFilter) {
      params.status = statusFilter;
    }
    if (paymentFilter) {
      params.paymentStatus = paymentFilter;
    }
    if (paymentMethodFilter) {
      params.paymentMethod = paymentMethodFilter;
    }
    if (fulfillmentFilter) {
      params.fulfillmentStatus = fulfillmentFilter;
    }
    if (assignedRepresentativeFilter) {
      params.assignedRepresentativeId = assignedRepresentativeFilter;
    }
    if (mineOnly) {
      params.mine = 'true';
    }
    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await api.get<Order[]>('/orders', { params });
    setOrders(response.data);
  };

  const fetchSummary = async () => {
    const response = await api.get<OrdersSummary>('/orders/summary');
    setSummary(response.data);
  };

  const refresh = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const tasks: Promise<unknown>[] = [fetchOrders(), fetchSummary()];
      if (isAdmin) {
        tasks.push(fetchRepresentatives());
      }
      await Promise.all(tasks);
    } catch {
      setMessage('Siparis verileri yuklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    setMineOnly(isRepresentative);
  }, [isRepresentative]);

  const handleFilterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await refresh();
  };

  if (loading) {
    return <section className="panel-card">Siparisler yukleniyor...</section>;
  }

  return (
    <section className="panel-card">
      <div className="panel-title-row">
        <h3>Siparis Yonetimi</h3>
        <span>Website Siparis Listesi</span>
      </div>

      <div className="orders-stats-grid">
        <div className="orders-stat-card">
          <span>Toplam Siparis</span>
          <strong>{summary?.orderCount ?? 0}</strong>
        </div>
        <div className="orders-stat-card">
          <span>Toplam Ciro</span>
          <strong>{formatCurrency(String(summary?.totalRevenue ?? 0), 'TRY')}</strong>
        </div>
        <div className="orders-stat-card">
          <span>Yeni Siparis</span>
          <strong>{summary?.byStatus?.NEW ?? 0}</strong>
        </div>
        <div className="orders-stat-card">
          <span>Kargoda</span>
          <strong>{summary?.byStatus?.SHIPPED ?? 0}</strong>
        </div>
      </div>

      <form className="orders-filters" onSubmit={handleFilterSubmit}>
        <input
          placeholder="Siparis no / musteri / e-posta"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Tum Siparis Durumlari</option>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] ?? status}
            </option>
          ))}
        </select>

        <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
          <option value="">Tum Odeme Durumlari</option>
          {PAYMENT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] ?? status}
            </option>
          ))}
        </select>

        <select
          value={paymentMethodFilter}
          onChange={(event) => setPaymentMethodFilter(event.target.value)}
        >
          <option value="">Tum Odeme Yontemleri</option>
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <option key={method} value={method}>
              {STATUS_LABELS[method] ?? method}
            </option>
          ))}
        </select>

        <select
          value={fulfillmentFilter}
          onChange={(event) => setFulfillmentFilter(event.target.value)}
        >
          <option value="">Tum Kargo Durumlari</option>
          {FULFILLMENT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] ?? status}
            </option>
          ))}
        </select>

        {isAdmin ? (
          <select
            value={assignedRepresentativeFilter}
            onChange={(event) => setAssignedRepresentativeFilter(event.target.value)}
          >
            <option value="">Tum Temsilciler</option>
            {representatives.map((representative) => (
              <option key={representative.id} value={representative.id}>
                {representative.fullName}
              </option>
            ))}
          </select>
        ) : null}

        <button type="submit">Filtrele</button>
      </form>

      {isRepresentative ? (
        <label className="muted">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(event) => setMineOnly(event.target.checked)}
          />{' '}
          Sadece zimmetimdeki siparisler
        </label>
      ) : null}

      {message ? <p className="message">{message}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Siparis No</th>
              <th>Musteri</th>
              <th>Temsilci</th>
              <th>Tutar</th>
              <th>Siparis</th>
              <th>Odeme</th>
              <th>Yontem</th>
              <th>Kargo</th>
              <th>Tarih</th>
              <th>WhatsApp</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11}>Siparis bulunamadi.</td>
              </tr>
            ) : (
              orders.map((order) => {
                const whatsappLink = buildWhatsappLink(order);

                return (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>
                      <div>{order.customerName}</div>
                      <small>{order.customerEmail}</small>
                    </td>
                    <td>{order.assignedRepresentative?.fullName ?? 'Zimmet Yok'}</td>
                    <td>{formatCurrency(order.grandTotal, order.currency)}</td>
                    <td>
                      <span className={badgeClass(order.status)}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td>
                      <span className={badgeClass(order.paymentStatus)}>
                        {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    </td>
                    <td>{STATUS_LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                    <td>
                      <span className={badgeClass(order.fulfillmentStatus)}>
                        {STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                      </span>
                    </td>
                    <td>{formatDate(order.placedAt)}</td>
                    <td>
                      {whatsappLink ? (
                        <a
                          className="tiny whatsapp"
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <button
                        className="tiny secondary"
                        type="button"
                        onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
