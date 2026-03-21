import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPagination } from '../components/admin/AdminPagination';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type {
  AdminUser,
  FulfillmentStatus,
  Order,
  OrdersSummary,
  PaginatedResponse,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
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

const PAGE_SIZE = 20;

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    fulfillmentStatus: '',
    assignedRepresentativeId: '',
    mineOnly: isRepresentative,
    search: '',
  });
  const [query, setQuery] = useState({
    page: 1,
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    fulfillmentStatus: '',
    assignedRepresentativeId: '',
    mineOnly: isRepresentative,
    search: '',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });

  useEffect(() => {
    setFilters((current) => ({ ...current, mineOnly: isRepresentative }));
    setQuery((current) => ({ ...current, mineOnly: isRepresentative, page: 1 }));
  }, [isRepresentative]);

  const fetchRepresentatives = async () => {
    const response = await api.get<PaginatedResponse<AdminUser>>('/users/representatives', {
      params: {
        page: 1,
        pageSize: 100,
      },
    });
    setRepresentatives(response.data.items);
  };

  const fetchOrders = async (nextQuery = query) => {
    const params: Record<string, string | number> = {
      page: nextQuery.page,
      pageSize: PAGE_SIZE,
    };

    if (nextQuery.status) {
      params.status = nextQuery.status;
    }
    if (nextQuery.paymentStatus) {
      params.paymentStatus = nextQuery.paymentStatus;
    }
    if (nextQuery.paymentMethod) {
      params.paymentMethod = nextQuery.paymentMethod;
    }
    if (nextQuery.fulfillmentStatus) {
      params.fulfillmentStatus = nextQuery.fulfillmentStatus;
    }
    if (nextQuery.assignedRepresentativeId) {
      params.assignedRepresentativeId = nextQuery.assignedRepresentativeId;
    }
    if (nextQuery.mineOnly) {
      params.mine = 'true';
    }
    if (nextQuery.search.trim()) {
      params.search = nextQuery.search.trim();
    }

    const response = await api.get<PaginatedResponse<Order>>('/orders', { params });
    setOrders(response.data.items);
    setPagination({
      total: response.data.total,
      page: response.data.page,
      pageSize: response.data.pageSize,
      totalPages: response.data.totalPages,
    });
  };

  const fetchSummary = async () => {
    const response = await api.get<OrdersSummary>('/orders/summary');
    setSummary(response.data);
  };

  const refresh = async (nextQuery = query) => {
    setLoading(true);
    setMessage(null);

    try {
      const tasks: Promise<unknown>[] = [fetchOrders(nextQuery), fetchSummary()];
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
    void refresh(query);
  }, [query, isAdmin]);

  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery({
      page: 1,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      paymentMethod: filters.paymentMethod,
      fulfillmentStatus: filters.fulfillmentStatus,
      assignedRepresentativeId: filters.assignedRepresentativeId,
      mineOnly: filters.mineOnly,
      search: filters.search.trim(),
    });
  };

  const handleDelete = async (order: Order) => {
    const confirmed = window.confirm(
      `${order.orderNumber} numarali siparisi silmek istediginize emin misiniz?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(order.id);
    setMessage(null);

    try {
      await api.delete(`/orders/${order.id}`);
      await refresh(query);
      setMessage('Siparis silindi.');
    } catch {
      setMessage('Siparis silinemedi.');
    } finally {
      setDeletingId(null);
    }
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
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />

        <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">Tum Siparis Durumlari</option>
          {ORDER_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] ?? status}
            </option>
          ))}
        </select>

        <select value={filters.paymentStatus} onChange={(event) => setFilters((current) => ({ ...current, paymentStatus: event.target.value }))}>
          <option value="">Tum Odeme Durumlari</option>
          {PAYMENT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] ?? status}
            </option>
          ))}
        </select>

        <select
          value={filters.paymentMethod}
          onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))}
        >
          <option value="">Tum Odeme Yontemleri</option>
          {PAYMENT_METHOD_OPTIONS.map((method) => (
            <option key={method} value={method}>
              {STATUS_LABELS[method] ?? method}
            </option>
          ))}
        </select>

        <select
          value={filters.fulfillmentStatus}
          onChange={(event) => setFilters((current) => ({ ...current, fulfillmentStatus: event.target.value }))}
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
            value={filters.assignedRepresentativeId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, assignedRepresentativeId: event.target.value }))
            }
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
            checked={filters.mineOnly}
            onChange={(event) =>
              setFilters((current) => ({ ...current, mineOnly: event.target.checked }))
            }
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
                    <td data-label="Siparis No">{order.orderNumber}</td>
                    <td data-label="Musteri">
                      <div>{order.customerName}</div>
                      <small>{order.customerEmail}</small>
                    </td>
                    <td data-label="Temsilci">{order.assignedRepresentative?.fullName ?? 'Zimmet Yok'}</td>
                    <td data-label="Tutar">{formatCurrency(order.grandTotal, order.currency)}</td>
                    <td data-label="Siparis">
                      <span className={badgeClass(order.status)}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td data-label="Odeme">
                      <span className={badgeClass(order.paymentStatus)}>
                        {STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    </td>
                    <td data-label="Yontem">{STATUS_LABELS[order.paymentMethod] ?? order.paymentMethod}</td>
                    <td data-label="Kargo">
                      <span className={badgeClass(order.fulfillmentStatus)}>
                        {STATUS_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                      </span>
                    </td>
                    <td data-label="Tarih">{formatDate(order.placedAt)}</td>
                    <td data-label="WhatsApp">
                      {whatsappLink ? (
                        <a className="tiny whatsapp" href={whatsappLink} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td data-label="Detay">
                      <div className="admin-form-actions">
                        <button
                          className="tiny secondary"
                          type="button"
                          onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        >
                          Detay
                        </button>
                        {isAdmin ? (
                          <button
                            className="admin-danger-button"
                            disabled={deletingId === order.id}
                            onClick={() => void handleDelete(order)}
                            type="button"
                          >
                            {deletingId === order.id ? 'Siliniyor...' : 'Sil'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
        page={pagination.page}
        total={pagination.total}
        totalPages={pagination.totalPages}
      />
    </section>
  );
}
