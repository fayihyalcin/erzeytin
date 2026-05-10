import type {
  LandingPage,
  LandingPageConfig,
  LandingPageFaqItem,
  LandingPageFooterLink,
  LandingPageInfoCard,
  LandingPagePackage,
  LandingPageReview,
} from '../types/api';
import { resolveMediaAssetUrl } from './media-library';

function createLandingId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `landing-${Math.random().toString(36).slice(2, 10)}`;
}

export function slugifyLandingPage(value: string) {
  const transliterated = value
    .replace(/[Çç]/g, 'c')
    .replace(/[Ğğ]/g, 'g')
    .replace(/[İIıi]/g, 'i')
    .replace(/[Öö]/g, 'o')
    .replace(/[Şş]/g, 's')
    .replace(/[Üü]/g, 'u');

  const slug = transliterated
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'landing-page';
}

export function resolveLandingPagePath(slug: string) {
  return `/landing/${slug}`;
}

export function buildLandingGalleryImages(
  featuredImage?: string | null,
  galleryImages: string[] = [],
) {
  const images = [featuredImage ?? '', ...galleryImages]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => resolveMediaAssetUrl(item));

  return Array.from(new Set(images));
}

export function createDefaultLandingPackage(name = 'Tekli Ürün'): LandingPagePackage {
  return {
    id: createLandingId(),
    title: `1 Adet ${name}`,
    subtitle: 'Kısa paket açıklaması',
    note: 'Standart paket',
    badge: 'Öne Çıkan',
    originalPrice: 1999,
    price: 1499,
    quantity: 1,
    highlight: 'Avantajli fiyat',
    isDefault: true,
  };
}

export function createDefaultLandingInfoCard(): LandingPageInfoCard {
  return {
    id: createLandingId(),
    icon: '✓',
    title: 'Öne Çıkan Ozellikler',
    items: ['Özellik 1', 'Özellik 2', 'Özellik 3'],
  };
}

export function createDefaultLandingFaqItem(): LandingPageFaqItem {
  return {
    id: createLandingId(),
    question: 'Ürünle ilgili sık gelen soru',
    answer: 'Bu alandan cevabı düzenleyebilirsiniz.',
  };
}

export function createDefaultLandingReview(): LandingPageReview {
  return {
    id: createLandingId(),
    name: 'Ayşe K.',
    initials: 'A',
    rating: 5,
    comment: 'Çok hızlı kargo, teşekkürler!',
  };
}

export function createDefaultLandingFooterLink(label: string, href = '#'): LandingPageFooterLink {
  return {
    id: createLandingId(),
    label,
    href,
  };
}

export function createDefaultLandingConfig(name = 'Tekli Ürün'): LandingPageConfig {
  return {
    announcementTitle: 'Hızlı Sipariş',
    announcementSubtitle: '1-3 günde kapında, güvenli alışveriş',
    stepLabels: ['1. Paket', '2. Bilgiler', '3. Ödeme'],
    visitorCount: 47,
    visitorLabel: 'kişi',
    stockCount: 29,
    stockLabel: 'Son ürün',
    packageSectionTitle: 'Kaç tane alacaksın? (Adet seç)',
    orderSectionTitle: 'Sipariş Formu',
    addressPlaceholder: 'Adres (Mahalle, sokak, ilçe, il)',
    paymentSectionTitle: 'Nasıl ödeyeceksin?',
    orderButtonLabel: 'Siparişi Onayla',
    stickyButtonLabel: 'Siparişi Onayla',
    termsLabel: "Sözleşme ve Gizlilik'i okudum.",
    productInfoTitle: `${name} Ürün Bilgileri`,
    productInfoDescription:
      'Ürün detayları, özellikler, sık sorulanlar ve müşteri yorumlarını bu alanda yönetin.',
    trustBadges: ['Hizli Teslimat', 'Kalite Garantisi', 'Kapıda Ödeme', 'Kolay Iade'],
    infoCards: [createDefaultLandingInfoCard()],
    faqTitle: 'Sik Sorulanlar',
    faqItems: [createDefaultLandingFaqItem()],
    reviewsTitle: 'Müşteri Yorumları',
    reviews: [createDefaultLandingReview()],
    footerSellerText: 'Satıcı:',
    footerLinks: [
      createDefaultLandingFooterLink('Hakkımızda'),
      createDefaultLandingFooterLink('Sözleşme'),
      createDefaultLandingFooterLink('Ödeme'),
      createDefaultLandingFooterLink('Gizlilik'),
    ],
    galleryImages: [],
    packages: [createDefaultLandingPackage(name)],
  };
}

export function createDefaultLandingPage(): Omit<LandingPage, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> {
  const name = 'Tekli Ürün Kampanyası';

  return {
    name,
    slug: slugifyLandingPage(name),
    status: 'DRAFT',
    featuredImage: null,
    seoTitle: null,
    seoDescription: null,
    config: createDefaultLandingConfig(name),
  };
}
