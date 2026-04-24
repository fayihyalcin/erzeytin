import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAdminSocket } from '../lib/socket';

type AdminRole = 'ADMIN' | 'REPRESENTATIVE';

interface MenuItem {
  to: string;
  title: string;
  description: string;
  shortCode: string;
  roles?: AdminRole[];
}

const menuGroups: Array<{ title: string; items: MenuItem[] }> = [
  {
    title: 'Genel',
    items: [
      {
        to: '/dashboard',
        title: 'Panel',
        description: 'Genel metrikler ve hizli islemler',
        shortCode: 'PN',
      },
      {
        to: '/dashboard/website',
        title: 'Site Icerigi',
        description: 'Anasayfa, iletisim ve yasal sayfalar',
        shortCode: 'SI',
        roles: ['ADMIN'],
      },
      {
        to: '/dashboard/posts',
        title: 'Yazilar',
        description: 'Blog ve rehber icerikleri',
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
        description: 'Urun gruplari ve SEO alanlari',
        shortCode: 'KT',
      },
      {
        to: '/dashboard/products',
        title: 'Urunler',
        description: 'Urun, fiyat, stok ve gorseller',
        shortCode: 'UR',
      },
      {
        to: '/dashboard/landing-pages',
        title: 'Landing Pages',
        description: 'Reklam sayfalari ve tekil urun akislari',
        shortCode: 'LP',
        roles: ['ADMIN'],
      },
    ],
  },
  {
    title: 'Operasyon',
    items: [
      {
        to: '/dashboard/orders',
        title: 'Siparisler',
        description: 'Siparis, odeme, kargo ve zimmet',
        shortCode: 'SP',
      },
      {
        to: '/dashboard/representatives',
        title: 'Temsilciler',
        description: 'Ekip ve musteri temsilciligi',
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
        description: 'Magaza, para birimi ve vergi ayarlari',
        shortCode: 'AY',
        roles: ['ADMIN'],
      },
    ],
  },
];

function findCurrentItem(
  pathname: string,
  groups: Array<{ title: string; items: MenuItem[] }>,
) {
  return groups
    .flatMap((group) => group.items)
    .find((item) =>
      item.to === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.to),
    );
}

function buildVisibleMenuGroups(role: AdminRole | undefined) {
  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || !role || item.roles.includes(role),
      ),
    }))
    .filter((group) => group.items.length > 0);
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
    if (typeof document === 'undefined') {
      return;
    }

    const isMobileViewport =
      typeof window !== 'undefined' && window.matchMedia('(max-width: 1080px)').matches;

    if (!sidebarOpen || !isMobileViewport) {
      document.body.classList.remove('dashboard-sidebar-lock');
      return;
    }

    document.body.classList.add('dashboard-sidebar-lock');

    return () => {
      document.body.classList.remove('dashboard-sidebar-lock');
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

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

  const visibleMenuGroups = useMemo(() => buildVisibleMenuGroups(user?.role), [user?.role]);
  const currentItem = useMemo(
    () => findCurrentItem(location.pathname, menuGroups),
    [location.pathname],
  );
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

  const sidebarClassName = [
    'dashboard-sidebar',
    sidebarCollapsed ? 'dashboard-sidebar-collapsed' : '',
    sidebarOpen ? 'dashboard-sidebar-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

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

      <aside className={sidebarClassName} id="dashboard-sidebar">
        <div className="dashboard-sidebar-top">
          <div className="dashboard-brand-block">
            <span className="dashboard-brand-mark">EZ</span>
            {!sidebarCollapsed ? (
              <div>
                <strong>Er Zeyincilik</strong>
                <small>E-ticaret admin paneli</small>
              </div>
            ) : null}
          </div>

          <div className="dashboard-sidebar-actions">
            <button
              aria-label="Menuyu kapat"
              className="dashboard-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              type="button"
            >
              <span aria-hidden="true" className="dashboard-sidebar-close-icon">
                x
              </span>
              <span>Kapat</span>
            </button>
            <button
              aria-label={sidebarCollapsed ? 'Yan menuyu genislet' : 'Yan menuyu daralt'}
              className="dashboard-collapse-button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              type="button"
            >
              {sidebarCollapsed ? '>' : '<'}
            </button>
          </div>
        </div>

        {!sidebarCollapsed ? (
          <div className="dashboard-sidebar-insight">
            <span className="dashboard-menu-group-title">Operasyon ozeti</span>
            <strong>{currentItem?.title ?? 'Panel'}</strong>
            <p>
              {currentItem?.description ??
                'Siparis, katalog, medya ve CMS alanlarini tek merkezden yonetin.'}
            </p>
            <div className="dashboard-sidebar-tags">
              <span className={connection === 'bagli' ? 'admin-chip success' : 'admin-chip'}>
                {connection === 'bagli' ? 'Canli akis' : 'Cevrimdisi'}
              </span>
              <span className="admin-chip info">{user?.role ?? 'ADMIN'}</span>
            </div>
          </div>
        ) : null}

        <nav className="dashboard-menu">
          {visibleMenuGroups.map((group) => (
            <div key={group.title} className="dashboard-menu-group">
              {!sidebarCollapsed ? (
                <span className="dashboard-menu-group-title">{group.title}</span>
              ) : null}
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
            {!sidebarCollapsed ? 'Siteyi gor' : null}
          </Link>
          <button className="dashboard-footer-button" onClick={handleLogout} type="button">
            <span className="dashboard-menu-icon">CK</span>
            {!sidebarCollapsed ? 'Cikis yap' : null}
          </button>
        </div>
      </aside>

      <div className={sidebarCollapsed ? 'dashboard-content dashboard-content-wide' : 'dashboard-content'}>
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebarOpen}
              aria-label={sidebarOpen ? 'Menuyu kapat' : 'Menuyu ac'}
              className={sidebarOpen ? 'dashboard-mobile-toggle is-open' : 'dashboard-mobile-toggle'}
              onClick={() => setSidebarOpen((current) => !current)}
              type="button"
            >
              <span aria-hidden="true" className="dashboard-mobile-toggle-icon">
                <span />
                <span />
                <span />
              </span>
              <span className="dashboard-mobile-toggle-text">
                {sidebarOpen ? 'Kapat' : 'Menu'}
              </span>
            </button>
            <div className="dashboard-topbar-copy">
              <span className="dashboard-topbar-label">Yonetim merkezi</span>
              <h1>{currentItem?.title ?? 'Panel'}</h1>
              <p>
                {currentItem?.description ??
                  'Katalog, icerik ve operasyon akislarini daha hizli yonetmek icin optimize edildi.'}
              </p>
            </div>
          </div>

          <div className="dashboard-topbar-right">
            <div className="dashboard-topbar-meta">
              <strong>{todayLabel}</strong>
              <span>Kurumsal yonetim akisi</span>
            </div>
            <span className={connection === 'bagli' ? 'admin-pill success' : 'admin-pill'}>
              {connection === 'bagli' ? 'Canli baglanti' : 'Baglanti yok'}
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
