import { useEffect } from 'react';

type JsonLdEntry = Record<string, unknown>;

export interface SeoConfig {
  title: string;
  description: string;
  canonicalUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  keywords?: string[];
  robots?: string;
  siteName?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  productPrice?: string | number;
  productCurrency?: string;
  productAvailability?: string;
  jsonLd?: JsonLdEntry | JsonLdEntry[];
}

function upsertMetaByName(name: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function removeMetaByName(name: string) {
  document.head.querySelector(`meta[name="${name}"]`)?.remove();
}

function removeMetaByProperty(property: string) {
  document.head.querySelector(`meta[property="${property}"]`)?.remove();
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

function removeLink(rel: string) {
  document.head.querySelector(`link[rel="${rel}"]`)?.remove();
}

function setOrRemoveMetaByName(name: string, content?: string | null) {
  const normalized = content?.trim();
  if (!normalized) {
    removeMetaByName(name);
    return;
  }

  upsertMetaByName(name, normalized);
}

function setOrRemoveMetaByProperty(property: string, content?: string | null) {
  const normalized = content?.trim();
  if (!normalized) {
    removeMetaByProperty(property);
    return;
  }

  upsertMetaByProperty(property, normalized);
}

export function useSeo(config: SeoConfig) {
  useEffect(() => {
    const normalizedKeywords = (config.keywords ?? [])
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const robots = config.robots?.trim() || 'index,follow,max-image-preview:large';
    const type = config.type ?? 'website';
    const siteName = config.siteName?.trim() || 'Er Zeytincilik';
    const imageUrl = config.imageUrl?.trim() || '';
    const imageAlt = config.imageAlt?.trim() || config.title.trim();

    document.documentElement.setAttribute('lang', 'tr');
    document.title = config.title.trim();

    upsertMetaByName('description', config.description.trim());
    upsertMetaByName('robots', robots);
    upsertMetaByName('googlebot', robots);
    upsertMetaByName('referrer', 'strict-origin-when-cross-origin');
    upsertMetaByName('application-name', siteName);
    upsertMetaByName('apple-mobile-web-app-title', siteName);
    upsertMetaByName('apple-mobile-web-app-capable', 'yes');
    upsertMetaByName('mobile-web-app-capable', 'yes');
    upsertMetaByName('theme-color', '#1f5b2c');
    setOrRemoveMetaByName('author', config.author?.trim() || siteName);
    setOrRemoveMetaByName('keywords', normalizedKeywords.join(', '));
    upsertMetaByName('twitter:card', imageUrl ? 'summary_large_image' : 'summary');
    upsertMetaByName('twitter:title', config.title.trim());
    upsertMetaByName('twitter:description', config.description.trim());
    setOrRemoveMetaByName('twitter:image', imageUrl);
    setOrRemoveMetaByName('twitter:image:alt', imageUrl ? imageAlt : '');

    upsertMetaByProperty('og:title', config.title.trim());
    upsertMetaByProperty('og:description', config.description.trim());
    upsertMetaByProperty('og:type', type);
    upsertMetaByProperty('og:locale', 'tr_TR');
    upsertMetaByProperty('og:site_name', siteName);
    setOrRemoveMetaByProperty('og:image', imageUrl);
    setOrRemoveMetaByProperty('og:image:alt', imageUrl ? imageAlt : '');
    setOrRemoveMetaByProperty('og:image:secure_url', imageUrl);

    if (config.canonicalUrl?.trim()) {
      upsertLink('canonical', config.canonicalUrl.trim());
      upsertMetaByProperty('og:url', config.canonicalUrl.trim());
    } else {
      removeLink('canonical');
      removeMetaByProperty('og:url');
    }

    setOrRemoveMetaByProperty('article:published_time', config.publishedTime);
    setOrRemoveMetaByProperty('article:modified_time', config.modifiedTime);
    setOrRemoveMetaByProperty('article:section', config.section);
    setOrRemoveMetaByProperty('og:updated_time', config.modifiedTime);
    setOrRemoveMetaByProperty(
      'product:price:amount',
      config.productPrice !== undefined ? String(config.productPrice) : '',
    );
    setOrRemoveMetaByProperty('product:price:currency', config.productCurrency);
    setOrRemoveMetaByProperty('product:availability', config.productAvailability);

    const existingJsonLd = document.head.querySelectorAll<HTMLScriptElement>(
      'script[data-codex-seo-jsonld="true"]',
    );
    existingJsonLd.forEach((entry) => entry.remove());

    const jsonLdEntries = Array.isArray(config.jsonLd)
      ? config.jsonLd
      : config.jsonLd
        ? [config.jsonLd]
        : [];

    jsonLdEntries.forEach((entry) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.codexSeoJsonld = 'true';
      script.text = JSON.stringify(entry);
      document.head.appendChild(script);
    });
  }, [config]);
}
