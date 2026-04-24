import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, extractApiError } from '../../lib/api';
import { buildLandingGalleryImages } from '../../lib/landing-pages';
import { buildOrderTrackingPayload, firePurchaseTrackingScripts } from '../../lib/tracking';
import type { LandingPage, Order, PaytrCheckoutSession, PublicSettingsDto } from '../../types/api';
import './LandingPageRenderer.css';

type LandingPaymentOption = 'PAYTR' | 'CASH_ON_DELIVERY' | 'CARD_ON_DELIVERY';

type LandingPageRendererProps = {
  page: LandingPage;
  previewMode?: boolean;
  previewMessage?: string;
};

const PAYMENT_OPTIONS: Array<{
  value: LandingPaymentOption;
  label: string;
}> = [
  { value: 'PAYTR', label: 'Online kart ile ode' },
  { value: 'CASH_ON_DELIVERY', label: 'Kapida nakit ode' },
  { value: 'CARD_ON_DELIVERY', label: 'Kapida kartla ode' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(value);
}

export function LandingPageRenderer({
  page,
  previewMode = false,
  previewMessage,
}: LandingPageRendererProps) {
  const navigate = useNavigate();
  const defaultPackageId = useMemo(
    () => page.config.packages.find((item) => item.isDefault)?.id ?? page.config.packages[0]?.id ?? '',
    [page.config.packages],
  );
  const formRef = useRef<HTMLElement | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState(defaultPackageId);
  const [paymentMethod, setPaymentMethod] = useState<LandingPaymentOption>('PAYTR');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [trackingScripts, setTrackingScripts] = useState({
    metaPixelPurchaseScript: '',
    tiktokPixelPurchaseScript: '',
  });

  useEffect(() => {
    setSelectedPackageId(defaultPackageId);
  }, [defaultPackageId]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.classList.add('landing-page-body');
    return () => {
      document.body.classList.remove('landing-page-body');
    };
  }, []);

  useEffect(() => {
    if (previewMode) {
      return;
    }

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
  }, [previewMode]);

  useEffect(() => {
    if (previewMode || !successOrder) {
      return;
    }

    firePurchaseTrackingScripts(
      trackingScripts,
      successOrder,
      `landing-manual:${successOrder.orderNumber}`,
    );
  }, [previewMode, successOrder, trackingScripts]);

  const selectedPackage = useMemo(
    () =>
      page.config.packages.find((item) => item.id === selectedPackageId) ??
      page.config.packages[0] ??
      null,
    [page.config.packages, selectedPackageId],
  );

  const galleryImages = useMemo(() => {
    return buildLandingGalleryImages(page.featuredImage, page.config.galleryImages);
  }, [page.config.galleryImages, page.featuredImage]);

  const activeStep = useMemo(() => {
    if (!customerName.trim() || customerPhone.trim().length < 5) {
      return 1;
    }

    if (!paymentMethod) {
      return 2;
    }

    return 3;
  }, [customerName, customerPhone, paymentMethod]);

  const submit = async () => {
    setError('');

    if (!selectedPackage) {
      setError('Once bir paket secmelisiniz.');
      return;
    }

    if (customerName.trim().length < 2) {
      setError('Ad soyad alanini doldurun.');
      return;
    }

    if (customerPhone.trim().length < 5) {
      setError('Telefon alanini doldurun.');
      return;
    }

    if (!termsAccepted) {
      setError('Devam etmek icin sozlesmeyi kabul etmelisiniz.');
      return;
    }

    if (previewMode) {
      setSuccessOrder({
        id: 'preview-order',
        orderNumber: 'ONIZLEME-0001',
        customerName,
        customerEmail: 'landing-preview@landing.local',
        customerPhone,
        shippingAddress: {
          fullName: customerName,
          phone: customerPhone,
          country: 'Turkiye',
          city: '-',
          line1: address || 'Adres belirtilmedi',
        },
        billingAddress: null,
        items: [
          {
            productName: selectedPackage.title,
            quantity: 1,
            unitPrice: selectedPackage.price,
            lineTotal: selectedPackage.price,
            variantTitle: page.name,
          },
        ],
        subtotal: selectedPackage.price.toFixed(2),
        shippingFee: '0.00',
        discountAmount: '0.00',
        taxAmount: '0.00',
        grandTotal: selectedPackage.price.toFixed(2),
        currency: 'TRY',
        status: 'NEW',
        paymentStatus: paymentMethod === 'PAYTR' ? 'PENDING' : 'PENDING',
        paymentMethod: paymentMethod === 'CARD_ON_DELIVERY' ? 'CARD_ON_DELIVERY' : paymentMethod === 'CASH_ON_DELIVERY' ? 'CASH_ON_DELIVERY' : 'CARD',
        paymentProvider: previewMode ? 'PREVIEW' : null,
        paymentTransactionId: null,
        paymentTransactions: [],
        fulfillmentStatus: 'UNFULFILLED',
        customerNote: address || null,
        adminNote: null,
        source: 'LANDING_PAGE',
        sourceMeta: null,
        assignedRepresentativeId: null,
        assignedRepresentative: null,
        assignmentNote: null,
        assignedAt: null,
        shippingMethod: 'Landing Page Siparisi',
        shippingCompany: null,
        trackingNumber: null,
        trackingUrl: null,
        bankTransferAccount: null,
        bankTransferReceiptUrl: null,
        bankTransferReceiptOriginalName: null,
        bankTransferReceiptNote: null,
        bankTransferReceiptUploadedAt: null,
        stockDeducted: false,
        placedAt: new Date().toISOString(),
        paidAt: null,
        confirmedAt: null,
        shippedAt: null,
        deliveredAt: null,
        cancelledAt: null,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    setSubmitting(true);

    try {
      if (paymentMethod === 'PAYTR') {
        const response = await api.post<PaytrCheckoutSession>(
          `/landing-pages/public/${encodeURIComponent(page.slug)}/paytr/checkout`,
          {
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            address: address.trim(),
            packageId: selectedPackage.id,
            paymentMethod,
            termsAccepted,
            tracking: buildOrderTrackingPayload(),
          },
          { requiresAdminAuth: false },
        );

        window.location.assign(response.data.iframeUrl);
        return;
      }

      const response = await api.post<Order>(
        `/landing-pages/public/${encodeURIComponent(page.slug)}/orders`,
        {
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          address: address.trim(),
          packageId: selectedPackage.id,
          paymentMethod,
          termsAccepted,
          tracking: buildOrderTrackingPayload(),
        },
        { requiresAdminAuth: false },
      );

      navigate(
        `/landing/order/result?order=${encodeURIComponent(response.data.orderNumber)}`,
      );
    } catch (requestError) {
      setError(extractApiError(requestError, 'Siparis olusturulamadi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page-shell">
      <div className="landing-page-container">
        {previewMode && previewMessage ? (
          <div className="landing-preview-banner">{previewMessage}</div>
        ) : null}

        <div className="landing-main-layout">
          <section className="landing-form-column" ref={formRef}>
            <div className="landing-form-step">
              <h1 className="landing-section-title">{page.config.announcementTitle}</h1>
              <p className="landing-section-subtitle">{page.config.announcementSubtitle}</p>

              <div className="landing-progress-steps" aria-label="Siparis adimlari">
                {page.config.stepLabels.map((label, index) => (
                  <span
                    key={label}
                    className={activeStep >= index + 1 ? 'landing-progress-step active' : 'landing-progress-step'}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="landing-stats-bar">
                <div className="landing-stat-item">
                  <span className="landing-stat-count">{page.config.visitorCount}</span>{' '}
                  {page.config.visitorLabel}
                </div>
                <div className="landing-stat-item">
                  <span>Son </span>
                  <span className="landing-stat-count">{page.config.stockCount}</span>{' '}
                  {page.config.stockLabel}
                </div>
              </div>

              <h2 className="landing-package-title">{page.config.packageSectionTitle}</h2>

              <div className="landing-package-list">
                {page.config.packages.map((item) => (
                  <button
                    key={item.id}
                    className={
                      item.id === selectedPackageId
                        ? 'landing-package-item selected'
                        : 'landing-package-item'
                    }
                    onClick={() => setSelectedPackageId(item.id)}
                    type="button"
                  >
                    <span className="landing-package-tick">
                      {item.id === selectedPackageId ? '✓' : ''}
                    </span>

                    <div className="landing-package-info">
                      <h4>{item.title}</h4>
                      {item.subtitle ? <p>{item.subtitle}</p> : null}
                      {item.note ? <span className="landing-package-note">{item.note}</span> : null}
                    </div>

                    <div className="landing-package-price">
                      <div className="landing-package-old">{formatCurrency(item.originalPrice)}</div>
                      <div className="landing-package-current">{formatCurrency(item.price)}</div>
                      {item.highlight ? (
                        <span className="landing-package-badge">{item.highlight}</span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>

              {successOrder ? (
                <div className="landing-success-box">
                  <strong>Siparisiniz alindi.</strong>
                  <div>Siparis numaraniz: {successOrder.orderNumber}</div>
                </div>
              ) : null}

              {error ? <div className="landing-error-box">{error}</div> : null}

              <div className="landing-form-step contact-focus-box">
                <h2 className="landing-package-title">{page.config.orderSectionTitle}</h2>

                <div className="landing-contact-grid">
                  <div className="landing-input-group">
                    <label htmlFor="landing-customer-name">Ad Soyad</label>
                    <input
                      autoCapitalize="words"
                      autoComplete="name"
                      id="landing-customer-name"
                      className="landing-input contact-input"
                      enterKeyHint="next"
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Adiniz soyadiniz"
                      value={customerName}
                    />
                  </div>

                  <div className="landing-input-group">
                    <label htmlFor="landing-customer-phone">Telefon</label>
                    <input
                      autoComplete="tel"
                      id="landing-customer-phone"
                      className="landing-input contact-input"
                      enterKeyHint="next"
                      inputMode="tel"
                      spellCheck={false}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="Telefon numaraniz"
                      type="tel"
                      value={customerPhone}
                    />
                  </div>
                </div>

                <div className="landing-address-group">
                  <label htmlFor="landing-address">{page.config.addressPlaceholder}</label>
                  <textarea
                    autoComplete="street-address"
                    id="landing-address"
                    className="landing-textarea"
                    enterKeyHint="done"
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder={page.config.addressPlaceholder}
                    value={address}
                  />
                </div>

                <div className="landing-address-group">
                  <label>{page.config.paymentSectionTitle}</label>
                  <div className="landing-payment-options" role="radiogroup">
                    {PAYMENT_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={
                          option.value === paymentMethod
                            ? 'landing-payment-option selected'
                            : 'landing-payment-option'
                        }
                      >
                        <input
                          checked={option.value === paymentMethod}
                          name="landing-payment-method"
                          onChange={() => setPaymentMethod(option.value)}
                          type="radio"
                          value={option.value}
                        />
                        <span className="landing-payment-tick">
                          {option.value === paymentMethod ? '✓' : ''}
                        </span>
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedPackage ? (
                  <div className="landing-summary">
                    <div className="landing-summary-row">
                      <span>Sectigin paket:</span>
                      <strong>{selectedPackage.title}</strong>
                    </div>
                    <div className="landing-summary-row">
                      <span>Kargo:</span>
                      <strong>Ucretsiz</strong>
                    </div>
                    <div className="landing-summary-row landing-summary-total">
                      <span>Odenecek tutar:</span>
                      <strong>{formatCurrency(selectedPackage.price)}</strong>
                    </div>
                  </div>
                ) : null}

                <button
                  className="landing-submit-button"
                  disabled={submitting || !selectedPackage}
                  onClick={() => void submit()}
                  type="button"
                >
                  {submitting ? 'Isleniyor...' : page.config.orderButtonLabel}
                </button>

                <label className="landing-terms">
                  <input
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    type="checkbox"
                  />
                  <span>{page.config.termsLabel}</span>
                </label>
              </div>
            </div>
          </section>

          <aside className="landing-info-column">
            <div className="landing-info-column-inner">
              <div className="landing-gallery">
                {galleryImages.length > 0 ? (
                  galleryImages.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      className={
                        index === 0
                          ? 'landing-gallery-item landing-gallery-item-primary'
                          : 'landing-gallery-item'
                      }
                      onClick={() => setSelectedImage(item)}
                      type="button"
                    >
                      <img
                        alt={`${page.name} gorsel ${index + 1}`}
                        decoding="async"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        src={item}
                      />
                    </button>
                  ))
                ) : (
                  <div className="landing-gallery-empty">
                    Bu landing page icin henuz gorsel eklenmedi.
                  </div>
                )}
              </div>

              <button className="landing-info-cta" onClick={scrollToForm} type="button">
                Siparis Formuna Git
              </button>
            </div>
          </aside>
        </div>

        <section className="landing-product-info-section">
          <div className="landing-product-info-container">
            <div className="landing-product-info-header">
              <h2>{page.config.productInfoTitle}</h2>
              <p>{page.config.productInfoDescription}</p>
            </div>

            {page.config.trustBadges.length > 0 ? (
              <div className="landing-trust-badges">
                {page.config.trustBadges.map((badge) => (
                  <span key={badge} className="landing-trust-badge">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="landing-info-grid">
              {page.config.infoCards.map((card) => (
                <article key={card.id} className="landing-info-card">
                  <div className="landing-info-card-header">
                    <span className="landing-info-card-icon">{card.icon}</span>
                    <span className="landing-info-card-title">{card.title}</span>
                  </div>
                  <ul className="landing-info-list">
                    {card.items.map((item, index) => (
                      <li key={`${card.id}-${index}`}>
                        <span className="landing-info-item-icon">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            {page.config.faqItems.length > 0 ? (
              <div className="landing-info-card" style={{ marginTop: 20 }}>
                <div className="landing-info-card-header">
                  <span className="landing-info-card-icon">?</span>
                  <span className="landing-info-card-title">{page.config.faqTitle}</span>
                </div>
                <div className="landing-faq-list">
                  {page.config.faqItems.map((item) => (
                    <article key={item.id} className="landing-faq-item">
                      <strong>{item.question}</strong>
                      <p>{item.answer}</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {page.config.reviews.length > 0 ? (
          <section className="landing-reviews-section">
            <div className="landing-reviews-header">
              <h2>
                <span>5.0</span> {page.config.reviewsTitle}
              </h2>
            </div>

            <div className="landing-reviews-grid">
              {page.config.reviews.map((review) => (
                <article key={review.id} className="landing-review-card">
                  <div className="landing-reviewer">
                    <span className="landing-reviewer-avatar">{review.initials}</span>
                    <div>
                      <strong>{review.name}</strong>
                      <div className="landing-review-stars">{'★'.repeat(review.rating)}</div>
                    </div>
                  </div>
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="landing-footer">
          <div className="landing-footer-links">
            {page.config.footerLinks.map((item) => (
              <a href={item.href} key={item.id} target={item.href.startsWith('http') ? '_blank' : undefined}>
                {item.label}
              </a>
            ))}
          </div>
          <div>
            {page.config.footerSellerText} {page.name}
          </div>
        </footer>
      </div>

      {!successOrder ? (
        <div className="landing-sticky-submit">
          <button
            className="landing-sticky-button"
            onClick={scrollToForm}
            type="button"
          >
            {page.config.stickyButtonLabel}
          </button>
        </div>
      ) : null}

      {selectedImage ? (
        <div
          className="landing-image-modal"
          onClick={() => setSelectedImage('')}
          role="presentation"
        >
          <div className="landing-image-modal-content">
            <button
              className="landing-image-modal-close"
              onClick={() => setSelectedImage('')}
              type="button"
            >
              ×
            </button>
            <img alt={page.name} src={selectedImage} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
