import type { WebsiteFooterLink, WebsiteNavItem } from '../types/api';

interface PublicProductRouteTarget {
  id: string;
  slug?: string | null;
}

const LEGACY_ROUTE_MAP: Record<string, string> = {
  '#hero': '/',
  '#categories': '/kategoriler',
  '#products': '/urunler',
  '#product-list': '/urunler',
  '#campaigns': '/kampanyalar',
  '#best-sellers': '/kampanyalar',
  '#footer': '/iletisim',
  '#contact': '/iletisim',
  '#blog': '/#blog',
};

export function normalizeStoreLabel(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveLabelRoute(label: string) {
  const normalized = normalizeStoreLabel(label);

  if (normalized.includes('kategori')) {
    return '/kategoriler';
  }
  if (normalized.includes('urun') || normalized.includes('magaza')) {
    return '/urunler';
  }
  if (normalized.includes('kampanya') || normalized.includes('firsat') || normalized.includes('uretim')) {
    return '/kampanyalar';
  }
  if (normalized.includes('iletisim')) {
    return '/iletisim';
  }
  if (normalized.includes('yazi') || normalized.includes('blog')) {
    return '/#blog';
  }
  if (
    normalized.includes('kvkk') ||
    normalized.includes('gizlilik') ||
    normalized.includes('satis') ||
    normalized.includes('iade') ||
    normalized.includes('teslimat') ||
    normalized.includes('kargo')
  ) {
    return normalized.includes('kvkk')
      ? '/kvkk'
      : normalized.includes('gizlilik') || normalized.includes('sikca')
        ? '/gizlilik'
        : '/satis-sozlesmesi';
  }
  if (
    normalized.includes('hesabim') ||
    normalized.includes('siparis') ||
    normalized.includes('adres') ||
    normalized.includes('favori')
  ) {
    return '/customer/dashboard';
  }

  return '/';
}

export function resolveStoreHref(href: string, label = '') {
  const value = href.trim();
  if (!value || value === '#') {
    return resolveLabelRoute(label);
  }

  if (LEGACY_ROUTE_MAP[value]) {
    return LEGACY_ROUTE_MAP[value];
  }

  return value;
}

export function resolveStoreNavItemHref(item: WebsiteNavItem) {
  return resolveStoreHref(item.href, item.label);
}

export function resolveStoreFooterHref(link: WebsiteFooterLink | string) {
  if (typeof link === 'string') {
    return resolveStoreHref('', link);
  }

  return resolveStoreHref(link.href || '', link.label);
}

export function isInternalRoute(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

export function isActiveStoreHref(currentPath: string, href: string) {
  const normalized = resolveStoreHref(href).split('#')[0] || '/';
  if (normalized === '/') {
    return currentPath === '/';
  }

  return currentPath === normalized;
}

export function resolvePublicProductPath(product: PublicProductRouteTarget) {
  const slug = product.slug?.trim();
  if (slug) {
    return `/urun/${encodeURIComponent(slug)}`;
  }

  return `/product/${product.id}`;
}

export function resolvePublicCategoryFilterPath(slug?: string | null) {
  if (!slug?.trim()) {
    return '/urunler';
  }

  return `/urunler?kategori=${encodeURIComponent(slug.trim())}`;
}
