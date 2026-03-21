import type { BlogPost, Product } from '../types/api';

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

interface OrganizationSchemaInput {
  siteUrl?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface WebsiteSchemaInput {
  siteUrl?: string | null;
  name: string;
  description: string;
}

interface WebPageSchemaInput {
  siteUrl?: string | null;
  path: string;
  title: string;
  description: string;
}

interface CollectionSchemaInput {
  siteUrl?: string | null;
  path: string;
  name: string;
  description: string;
  items: Array<{ name: string; path: string }>;
}

interface ProductSchemaInput {
  siteUrl?: string | null;
  path: string;
  product: Product;
  brandName: string;
  description: string;
  currency: string;
  imageUrls: string[];
}

interface ArticleSchemaInput {
  siteUrl?: string | null;
  path: string;
  post: BlogPost;
  brandName: string;
  description: string;
  imageUrl?: string | null;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function stripHtml(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return normalizeWhitespace(value.replace(/<[^>]+>/g, ' '));
}

export function summarizeText(value: string | null | undefined, maxLength = 160) {
  const normalized = stripHtml(value);
  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, Math.max(0, maxLength - 3));
  const lastWhitespace = sliced.lastIndexOf(' ');
  const safeValue = lastWhitespace > 40 ? sliced.slice(0, lastWhitespace) : sliced;
  return `${safeValue.trim()}...`;
}

export function resolveSiteOrigin(siteUrl?: string | null) {
  if (siteUrl?.trim()) {
    try {
      return new URL(siteUrl.trim()).origin.replace(/\/+$/, '');
    } catch {
      return siteUrl.trim().replace(/\/+$/, '');
    }
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return 'http://localhost:5173';
}

export function toAbsoluteSiteUrl(siteUrl: string | null | undefined, path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = resolveSiteOrigin(siteUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, `${origin}/`).toString();
}

export function buildPageTitle(pageTitle: string, brandName?: string | null) {
  const normalizedPageTitle = normalizeWhitespace(pageTitle);
  const normalizedBrandName = normalizeWhitespace(brandName ?? '');

  if (!normalizedBrandName) {
    return normalizedPageTitle;
  }

  if (normalizedPageTitle.toLocaleLowerCase('tr-TR').includes(normalizedBrandName.toLocaleLowerCase('tr-TR'))) {
    return summarizeText(normalizedPageTitle, 68);
  }

  return summarizeText(`${normalizedPageTitle} | ${normalizedBrandName}`, 68);
}

export function buildBreadcrumbSchema(
  siteUrl: string | null | undefined,
  items: BreadcrumbEntry[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteSiteUrl(siteUrl, item.path),
    })),
  };
}

export function buildOrganizationSchema(input: OrganizationSchemaInput) {
  const url = toAbsoluteSiteUrl(input.siteUrl, '/');

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url,
    email: input.email || undefined,
    telephone: input.phone || undefined,
  };
}

export function buildWebsiteSchema(input: WebsiteSchemaInput) {
  const url = toAbsoluteSiteUrl(input.siteUrl, '/');

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    description: input.description,
    url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url.replace(/\/+$/, '')}/urunler?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildWebPageSchema(input: WebPageSchemaInput) {
  const url = toAbsoluteSiteUrl(input.siteUrl, input.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.title,
    description: input.description,
    url,
  };
}

export function buildCollectionSchema(input: CollectionSchemaInput) {
  const url = toAbsoluteSiteUrl(input.siteUrl, input.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: toAbsoluteSiteUrl(input.siteUrl, item.path),
      })),
    },
  };
}

export function buildProductSchema(input: ProductSchemaInput) {
  const url = toAbsoluteSiteUrl(input.siteUrl, input.path);
  const availability = input.product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const numericPrice = Number(input.product.price ?? 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.product.name,
    description: input.description,
    sku: input.product.sku,
    mpn: input.product.barcode ?? undefined,
    category: input.product.category?.name ?? undefined,
    brand: {
      '@type': 'Brand',
      name: input.product.brand || input.brandName,
    },
    image: input.imageUrls,
    url,
    keywords: input.product.seoKeywords,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: input.currency,
      price: Number.isFinite(numericPrice) ? numericPrice.toFixed(2) : '0.00',
      availability,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function buildArticleSchema(input: ArticleSchemaInput) {
  const url = toAbsoluteSiteUrl(input.siteUrl, input.path);
  const publishedAt = input.post.publishedAt ?? input.post.updatedAt;
  const keywords = input.post.seoKeywords && input.post.seoKeywords.length > 0
    ? input.post.seoKeywords
    : input.post.tags;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.post.title,
    description: input.description,
    image: input.imageUrl ? [input.imageUrl] : undefined,
    datePublished: publishedAt,
    dateModified: input.post.updatedAt,
    articleSection: input.post.category,
    keywords,
    author: {
      '@type': 'Organization',
      name: input.brandName,
    },
    publisher: {
      '@type': 'Organization',
      name: input.brandName,
    },
    mainEntityOfPage: url,
    url,
  };
}
