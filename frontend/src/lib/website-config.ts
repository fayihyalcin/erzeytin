import type {
  WebsiteConfig,
  WebsiteFeatureItem,
  WebsiteFooterColumn,
  WebsiteHeroSlide,
  WebsiteNavItem,
  WebsitePromoCard,
  WebsiteThemeConfig,
} from '../types/api';

const DEFAULT_THEME: WebsiteThemeConfig = {
  brandName: 'Er Zeytin',
  tagline: 'Egeden Sofrana Dogal Lezzet',
  adminButtonLabel: 'Admin Giris',
};

const DEFAULT_NAV_ITEMS: WebsiteNavItem[] = [
  { label: 'Ana Sayfa', href: '#hero' },
  { label: 'Hakkimizda', href: '#footer' },
  { label: 'Magaza', href: '#products' },
  { label: 'Saticilar', href: '#products' },
  { label: 'Kategoriler', href: '#categories' },
  { label: 'Blog', href: '#campaigns' },
  { label: 'Kampanyalar', href: '#campaigns' },
  { label: 'Iletisim', href: '#footer' },
];

const DEFAULT_HERO_SLIDES: WebsiteHeroSlide[] = [
  {
    badge: 'Yeni Hasat',
    title: 'Ayvalik Erken Hasat Sizma Zeytinyagi',
    subtitle: 'Tas degirmen, soguk sikim, yuksek polifenol',
    description:
      'Aromasi guclu, meyvemsiligi yuksek premium sizma serimizi bugun kesfedin.',
    ctaLabel: 'Shop Now',
    ctaHref: '#products',
    imageUrl:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1600&q=80',
  },
  {
    badge: 'Yoresel Secki',
    title: 'Gemlik Siyah Zeytin Koleksiyonu',
    subtitle: 'Dogal fermantasyon, iri tane secimi',
    description:
      'Kahvaltilik ve mezelik seceneklerde sofraniza uygun taze urunleri secin.',
    ctaLabel: 'Shop Now',
    ctaHref: '#products',
    imageUrl:
      'https://images.unsplash.com/photo-1593001874117-c99c800e3eb5?auto=format&fit=crop&w=1600&q=80',
  },
  {
    badge: 'Butik Seri',
    title: 'Kirilmis Yesil Zeytin ve Gurme Paketler',
    subtitle: 'Limonlu, kekikli ve aci biberli secenekler',
    description:
      'Atistirmalik ve servislik paketlerle zeytin lezzetini her ana tasiyin.',
    ctaLabel: 'Shop Now',
    ctaHref: '#products',
    imageUrl:
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1600&q=80',
  },
];

const DEFAULT_PROMO_CARDS: WebsitePromoCard[] = [
  {
    title: 'Erken Hasat Serisinde 3 Al 2 Ode',
    subtitle: '500 ml ve 750 ml cam sise urunlerinde gecerli kampanya',
    ctaLabel: 'Shop Now',
    ctaHref: '#products',
    imageUrl:
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Kahvaltilik Zeytin Paketleri',
    subtitle: 'Aile boyu siyah ve yesil zeytin paketlerinde haftalik indirim',
    ctaLabel: 'Shop Now',
    ctaHref: '#footer',
    imageUrl:
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=1400&q=80',
  },
  {
    title: 'Kurumsal Tedarik ve Hediye Kutulari',
    subtitle: 'Restoranlar, oteller ve kurumsal firmalar icin ozel fiyatlandirma',
    ctaLabel: 'Teklif Al',
    ctaHref: '#footer',
    imageUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1400&q=80',
  },
];

const DEFAULT_FEATURE_ITEMS: WebsiteFeatureItem[] = [
  {
    icon: 'truck',
    title: 'Hizli Kargo',
    description: 'Saat 14:00e kadar verilen siparisler ayni gun kargoda.',
  },
  {
    icon: 'leaf',
    title: 'Dogal Uretim',
    description: 'Katkisiz, filtreli veya filtresiz naturel sizma secenekleri.',
  },
  {
    icon: 'shield',
    title: 'Guvenli Odeme',
    description: '3D secure destekli guvenli online odeme altyapisi.',
  },
  {
    icon: 'gift',
    title: 'Hediye Paketi',
    description: 'Ozel kutu ve not karti ile gonderim secenekleri.',
  },
];

const DEFAULT_FOOTER_COLUMNS: WebsiteFooterColumn[] = [
  {
    title: 'Kurumsal',
    links: ['Hakkimizda', 'Uretim Sureci', 'Sertifikalar', 'Iletisim'],
  },
  {
    title: 'Musteri Hizmetleri',
    links: ['Sikca Sorulan Sorular', 'Kargo ve Teslimat', 'Iade Politikasi'],
  },
  {
    title: 'Hesabim',
    links: ['Siparislerim', 'Favorilerim', 'Adres Bilgilerim'],
  },
];

export function createDefaultWebsiteConfig(): WebsiteConfig {
  return {
    theme: { ...DEFAULT_THEME },
    announcement: 'Yeni hasat soguk sikim zeytinyaglari ve secili zeytin serileri stokta.',
    navItems: DEFAULT_NAV_ITEMS.map((item) => ({ ...item })),
    heroSlides: DEFAULT_HERO_SLIDES.map((slide) => ({ ...slide })),
    promoCards: DEFAULT_PROMO_CARDS.map((card) => ({ ...card })),
    featureItems: DEFAULT_FEATURE_ITEMS.map((item) => ({ ...item })),
    newsletterTitle: 'Lezzet Bultenine Katilin',
    newsletterDescription:
      'Indirimler, yeni hasat duyurulari ve zeytinyagli tarifler e-posta kutunuza gelsin.',
    footerColumns: DEFAULT_FOOTER_COLUMNS.map((column) => ({
      title: column.title,
      links: [...column.links],
    })),
  };
}

function toStringValue(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function normalizeTheme(value: unknown, fallback: WebsiteThemeConfig) {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const record = value as Partial<Record<keyof WebsiteThemeConfig, unknown>>;
  return {
    brandName: toStringValue(record.brandName, fallback.brandName),
    tagline: toStringValue(record.tagline, fallback.tagline),
    adminButtonLabel: toStringValue(
      record.adminButtonLabel,
      fallback.adminButtonLabel,
    ),
  };
}

function normalizeNavItems(value: unknown, fallback: WebsiteNavItem[]) {
  if (!Array.isArray(value)) {
    return fallback.map((item) => ({ ...item }));
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteNavItem, unknown>>;
      const label = toStringValue(record.label);
      const href = toStringValue(record.href);
      if (!label || !href) {
        return null;
      }

      return { label, href };
    })
    .filter((item): item is WebsiteNavItem => item !== null);

  return items.length > 0 ? items : fallback.map((item) => ({ ...item }));
}

function normalizeHeroSlides(value: unknown, fallback: WebsiteHeroSlide[]) {
  if (!Array.isArray(value)) {
    return fallback.map((slide) => ({ ...slide }));
  }

  const slides = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteHeroSlide, unknown>>;
      const title = toStringValue(record.title);
      const imageUrl = toStringValue(record.imageUrl);
      if (!title || !imageUrl) {
        return null;
      }

      return {
        badge: toStringValue(record.badge),
        title,
        subtitle: toStringValue(record.subtitle),
        description: toStringValue(record.description),
        ctaLabel: toStringValue(record.ctaLabel, 'Urunleri Kesfet'),
        ctaHref: toStringValue(record.ctaHref, '#products'),
        imageUrl,
      };
    })
    .filter((item): item is WebsiteHeroSlide => item !== null);

  return slides.length > 0 ? slides : fallback.map((slide) => ({ ...slide }));
}

function normalizePromoCards(value: unknown, fallback: WebsitePromoCard[]) {
  if (!Array.isArray(value)) {
    return fallback.map((card) => ({ ...card }));
  }

  const cards = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsitePromoCard, unknown>>;
      const title = toStringValue(record.title);
      const imageUrl = toStringValue(record.imageUrl);
      if (!title || !imageUrl) {
        return null;
      }

      return {
        title,
        subtitle: toStringValue(record.subtitle),
        ctaLabel: toStringValue(record.ctaLabel, 'Detayi Gor'),
        ctaHref: toStringValue(record.ctaHref, '#products'),
        imageUrl,
      };
    })
    .filter((item): item is WebsitePromoCard => item !== null);

  return cards.length > 0 ? cards : fallback.map((card) => ({ ...card }));
}

function normalizeFeatureItems(value: unknown, fallback: WebsiteFeatureItem[]) {
  if (!Array.isArray(value)) {
    return fallback.map((item) => ({ ...item }));
  }

  const items = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteFeatureItem, unknown>>;
      const title = toStringValue(record.title);
      if (!title) {
        return null;
      }

      return {
        icon: toStringValue(record.icon, 'leaf'),
        title,
        description: toStringValue(record.description),
      };
    })
    .filter((item): item is WebsiteFeatureItem => item !== null);

  return items.length > 0 ? items : fallback.map((item) => ({ ...item }));
}

function normalizeFooterColumns(value: unknown, fallback: WebsiteFooterColumn[]) {
  if (!Array.isArray(value)) {
    return fallback.map((column) => ({
      title: column.title,
      links: [...column.links],
    }));
  }

  const columns = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Partial<Record<keyof WebsiteFooterColumn, unknown>>;
      const title = toStringValue(record.title);
      if (!title) {
        return null;
      }

      const links = Array.isArray(record.links)
        ? record.links
            .map((link) => toStringValue(link))
            .filter((link) => link.length > 0)
        : [];

      return {
        title,
        links,
      };
    })
    .filter((item): item is WebsiteFooterColumn => item !== null);

  return columns.length > 0
    ? columns
    : fallback.map((column) => ({
        title: column.title,
        links: [...column.links],
      }));
}

export function parseWebsiteConfig(raw?: string | null): WebsiteConfig {
  const fallback = createDefaultWebsiteConfig();

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebsiteConfig>;

    return {
      theme: normalizeTheme(parsed.theme, fallback.theme),
      announcement: toStringValue(parsed.announcement, fallback.announcement),
      navItems: normalizeNavItems(parsed.navItems, fallback.navItems),
      heroSlides: normalizeHeroSlides(parsed.heroSlides, fallback.heroSlides),
      promoCards: normalizePromoCards(parsed.promoCards, fallback.promoCards),
      featureItems: normalizeFeatureItems(
        parsed.featureItems,
        fallback.featureItems,
      ),
      newsletterTitle: toStringValue(
        parsed.newsletterTitle,
        fallback.newsletterTitle,
      ),
      newsletterDescription: toStringValue(
        parsed.newsletterDescription,
        fallback.newsletterDescription,
      ),
      footerColumns: normalizeFooterColumns(
        parsed.footerColumns,
        fallback.footerColumns,
      ),
    };
  } catch {
    return fallback;
  }
}
