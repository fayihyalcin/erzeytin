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

export function createDefaultLandingPackage(name = 'Tekli Urun'): LandingPagePackage {
  return {
    id: createLandingId(),
    title: `1 Adet ${name}`,
    subtitle: 'Kisa paket aciklamasi',
    note: 'Standart paket',
    badge: 'One Cikan',
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
    title: 'One Cikan Ozellikler',
    items: ['Ozellik 1', 'Ozellik 2', 'Ozellik 3'],
  };
}

export function createDefaultLandingFaqItem(): LandingPageFaqItem {
  return {
    id: createLandingId(),
    question: 'Urunle ilgili sik gelen soru',
    answer: 'Bu alandan cevabi duzenleyebilirsiniz.',
  };
}

export function createDefaultLandingReview(): LandingPageReview {
  return {
    id: createLandingId(),
    name: 'Ayse K.',
    initials: 'A',
    rating: 5,
    comment: 'Cok hizli kargo, tesekkurler!',
  };
}

export function createDefaultLandingFooterLink(label: string, href = '#'): LandingPageFooterLink {
  return {
    id: createLandingId(),
    label,
    href,
  };
}

export function createDefaultLandingConfig(name = 'Tekli Urun'): LandingPageConfig {
  return {
    announcementTitle: 'Hizli Siparis',
    announcementSubtitle: '1-3 gunde kapinda, guvenli alisveris',
    stepLabels: ['1. Paket', '2. Bilgiler', '3. Odeme'],
    visitorCount: 47,
    visitorLabel: 'kisi',
    stockCount: 29,
    stockLabel: 'Son urun',
    packageSectionTitle: 'Kac tane alacaksin? (Adet sec)',
    orderSectionTitle: 'Siparis Formu',
    addressPlaceholder: 'Adres (Mahalle, sokak, ilce, il)',
    paymentSectionTitle: 'Nasil odeyeceksin?',
    orderButtonLabel: 'Siparisi Onayla',
    stickyButtonLabel: 'Siparisi Onayla',
    termsLabel: "Sozlesme ve Gizlilik'i okudum.",
    productInfoTitle: `${name} Urun Bilgileri`,
    productInfoDescription:
      'Urun detaylari, ozellikler, sik sorulanlar ve musteri yorumlarini bu alanda yonetin.',
    trustBadges: ['Hizli Teslimat', 'Kalite Garantisi', 'Kapida Odeme', 'Kolay Iade'],
    infoCards: [createDefaultLandingInfoCard()],
    faqTitle: 'Sik Sorulanlar',
    faqItems: [createDefaultLandingFaqItem()],
    reviewsTitle: 'Musteri Yorumlari',
    reviews: [createDefaultLandingReview()],
    footerSellerText: 'Satici:',
    footerLinks: [
      createDefaultLandingFooterLink('Hakkimizda'),
      createDefaultLandingFooterLink('Sozlesme'),
      createDefaultLandingFooterLink('Odeme'),
      createDefaultLandingFooterLink('Gizlilik'),
    ],
    galleryImages: [],
    packages: [createDefaultLandingPackage(name)],
  };
}

export function createDefaultLandingPage(): Omit<LandingPage, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> {
  const name = 'Tekli Urun Kampanyasi';

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
