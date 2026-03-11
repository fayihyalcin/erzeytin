import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAdminSocket } from '../lib/socket';

interface MenuItem {
  to: string;
  title: string;
  description: string;
  shortCode: string;
}

const menuGroups: Array<{ title: string; items: MenuItem[] }> = [
  {
    title: 'Genel',
    items: [
      {
        to: '/dashboard',
        title: 'Panel',
        description: 'Genel metrikler ve hızlı işlemler',
        shortCode: 'PN',
      },
      {
        to: '/dashboard/website',
        title: 'Site İçeriği',
        description: 'Anasayfa, iletişim ve yasal sayfalar',
        shortCode: 'SI',
      },
      {
        to: '/dashboard/posts',
        title: 'Yazılar',
        description: 'Blog ve rehber içerikleri',
        shortCode: 'YZ',
      },
      {
        to: '/dashboard/media',
        title: 'Medya',
        description: 'Resim, video ve dosya kutuphanesi',
        shortCode: 'MD',
      },
    ],
  },
  {
    title: 'Katalog',
    items: [
      {
        to: '/dashboard/categories',
        title: 'Kategoriler',
        description: 'Ürün grupları ve SEO alanları',
        shortCode: 'KT',
      },
      {
        to: '/dashboard/products',
        title: 'Ürünler',
        description: 'Ürün, fiyat, stok ve görseller',
        shortCode: 'UR',
      },
    ],
  },
  {
    title: 'Operasyon',
    items: [
      {
        to: '/dashboard/orders',
        title: 'Siparişler',
        description: 'Sipariş, ödeme, kargo ve zimmet',
        shortCode: 'SP',
      },
      {
        to: '/dashboard/representatives',
        title: 'Temsilciler',
        description: 'Ekip ve müşteri temsilciliği',
        shortCode: 'TM',
      },
    ],
  },
  {
    title: 'Sistem',
    items: [
      {
        to: '/dashboard/settings',
        title: 'Ayarlar',
        description: 'Mağaza, para birimi ve vergi ayarları',
        shortCode: 'AY',
      },
    ],
  },
];

function findCurrentItem(pathname: string) {
  return menuGroups
    .flatMap((group) => group.items)
    .find((item) =>
      item.to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.to),
    );
}

export function DashboardLayout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [connection, setConnection] = useState<'bagli' | 'kopuk'>('kopuk');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zeytin_admin_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        'zeytin_admin_sidebar_collapsed',
        sidebarCollapsed ? '1' : '0',
      );
    } catch {
      return;
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = createAdminSocket(token);

    socket.on('connect', () => {
      setConnection('bagli');
    });

    socket.on('disconnect', () => {
      setConnection('kopuk');
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const currentItem = useMemo(() => findCurrentItem(location.pathname), [location.pathname]);
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className="dashboard-shell modern-admin">
      {sidebarOpen ? (
        <button
          aria-label="Menuyu kapat"
          className="dashboard-overlay"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={
          sidebarCollapsed
            ? 'dashboard-sidebar dashboard-sidebar-collapsed'
            : sidebarOpen
              ? 'dashboard-sidebar dashboard-sidebar-open'
              : 'dashboard-sidebar'
        }
      >
        <div className="dashboard-sidebar-top">
          <div className="dashboard-brand-block">
            <span className="dashboard-brand-mark">EZ</span>
            {!sidebarCollapsed ? (
              <div>
                <strong>Er Zeyincilik</strong>
                <small>E-Ticaret admin paneli</small>
              </div>
            ) : null}
          </div>

          <button
            className="dashboard-collapse-button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            type="button"
          >
            {sidebarCollapsed ? '>' : '<'}
          </button>
        </div>

        {!sidebarCollapsed ? (
          <div className="dashboard-sidebar-insight">
            <span className="dashboard-menu-group-title">Operasyon özeti</span>
            <strong>{currentItem?.title ?? 'Panel'}</strong>
            <p>
              {currentItem?.description ??
                'Sipariş, katalog, medya ve CMS alanlarını tek merkezden yönetin.'}
            </p>
            <div className="dashboard-sidebar-tags">
              <span className={connection === 'bagli' ? 'admin-chip success' : 'admin-chip'}>
                {connection === 'bagli' ? 'Canlı akış' : 'Çevrimdışı'}
              </span>
              <span className="admin-chip info">{user?.role ?? 'ADMIN'}</span>
            </div>
          </div>
        ) : null}

        <nav className="dashboard-menu">
          {menuGroups.map((group) => (
            <div key={group.title} className="dashboard-menu-group">
              {!sidebarCollapsed ? <span className="dashboard-menu-group-title">{group.title}</span> : null}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    isActive || (item.to !== '/dashboard' && location.pathname.startsWith(item.to))
                      ? 'dashboard-menu-link active'
                      : 'dashboard-menu-link'
                  }
                  to={item.to}
                >
                  <span className="dashboard-menu-icon">{item.shortCode}</span>
                  {!sidebarCollapsed ? (
                    <span className="dashboard-menu-copy">
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <Link className="dashboard-footer-link" to="/">
            <span className="dashboard-menu-icon">WS</span>
            {!sidebarCollapsed ? 'Siteyi gör' : null}
          </Link>
          <button className="dashboard-footer-button" onClick={handleLogout} type="button">
            <span className="dashboard-menu-icon">CK</span>
            {!sidebarCollapsed ? 'Çıkış yap' : null}
          </button>
        </div>
      </aside>

      <div className={sidebarCollapsed ? 'dashboard-content dashboard-content-wide' : 'dashboard-content'}>
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button className="dashboard-mobile-toggle" onClick={() => setSidebarOpen(true)} type="button">
              Menü
            </button>
            <div className="dashboard-topbar-copy">
              <span className="dashboard-topbar-label">Yönetim merkezi</span>
              <h1>{currentItem?.title ?? 'Panel'}</h1>
              <p>
                {currentItem?.description ??
                  'Katalog, içerik ve operasyon akışını daha hızlı yönetmek için optimize edildi.'}
              </p>
            </div>
          </div>

          <div className="dashboard-topbar-right">
          <div className="dashboard-topbar-meta">
            <strong>{todayLabel}</strong>
            <span>Kurumsal yönetim akışı</span>
          </div>
          <span className={connection === 'bagli' ? 'admin-pill success' : 'admin-pill'}>
              {connection === 'bagli' ? 'Canlı bağlantı' : 'Bağlantı yok'}
          </span>
            <div className="dashboard-user-chip">
              <strong>{user?.fullName || user?.username || 'admin'}</strong>
              <span>{user?.role ?? 'ADMIN'}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
