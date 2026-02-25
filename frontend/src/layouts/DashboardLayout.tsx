import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAdminSocket } from '../lib/socket';

const menuItems = [
  {
    to: '/dashboard/website',
    title: 'Website Icerik',
    subtitle: 'Slider, Hero ve Footer',
  },
  {
    to: '/dashboard/settings',
    title: 'Ayarlar',
    subtitle: 'E-Ticaret Sistem',
  },
  {
    to: '/dashboard/categories',
    title: 'Kategoriler',
    subtitle: 'Yonetim',
  },
  {
    to: '/dashboard/products',
    title: 'Urunler',
    subtitle: 'Tablo ve Yonetim',
  },
  {
    to: '/dashboard/orders',
    title: 'Siparisler',
    subtitle: 'Website Yonetimi',
  },
  {
    to: '/dashboard/representatives',
    title: 'Temsilciler',
    subtitle: 'Zimmet ve Ekip',
  },
];

export function DashboardLayout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [connection, setConnection] = useState<'bagli' | 'kopuk'>('kopuk');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className={isSidebarOpen ? 'dashboard-shell sidebar-open' : 'dashboard-shell sidebar-closed'}>
      <aside className="dashboard-sidebar" id="dashboard-sidebar">
        <div className="sidebar-top">
          <div className="brand">Er Zeytin</div>
          <button
            aria-label="Menuyu kapat"
            className="sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          >
            x
          </button>
        </div>
        <div className="sidebar-label">ADMIN MENU</div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
              }
            >
              <span className="sidebar-link-title">{item.title}</span>
              <span className="sidebar-link-sub">{item.subtitle}</span>
            </NavLink>
          ))}
        </nav>

        <button className="logout-button" onClick={handleLogout} type="button">
          Cikis Yap
        </button>
      </aside>

      <div className="dashboard-content-wrapper">
        <header className="topbar">
          <button
            aria-controls="dashboard-sidebar"
            aria-expanded={isSidebarOpen}
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen((current) => !current)}
            type="button"
          >
            {isSidebarOpen ? 'Menuyu Kapat' : 'Menuyu Ac'}
          </button>
          <div className="topbar-search">Search</div>
          <div className="topbar-right">
            <span className={connection === 'bagli' ? 'status-live' : 'status-offline'}>
              {connection === 'bagli' ? 'Live' : 'Offline'}
            </span>
            <span className="topbar-user">
              {user?.fullName || user?.username || 'admin'} ({user?.role ?? 'ADMIN'})
            </span>
          </div>
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
