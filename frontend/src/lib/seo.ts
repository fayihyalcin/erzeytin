import { useEffect } from 'react';

type JsonLdEntry = Record<string, unknown>;

export interface SeoConfig {
  title: string;
  description: string;
  canonicalUrl?: string;
  imageUrl?: string;
  keywords?: string[];
  robots?: string;
  siteName?: string;
  type?: 'website' | 'article' | 'product';
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

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

export function useSeo(config: SeoConfig) {
  useEffect(() => {
    const normalizedKeywords = (config.keywords ?? [])
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const robots = config.robots?.trim() || 'index,follow,max-image-preview:large';
    const type = config.type ?? 'website';
    const siteName = config.siteName?.trim() || 'Er Zeytincilik';

    document.documentElement.setAttribute('lang', 'tr');
    document.title = config.title.trim();

    upsertMetaByName('description', config.description.trim());
    upsertMetaByName('robots', robots);
    upsertMetaByName('twitter:card', config.imageUrl ? 'summary_large_image' : 'summary');
    upsertMetaByName('twitter:title', config.title.trim());
    upsertMetaByName('twitter:description', config.description.trim());
    upsertMetaByProperty('og:title', config.title.trim());
    upsertMetaByProperty('og:description', config.description.trim());
    upsertMetaByProperty('og:type', type);
    upsertMetaByProperty('og:locale', 'tr_TR');
    upsertMetaByProperty('og:site_name', siteName);

    upsertMetaByName('keywords', normalizedKeywords.join(', '));

    if (config.canonicalUrl?.trim()) {
      upsertLink('canonical', config.canonicalUrl.trim());
      upsertMetaByProperty('og:url', config.canonicalUrl.trim());
    }

    upsertMetaByName('twitter:image', config.imageUrl?.trim() || '');
    upsertMetaByProperty('og:image', config.imageUrl?.trim() || '');

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
