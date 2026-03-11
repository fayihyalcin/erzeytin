import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { isInternalRoute, resolveStoreFooterHref } from '../lib/public-site';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type { PublicSettingsDto, WebsiteConfig, WebsiteLegalDocument } from '../types/api';
import './LegalPages.css';

type LegalDocumentKey = 'kvkk' | 'privacy' | 'sales';

function splitContent(value: string) {
  return value
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function useWebsiteConfig() {
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<PublicSettingsDto>('/settings/public')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setConfig(parseWebsiteConfig(response.data.websiteConfig));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { config, loading };
}

function LegalLayout({
  title,
  subtitle,
  config,
  children,
}: {
  title: string;
  subtitle: string;
  config: WebsiteConfig;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <header className="legal-topbar">
        <div className="legal-topbar-inner">
          <Link to="/" className="legal-brand">
            {config.theme.brandName}
          </Link>
          <nav className="legal-nav">
            <Link to="/">Magaza</Link>
            <Link to="/kategoriler">Kategoriler</Link>
            <Link to="/urunler">Urunler</Link>
            <Link to="/kampanyalar">Kampanyalar</Link>
            <Link to="/iletisim">Iletisim</Link>
          </nav>
        </div>
      </header>

      <section className="legal-hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>

      <section className="legal-content">{children}</section>
    </main>
  );
}

function LegalSection({ heading, body }: { heading: string; body: string }) {
  return (
    <article className="legal-section">
      <h2>{heading}</h2>
      <div>
        {splitContent(body).map((paragraph, index) => (
          <p key={`${heading}-${index}`}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

function LegalDocumentPage({ documentKey }: { documentKey: LegalDocumentKey }) {
  const { config, loading } = useWebsiteConfig();
  const document: WebsiteLegalDocument = config.legalPages[documentKey];

  return (
    <LegalLayout config={config} title={document.title} subtitle={document.subtitle}>
      {loading ? (
        <article className="legal-section">
          <p>Sayfa yukleniyor...</p>
        </article>
      ) : (
        document.sections.map((section, index) => (
          <LegalSection
            key={`${documentKey}-${index}-${section.heading}`}
            heading={section.heading}
            body={section.body}
          />
        ))
      )}
    </LegalLayout>
  );
}

export function KvkkPage() {
  return <LegalDocumentPage documentKey="kvkk" />;
}

export function PrivacyPolicyPage() {
  return <LegalDocumentPage documentKey="privacy" />;
}

export function SalesAgreementPage() {
  return <LegalDocumentPage documentKey="sales" />;
}

export function ContactPage() {
  const { config, loading } = useWebsiteConfig();
  const contact = config.contact;
  const footerColumns = config.footerColumns;
  const footerLegalLinks = useMemo(
    () => [
      { href: '/kvkk', label: config.legalPages.kvkk.title },
      { href: '/gizlilik', label: config.legalPages.privacy.title },
      { href: '/satis-sozlesmesi', label: config.legalPages.sales.title },
      { href: '/iletisim', label: 'Iletisim' },
    ],
    [config],
  );

  return (
    <main className="contact-page">
      <header className="contact-header">
        <div className="contact-shell contact-header-inner">
          <Link to="/" className="contact-brand" aria-label={`${config.theme.brandName} anasayfa`}>
            <span className="contact-brand-mark">EZ</span>
            <span className="contact-brand-text">
              <strong>{config.theme.brandName}</strong>
              <small>{config.theme.tagline}</small>
            </span>
          </Link>

          <nav className="contact-nav">
            <Link to="/">Ana Sayfa</Link>
            <Link to="/kategoriler">Kategoriler</Link>
            <Link to="/urunler">Urunler</Link>
            <Link to="/kampanyalar">Kampanyalar</Link>
            <Link to="/cart">Sepetim</Link>
          </nav>

          <div className="contact-header-meta">
            <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </div>
        </div>
      </header>

      <section className="contact-hero">
        <div className="contact-shell contact-hero-grid">
          <div className="contact-hero-content">
            <p className="contact-hero-badge">{config.contactPage.badge}</p>
            <h1>{config.contactPage.title}</h1>
            <p>{config.contactPage.description}</p>
            <div className="contact-hero-actions">
              <a href={contact.phoneLink}>Telefonla Ara</a>
              <a href={contact.whatsappLink} target="_blank" rel="noreferrer">
                WhatsApp'tan Yaz
              </a>
            </div>
          </div>

          <article className="contact-hero-info">
            <h2>{config.contactPage.quickInfoTitle}</h2>
            <ul>
              <li>
                <span>Telefon</span>
                <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
              </li>
              <li>
                <span>E-posta</span>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>
                <span>Adres</span>
                <p>{contact.address}</p>
              </li>
              <li>
                <span>Calisma Saatleri</span>
                <p>{contact.workingHours}</p>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section className="contact-main">
        <div className="contact-shell contact-main-grid">
          <article className="contact-map-card">
            <div className="contact-card-head">
              <h2>{config.contactPage.mapTitle}</h2>
              <p>{config.contactPage.mapDescription}</p>
            </div>
            <div className="contact-map-frame">
              <iframe
                title={`${config.theme.brandName} konum haritasi`}
                src={contact.mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </article>

          <article className="contact-form-card">
            <div className="contact-card-head">
              <h2>{config.contactPage.formTitle}</h2>
              <p>{config.contactPage.formDescription}</p>
            </div>

            <form
              className="contact-form"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <label>
                Ad Soyad
                <input type="text" placeholder="Adiniz Soyadiniz" />
              </label>
              <label>
                E-posta
                <input type="email" placeholder="ornek@site.com" />
              </label>
              <label>
                Telefon
                <input type="tel" placeholder="+90 5xx xxx xx xx" />
              </label>
              <label>
                Konu
                <input type="text" placeholder="Siparis / Odeme / Kargo / Iade" />
              </label>
              <label className="contact-form-message">
                Mesaj
                <textarea rows={5} placeholder="Mesajinizi yazin..." />
              </label>
              <button type="submit">Mesaji Gonder</button>
            </form>
          </article>
        </div>
      </section>

      <section className="contact-quick-access">
        <div className="contact-shell contact-quick-grid">
          <a href={contact.phoneLink} className="contact-quick-card phone">
            <span className="icon" aria-hidden="true">
              TL
            </span>
            <div>
              <strong>Telefon Destek</strong>
              <p>{contact.phoneDisplay}</p>
            </div>
          </a>

          <a
            href={contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="contact-quick-card whatsapp"
          >
            <span className="icon" aria-hidden="true">
              WA
            </span>
            <div>
              <strong>WhatsApp Hizli Erisim</strong>
              <p>Tek tikla uzman destegine ulasin</p>
            </div>
          </a>

          <a href={`mailto:${contact.email}`} className="contact-quick-card mail">
            <span className="icon" aria-hidden="true">
              EP
            </span>
            <div>
              <strong>E-posta Destegi</strong>
              <p>{contact.email}</p>
            </div>
          </a>
        </div>
      </section>

      <footer className="contact-footer">
        <div className="contact-shell contact-footer-grid">
          <article className="contact-footer-brand">
            <h3>{config.theme.brandName}</h3>
            <p>{config.contactPage.footerDescription}</p>
            <ul className="contact-footer-contact-list">
              <li>
                <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>{contact.address}</li>
            </ul>
          </article>

          {footerColumns.map((column) => (
            <nav key={column.title} className="contact-footer-links">
              <h4>{column.title}</h4>
              {column.links.map((link) => {
                const href = resolveStoreFooterHref(link);

                if (isInternalRoute(href)) {
                  return (
                    <Link key={`${column.title}-${link.label}-${href}`} to={href}>
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <a key={`${column.title}-${link.label}-${href}`} href={href}>
                    {link.label}
                  </a>
                );
              })}
            </nav>
          ))}
        </div>

        <div className="contact-shell contact-footer-bottom">
          <span>
            {config.theme.brandName} (c) {new Date().getFullYear()} - Tum haklari saklidir.
          </span>
          <div className="contact-footer-inline-links">
            {footerLegalLinks.map((item) => (
              <Link key={item.href} to={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Yukari Don
          </button>
        </div>
      </footer>

      {!loading ? (
        <a className="sf-whatsapp-float" href={contact.whatsappLink} target="_blank" rel="noreferrer">
          <span className="label">WhatsApp</span>
          <span className="icon" aria-hidden="true">
            WA
          </span>
        </a>
      ) : null}
    </main>
  );
}
