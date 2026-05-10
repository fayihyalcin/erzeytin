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
  { value: 'CASH_ON_DELIVERY', label: 'Kapıda nakit öde' },
  { value: 'CARD_ON_DELIVERY', label: 'Kapıda kartla öde' },
  { value: 'PAYTR', label: 'Online kart ile öde' },
];

const TURKISH_TEXT_FIXES: Record<string, string> = {
  '1-3 gunde kapinda, guvenli alisveris': '1-3 günde kapında, güvenli alışveriş',
  '1-3 günde kapında, güvenli alışveriş': '1-3 günde kapında, güvenli alışveriş',
  '1. Paket': '1. Paket',
  '2. Bilgiler': '2. Bilgiler',
  '3. Odeme': '3. Ödeme',
  '3. Ödeme': '3. Ödeme',
  'Adres (Mahalle, sokak, ilce, il)': 'Adres (Mahalle, sokak, ilçe, il)',
  'Adres (Mahalle, sokak, ilçe, il)': 'Adres (Mahalle, sokak, ilçe, il)',
  'Avantajli fiyat': 'Avantajlı fiyat',
  'Bu landing page icin henuz gorsel eklenmedi.': 'Bu landing page için henüz görsel eklenmedi.',
  'Hizli Siparis': 'Hızlı Sipariş',
  'Hızlı Sipariş': 'Hızlı Sipariş',
  'Hakkimizda': 'Hakkımızda',
  'Kapida Odeme': 'Kapıda Ödeme',
  'Kapıda Ödeme': 'Kapıda Ödeme',
  'Kac tane alacaksin? (Adet sec)': 'Kaç tane alacaksın? (Adet seç)',
  'Kaç tane alacaksın? (Adet seç)': 'Kaç tane alacaksın? (Adet seç)',
  'Kisa paket aciklamasi': 'Kısa paket açıklaması',
  'Kısa paket açıklaması': 'Kısa paket açıklaması',
  'Musteri Yorumlari': 'Müşteri Yorumları',
  'Nasil odeyeceksin?': 'Nasıl ödeyeceksin?',
  'Nasıl ödeyeceksin?': 'Nasıl ödeyeceksin?',
  'Odeme': 'Ödeme',
  'Ödeme': 'Ödeme',
  'One Cikan': 'Öne Çıkan',
  'Öne Çıkan': 'Öne Çıkan',
  'One Cikan Ozellikler': 'Öne Çıkan Özellikler',
  'Öne Çıkan Ozellikler': 'Öne Çıkan Özellikler',
  'Siparis Formu': 'Sipariş Formu',
  'Sipariş Formu': 'Sipariş Formu',
  'Siparisi Onayla': 'Siparişi Onayla',
  'Siparişi Onayla': 'Siparişi Onayla',
  'Satici:': 'Satıcı:',
  'Satıcı:': 'Satıcı:',
  'Son urun': 'Son ürün',
  "Sozlesme ve Gizlilik'i okudum.": "Sözleşme ve Gizlilik'i okudum.",
  'Sozlesme': 'Sözleşme',
  "Sözleşme ve Gizlilik'i okudum.": "Sözleşme ve Gizlilik'i okudum.",
  'Standart paket': 'Standart paket',
  'Tekli Urun': 'Tekli Ürün',
  'Tekli Ürün': 'Tekli Ürün',
  'Tekli Urun Kampanyasi': 'Tekli Ürün Kampanyası',
  'Tekli Ürün Kampanyası': 'Tekli Ürün Kampanyası',
  'Urun Bilgileri': 'Ürün Bilgileri',
  'Ürün Bilgileri': 'Ürün Bilgileri',
  'kisi': 'kişi',
};

function fixTurkishText(value: string) {
  return TURKISH_TEXT_FIXES[value] ?? value;
}

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
  const customerNameRef = useRef<HTMLInputElement | null>(null);
  const paytrFrameRef = useRef<HTMLDivElement | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState(defaultPackageId);
  const [paymentMethod, setPaymentMethod] = useState<LandingPaymentOption>('CASH_ON_DELIVERY');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paytrLoading, setPaytrLoading] = useState(false);
  const [paytrSession, setPaytrSession] = useState<PaytrCheckoutSession | null>(null);
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
    setPaytrSession(null);
  }, [address, customerName, customerPhone, selectedPackageId]);

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

  const buildLandingOrderPayload = (method: LandingPaymentOption) => {
    if (!selectedPackage) {
      return null;
    }

    return {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      packageId: selectedPackage.id,
      paymentMethod: method,
      termsAccepted,
      tracking: buildOrderTrackingPayload(),
    };
  };

  const validateLandingOrderFields = () => {
    if (!selectedPackage) {
      setError('Önce bir paket seçmelisiniz.');
      return false;
    }

    if (customerName.trim().length < 2) {
      setError('Ad soyad alanını doldurun.');
      scrollToForm();
      return false;
    }

    if (customerPhone.trim().length < 5) {
      setError('Telefon alanını doldurun.');
      scrollToForm();
      return false;
    }

    if (!termsAccepted) {
      setError('Devam etmek için sözleşmeyi kabul etmelisiniz.');
      return false;
    }

    return true;
  };

  const scrollToPaytrFrame = () => {
    window.setTimeout(() => {
      paytrFrameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const openPaytrCheckout = async () => {
    setError('');

    if (!validateLandingOrderFields()) {
      return;
    }

    if (previewMode) {
      setPaytrSession({
        orderId: 'preview-order',
        orderNumber: 'ONIZLEME-0001',
        merchantOid: 'PREVIEW',
        paymentId: 'PREVIEW',
        iframeToken: 'PREVIEW',
        iframeUrl: 'about:blank',
      });
      scrollToPaytrFrame();
      return;
    }

    const payload = buildLandingOrderPayload('PAYTR');
    if (!payload) {
      return;
    }

    setPaytrLoading(true);

    try {
      const response = await api.post<PaytrCheckoutSession>(
        `/landing-pages/public/${encodeURIComponent(page.slug)}/paytr/checkout`,
        payload,
        { requiresAdminAuth: false },
      );
      setPaytrSession(response.data);
      scrollToPaytrFrame();
    } catch (requestError) {
      setPaytrSession(null);
      setError(extractApiError(requestError, 'PAYTR ödeme formu açılamadı.'));
    } finally {
      setPaytrLoading(false);
    }
  };

  const submit = async () => {
    setError('');

    if (!validateLandingOrderFields() || !selectedPackage) {
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
        shippingMethod: 'Landing Page Siparişi',
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
        if (paytrSession) {
          scrollToPaytrFrame();
          return;
        }

        await openPaytrCheckout();
        return;
      }

      const payload = buildLandingOrderPayload(paymentMethod);
      if (!payload) {
        return;
      }

      const response = await api.post<Order>(
        `/landing-pages/public/${encodeURIComponent(page.slug)}/orders`,
        payload,
        { requiresAdminAuth: false },
      );

      navigate(
        `/landing/order/result?order=${encodeURIComponent(response.data.orderNumber)}`,
      );
    } catch (requestError) {
      setError(extractApiError(requestError, 'Sipariş oluşturulamadı.'));
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    customerNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      customerNameRef.current?.focus({ preventScroll: true });
    }, 350);
  };

  const selectPackageAndScrollToForm = (packageId: string) => {
    setSelectedPackageId(packageId);
    scrollToForm();
  };

  const selectPaymentMethod = (option: LandingPaymentOption) => {
    setPaymentMethod(option);

    if (option !== 'PAYTR') {
      setPaytrSession(null);
      setError('');
      return;
    }

    void openPaytrCheckout();
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
              <h1 className="landing-section-title">{fixTurkishText(page.config.announcementTitle)}</h1>
              <p className="landing-section-subtitle">{fixTurkishText(page.config.announcementSubtitle)}</p>

              <div className="landing-progress-steps" aria-label="Sipariş adımları">
                {page.config.stepLabels.map((label, index) => (
                  <span
                    key={label}
                    className={activeStep >= index + 1 ? 'landing-progress-step active' : 'landing-progress-step'}
                  >
                    {fixTurkishText(label)}
                  </span>
                ))}
              </div>

              <div className="landing-stats-bar">
                <div className="landing-stat-item">
                  <span className="landing-stat-count">{page.config.visitorCount}</span>{' '}
                  {fixTurkishText(page.config.visitorLabel)}
                </div>
                <div className="landing-stat-item">
                  <span>Son </span>
                  <span className="landing-stat-count">{page.config.stockCount}</span>{' '}
                  {fixTurkishText(page.config.stockLabel)}
                </div>
              </div>

              <h2 className="landing-package-title">{fixTurkishText(page.config.packageSectionTitle)}</h2>

              <div className="landing-package-list">
                {page.config.packages.map((item) => (
                  <button
                    key={item.id}
                    className={
                      item.id === selectedPackageId
                        ? 'landing-package-item selected'
                        : 'landing-package-item'
                    }
                    onClick={() => selectPackageAndScrollToForm(item.id)}
                    type="button"
                  >
                    <span className="landing-package-tick">
                      {item.id === selectedPackageId ? '✓' : ''}
                    </span>

                    <div className="landing-package-info">
                      <h4>{fixTurkishText(item.title)}</h4>
                      {item.subtitle ? <p>{fixTurkishText(item.subtitle)}</p> : null}
                      <div className="landing-package-tags">
                        {item.note ? <span className="landing-package-note">{fixTurkishText(item.note)}</span> : null}
                        <span className="landing-package-shipping">Kargo Ücretsiz</span>
                      </div>
                    </div>

                    <div className="landing-package-price">
                      <div className="landing-package-old">{formatCurrency(item.originalPrice)}</div>
                      <div className="landing-package-current">{formatCurrency(item.price)}</div>
                      {item.highlight ? (
                        <span className="landing-package-badge">{fixTurkishText(item.highlight)}</span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>

              {successOrder ? (
                <div className="landing-success-box">
                  <strong>Siparişiniz alındı.</strong>
                  <div>Sipariş numaranız: {successOrder.orderNumber}</div>
                </div>
              ) : null}

              {error ? <div className="landing-error-box">{error}</div> : null}

              <div className="landing-form-step contact-focus-box">
                <h2 className="landing-package-title">{fixTurkishText(page.config.orderSectionTitle)}</h2>

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
                      placeholder="Adınız soyadınız"
                      ref={customerNameRef}
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
                      placeholder="Telefon numaranız"
                      type="tel"
                      value={customerPhone}
                    />
                  </div>
                </div>

                <div className="landing-address-group">
                  <label htmlFor="landing-address">
                    {fixTurkishText(page.config.addressPlaceholder)} <span className="landing-optional-label">Opsiyonel</span>
                  </label>
                  <textarea
                    autoComplete="street-address"
                    id="landing-address"
                    className="landing-textarea"
                    enterKeyHint="done"
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder={fixTurkishText(page.config.addressPlaceholder)}
                    value={address}
                  />
                </div>

                <div className="landing-address-group">
                  <label>{fixTurkishText(page.config.paymentSectionTitle)}</label>
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
                          onChange={() => selectPaymentMethod(option.value)}
                          type="radio"
                          value={option.value}
                        />
                        <span className="landing-payment-tick">
                          {option.value === paymentMethod ? '✓' : ''}
                        </span>
                        <span>{option.label}</span>
                      </label>
                    ))}
                    {paymentMethod === 'PAYTR' ? (
                      <div className="landing-paytr-panel" ref={paytrFrameRef}>
                        {paytrLoading ? (
                          <div className="landing-paytr-placeholder">PAYTR ödeme formu hazırlanıyor...</div>
                        ) : paytrSession ? (
                          previewMode ? (
                            <div className="landing-paytr-placeholder">
                              Önizleme modunda PAYTR ödeme formu oluşturulmaz.
                            </div>
                          ) : (
                            <>
                              <div className="landing-paytr-header">
                                <strong>Güvenli kart ödemesi</strong>
                                <a href={paytrSession.iframeUrl} target="_blank" rel="noreferrer">
                                  Yeni sekmede aç
                                </a>
                              </div>
                              <iframe
                                className="landing-paytr-iframe"
                                src={paytrSession.iframeUrl}
                                title="PAYTR güvenli ödeme"
                              />
                            </>
                          )
                        ) : (
                          <div className="landing-paytr-placeholder">
                            Ödeme formunu açmak için ad soyad ve telefon bilgilerini doldurun.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {selectedPackage ? (
                  <div className="landing-summary">
                    <div className="landing-summary-row">
                      <span>Seçtiğin paket:</span>
                      <strong>{fixTurkishText(selectedPackage.title)}</strong>
                    </div>
                    <div className="landing-summary-row">
                      <span>Kargo:</span>
                      <strong>Ücretsiz</strong>
                    </div>
                    <div className="landing-summary-row landing-summary-total">
                      <span>Ödenecek tutar:</span>
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
                  {submitting ? 'İşleniyor...' : fixTurkishText(page.config.orderButtonLabel)}
                </button>

                <label className="landing-terms">
                  <input
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.target.checked)}
                    type="checkbox"
                  />
                  <span>{fixTurkishText(page.config.termsLabel)}</span>
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
                      aria-label="Sipariş formuna git"
                      onClick={scrollToForm}
                      type="button"
                    >
                      <img
                        alt={`${page.name} görsel ${index + 1}`}
                        decoding="async"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        src={item}
                      />
                    </button>
                  ))
                ) : (
                  <div className="landing-gallery-empty">
                    Bu landing page için henüz görsel eklenmedi.
                  </div>
                )}
              </div>

              <button className="landing-info-cta" onClick={scrollToForm} type="button">
                Sipariş Formuna Git
              </button>
            </div>
          </aside>
        </div>

        {false ? (
        <>
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
        </>
        ) : null}

        <footer className="landing-footer">
          <div className="landing-footer-links">
                {page.config.footerLinks.map((item) => (
                  <a href={item.href} key={item.id} target={item.href.startsWith('http') ? '_blank' : undefined}>
                {fixTurkishText(item.label)}
              </a>
            ))}
          </div>
          <div>
            {fixTurkishText(page.config.footerSellerText)} {fixTurkishText(page.name)}
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
