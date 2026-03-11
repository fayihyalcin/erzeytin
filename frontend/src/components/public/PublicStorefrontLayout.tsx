import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStoreCart } from '../../context/StoreCartContext';
import {
  isActiveStoreHref,
  isInternalRoute,
  resolveStoreFooterHref,
  resolveStoreHref,
  resolveStoreNavItemHref,
} from '../../lib/public-site';
import type { WebsiteConfig } from '../../types/api';
import './PublicStorefrontLayout.css';

function StoreLink({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (isInternalRoute(href)) {
    return (
      <Link className={className} onClick={onClick} to={href}>
        {children}
      </Link>
    );
  }

  return (
    <a className={className} href={href} onClick={onClick}>
      {children}
    </a>
  );
}

export function PublicStorefrontLayout({
  activePath,
  children,
  config,
  currency,
}: {
  activePath: string;
  children: ReactNode;
  config: WebsiteConfig;
  currency: string;
}) {
  const { itemCount } = useStoreCart();
  const { isAuthenticated, logout } = useCustomerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contact = config.contact;

  return (
    <div className="ps-site">
      <div className="ps-top-strip">
        <div className="ps-container ps-top-inner">
          <div className="ps-top-support">
            <span>Destek hatti</span>
            <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
          </div>

          <div className="ps-top-announcement">
            <span>{currency}</span>
            <strong>Online mağaza</strong>
            <p>{config.announcement}</p>
          </div>

          <div className="ps-top-links">
            <Link to={isAuthenticated ? '/customer/dashboard' : '/customer/login'}>
              {isAuthenticated ? 'Hesabım' : 'Müşteri Girişi'}
            </Link>
            <Link to="/cart">Sepet</Link>
            <Link to="/iletisim">İletişim</Link>
          </div>
        </div>
      </div>

      <header className="ps-header">
        <div className="ps-container ps-header-main">
          <Link className="ps-brand" to="/">
            <span className="ps-brand-mark">EZ</span>
            <span className="ps-brand-text">
              <strong>{config.theme.brandName}</strong>
              <small>{config.theme.tagline}</small>
            </span>
          </Link>

          <div className="ps-header-actions">
            <Link className="ps-account-btn" to={isAuthenticated ? '/customer/dashboard' : '/customer/login'}>
              {isAuthenticated ? 'Hesabım' : 'Müşteri Girişi'}
            </Link>
            {isAuthenticated ? (
              <button className="ps-account-btn ps-account-logout" onClick={() => logout()} type="button">
                Çıkış
              </button>
            ) : null}
            <Link className="ps-cart-btn" to="/cart">
              <span>Sepetim</span>
              <strong>{itemCount} ürün</strong>
            </Link>
            <button
              className="ps-mobile-toggle"
              onClick={() => setMobileMenuOpen((current) => !current)}
              type="button"
            >
              Menü
            </button>
          </div>
        </div>

        <div className="ps-nav-row">
          <div className="ps-container ps-nav-inner">
            <Link className="ps-all-categories" to="/kategoriler">
              Tüm Kategorileri Keşfet
            </Link>

            <nav className={mobileMenuOpen ? 'ps-nav ps-nav-open' : 'ps-nav'}>
              {config.navItems.map((item) => {
                const href = resolveStoreNavItemHref(item);
                const active = isActiveStoreHref(activePath, href);

                return (
                  <StoreLink
                    key={`${item.label}-${href}`}
                    className={active ? 'active' : undefined}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </StoreLink>
                );
              })}
            </nav>

            <div className="ps-support-meta">
              <span>{contact.workingHours}</span>
              <strong>{contact.phoneDisplay}</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="ps-main">{children}</main>

      <footer className="ps-footer">
        <div className="ps-container ps-footer-grid">
          <article className="ps-footer-brand">
            <span className="ps-footer-badge">Kurumsal Mağaza</span>
            <h3>{config.theme.brandName}</h3>
            <p>{config.contactPage.footerDescription}</p>
            <div className="ps-footer-contact">
              <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              <span>{contact.address}</span>
            </div>
          </article>

          {config.footerColumns.map((column) => (
            <div className="ps-footer-column" key={column.title}>
              <h4>{column.title}</h4>
              <div className="ps-footer-links">
                {column.links.map((link) => {
                  const href = resolveStoreFooterHref(link);

                  return (
                    <StoreLink
                      className={isActiveStoreHref(activePath, href) ? 'active' : undefined}
                      href={href}
                      key={`${column.title}-${link.label}-${href}`}
                    >
                      {link.label}
                    </StoreLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="ps-container ps-footer-bottom">
          <span>
            {config.theme.brandName} - {new Date().getFullYear()} Tüm hakları saklıdır.
          </span>
          <div className="ps-footer-legal">
            {[
              { label: config.legalPages.kvkk.title, href: '/kvkk' },
              { label: config.legalPages.privacy.title, href: '/gizlilik' },
              { label: config.legalPages.sales.title, href: '/satis-sozlesmesi' },
              { label: 'İletişim', href: resolveStoreHref('/iletisim') },
            ].map((item) => (
              <Link key={item.href} to={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

