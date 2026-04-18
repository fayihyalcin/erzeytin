import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useStoreCart } from '../../context/StoreCartContext';
import {
  PUBLIC_PRODUCTS_SECTION_ID,
  isActiveStoreHref,
  isInternalRoute,
  resolvePublicCategoryResultsPath,
  resolveStoreFooterHref,
  resolveStoreHref,
  resolveStoreNavItemHref,
} from '../../lib/public-site';
import { useStoreHeaderNavItems } from '../../lib/storefront-navigation';
import type { WebsiteConfig } from '../../types/api';
import '../../pages/StorefrontPage.css';
import { StorefrontBrandLink } from './StorefrontBrandLink';
import { StorefrontMobileCategoryStrip } from './StorefrontMobileCategoryStrip';
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
  showFooter = true,
}: {
  activePath: string;
  children: ReactNode;
  config: WebsiteConfig;
  currency: string;
  showFooter?: boolean;
}) {
  const { itemCount } = useStoreCart();
  const { isAuthenticated, logout } = useCustomerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const headerNavItems = useStoreHeaderNavItems();
  const contact = config.contact;
  const activeSearch = new URLSearchParams(location.search).get('q') ?? '';

  useEffect(() => {
    document.body.classList.add('storefront-body');

    return () => {
      document.body.classList.remove('storefront-body');
    };
  }, []);

  useEffect(() => {
    setSearch(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const className = 'sf-mobile-nav-open';
    if (mobileMenuOpen) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (search.trim()) {
      params.set('q', search.trim());
    }

    const targetPath = params.toString()
      ? `/urunler?${params.toString()}#${PUBLIC_PRODUCTS_SECTION_ID}`
      : resolvePublicCategoryResultsPath();

    setMobileMenuOpen(false);
    navigate(targetPath);
  };

  return (
    <div className="ps-site storefront-page">
      <div className="sf-top-strip">
        <div className="sf-container sf-top-inner">
          <div className="sf-top-left">
            <span>Destek ve sipariş hattı</span>
            <strong>Bizi Ara</strong>
            <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
          </div>

          <div className="sf-top-center">
            <span>Türkçe</span>
            <span>{currency}</span>
            <span className="sf-top-badge">%25 İndirim</span>
            <span>{config.announcement}</span>
          </div>

          <div className="sf-top-right">
            <Link to={isAuthenticated ? '/customer/dashboard' : '/customer/login'}>
              {isAuthenticated ? 'Hesabım' : 'Müşteri Girişi'}
            </Link>
            <Link to="/satis-sozlesmesi">Satış Sözleşmesi</Link>
            <Link to="/iletisim">İletişim</Link>
          </div>
        </div>
      </div>

      <header className="sf-main-header">
        <div className="sf-container sf-brand-row">
          <StorefrontBrandLink brandName={config.theme.brandName} />

          <form className="sf-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="Zeytinyağı, zeytin, kategori ara"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" aria-label="Ürün ara">
              Ara
            </button>
          </form>

          <div className="sf-header-actions">
            <Link
              aria-label={isAuthenticated ? 'Müşteri paneli' : 'Müşteri girişi'}
              className="sf-customer-btn sf-header-icon-button"
              to={isAuthenticated ? '/customer/dashboard' : '/customer/login'}
            >
              <span className="sf-header-action-icon sf-header-action-icon-user" aria-hidden="true" />
              <span className="sf-header-action-label">
                {isAuthenticated ? 'Hesabım' : 'Müşteri Girişi'}
              </span>
            </Link>
            {isAuthenticated ? (
              <button className="sf-account-btn" onClick={() => logout()} type="button">
                <span className="sf-header-action-label">Çıkış</span>
              </button>
            ) : null}
            <Link
              aria-label={`Sepetim, ${itemCount} ürün`}
              className="sf-cart-btn sf-header-icon-button"
              to="/cart"
            >
              <span className="sf-header-action-icon sf-header-action-icon-cart" aria-hidden="true" />
              <span className="sf-header-action-label">Sepetim</span>
              <span className="sf-header-action-count" aria-hidden="true">
                {itemCount}
              </span>
            </Link>
          </div>

          <button
            className="sf-mobile-toggle"
            onClick={() => setMobileMenuOpen((current) => !current)}
            type="button"
            aria-controls="storefront-mobile-nav"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            <span
              className={
                mobileMenuOpen
                  ? 'sf-mobile-toggle-bars sf-mobile-toggle-bars-open'
                  : 'sf-mobile-toggle-bars'
              }
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </span>
          </button>

          <StorefrontMobileCategoryStrip
            activePath={activePath}
            items={headerNavItems}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>

        <button
          type="button"
          aria-label="Menüyü kapat"
          className={mobileMenuOpen ? 'sf-mobile-backdrop active' : 'sf-mobile-backdrop'}
          onClick={() => setMobileMenuOpen(false)}
        />

        <div className="sf-nav-row">
          <div
            className={
              mobileMenuOpen
                ? 'sf-container sf-nav-inner sf-nav-inner-open'
                : 'sf-container sf-nav-inner'
            }
          >
            <button
              type="button"
              className="sf-mobile-nav-close"
              onClick={() => setMobileMenuOpen(false)}
            >
              Kapat
            </button>
            <nav
              id="storefront-mobile-nav"
              aria-label="Mağaza gezinme"
              className={mobileMenuOpen ? 'sf-nav sf-nav-open' : 'sf-nav'}
            >
              {headerNavItems.map((item) => {
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

            <div className="sf-mobile-nav-actions">
              <Link
                className="sf-mobile-nav-primary"
                onClick={() => setMobileMenuOpen(false)}
                to={isAuthenticated ? '/customer/dashboard' : '/customer/login'}
              >
                {isAuthenticated ? 'Hesabim' : 'Musteri Girisi'}
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} to="/cart">
                Sepetim ({itemCount})
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} to="/satis-sozlesmesi">
                Satis Sozlesmesi
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} to="/iletisim">
                Iletisim
              </Link>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                >
                  Cikis Yap
                </button>
              ) : null}
            </div>

            <div className="sf-support-right">
              <span>{contact.workingHours}</span>
              <strong>{contact.phoneDisplay}</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="ps-main">{children}</main>

      {showFooter ? (
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
            <div className="ps-footer-legal" aria-label="Yasal bağlantılar">
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
      ) : null}
    </div>
  );
}
