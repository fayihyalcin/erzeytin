import type { Order, PublicSettingsDto } from '../types/api';

const TRACKING_STORAGE_KEY = 'zeytin-public-tracking-v1';
const MAX_TRACKING_PARAM_COUNT = 24;
const MAX_TRACKING_VALUE_LENGTH = 255;

const ALLOWED_TRACKING_PARAM_KEYS = new Set([
  'fbclid',
  'ttclid',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'utm_id',
  'campaign_id',
  'campaignid',
  'ad_id',
  'adid',
  'adset_id',
  'adsetid',
  'adgroupid',
  'creative_id',
  'placement',
  'utm_source_platform',
]);

type StoredTrackingSnapshot = {
  entryUrl: string;
  entryPath: string;
  referrer?: string;
  capturedAt: string;
  params?: Record<string, string>;
};

type TrackingTemplateContext = Record<string, string | number | null>;

declare global {
  interface Window {
    __zeytinExecutedTrackingScripts?: Record<string, true>;
  }
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isAllowedTrackingParamKey(key: string) {
  return key.startsWith('utm_') || ALLOWED_TRACKING_PARAM_KEYS.has(key);
}

function sanitizeTrackingValue(value: string) {
  return value.trim().slice(0, MAX_TRACKING_VALUE_LENGTH);
}

function extractTrackingParams(searchParams: URLSearchParams) {
  const params: Record<string, string> = {};

  for (const [rawKey, rawValue] of searchParams.entries()) {
    const key = rawKey.trim().toLowerCase();
    if (!key || !isAllowedTrackingParamKey(key)) {
      continue;
    }

    const value = sanitizeTrackingValue(rawValue);
    if (!value) {
      continue;
    }

    params[key] = value;

    if (Object.keys(params).length >= MAX_TRACKING_PARAM_COUNT) {
      break;
    }
  }

  return params;
}

function buildTrackedUrl(url: URL, params: Record<string, string>) {
  const nextUrl = new URL(url.toString());
  nextUrl.hash = '';
  nextUrl.search = '';

  Object.entries(params).forEach(([key, value]) => {
    nextUrl.searchParams.set(key, value);
  });

  return nextUrl.toString();
}

function sanitizePathname(pathname: string) {
  return pathname.trim().slice(0, 255);
}

function sanitizeReferrer(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  try {
    const url = new URL(value);
    url.hash = '';
    return url.toString().slice(0, 512);
  } catch {
    return value.trim().slice(0, 512);
  }
}

export function readStoredTrackingSnapshot() {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredTrackingSnapshot | null;
    if (!parsed?.entryUrl || !parsed.entryPath || !parsed.capturedAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStoredTrackingSnapshot(value: StoredTrackingSnapshot) {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(value));
}

export function captureTrackingTouchpoint() {
  if (!isBrowser()) {
    return null;
  }

  const currentUrl = new URL(window.location.href);
  const params = extractTrackingParams(currentUrl.searchParams);
  const existing = readStoredTrackingSnapshot();
  const shouldReplace = !existing || Object.keys(params).length > 0;

  if (!shouldReplace && existing) {
    return existing;
  }

  const snapshot: StoredTrackingSnapshot = {
    entryUrl: buildTrackedUrl(currentUrl, params),
    entryPath: sanitizePathname(currentUrl.pathname),
    referrer: sanitizeReferrer(document.referrer),
    capturedAt: new Date().toISOString(),
    params: Object.keys(params).length > 0 ? params : undefined,
  };

  writeStoredTrackingSnapshot(snapshot);
  return snapshot;
}

export function buildOrderTrackingPayload() {
  if (!isBrowser()) {
    return undefined;
  }

  const stored = captureTrackingTouchpoint() ?? readStoredTrackingSnapshot();
  const currentUrl = new URL(window.location.href);
  const currentParams = extractTrackingParams(currentUrl.searchParams);
  const mergedParams = {
    ...(stored?.params ?? {}),
    ...currentParams,
  };

  return {
    entryUrl: stored?.entryUrl,
    entryPath: stored?.entryPath,
    currentUrl: buildTrackedUrl(currentUrl, mergedParams),
    currentPath: sanitizePathname(currentUrl.pathname),
    referrer: stored?.referrer ?? sanitizeReferrer(document.referrer),
    capturedAt: stored?.capturedAt ?? new Date().toISOString(),
    params: Object.keys(mergedParams).length > 0 ? mergedParams : undefined,
  };
}

export function shouldTrackPublicPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/kategoriler' ||
    pathname === '/urunler' ||
    pathname === '/kampanyalar' ||
    pathname === '/cart' ||
    pathname.startsWith('/blog/') ||
    pathname.startsWith('/urun/') ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/landing') ||
    pathname === '/kvkk' ||
    pathname === '/gizlilik' ||
    pathname === '/satis-sozlesmesi' ||
    pathname === '/iletisim'
  );
}

function buildTemplateReplacement(value: string | number | null) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (value === null) {
    return 'null';
  }

  return JSON.stringify(String(value));
}

function buildTrackingTemplateContext(base: Partial<TrackingTemplateContext> = {}) {
  const pageUrl = isBrowser() ? window.location.href : '';
  const pathname = isBrowser() ? window.location.pathname : '';

  return {
    PAGE_URL: pageUrl,
    PATHNAME: pathname,
    ORDER_ID: null,
    ORDER_NUMBER: null,
    VALUE: null,
    CURRENCY: null,
    PAYMENT_METHOD: null,
    SOURCE: null,
    ...base,
  } satisfies TrackingTemplateContext;
}

export function compileTrackingSnippet(
  template: string | undefined,
  context: Partial<TrackingTemplateContext> = {},
) {
  const rawTemplate = template?.trim();
  if (!rawTemplate) {
    return '';
  }

  const templateContext = buildTrackingTemplateContext(
    context,
  ) as TrackingTemplateContext;

  return rawTemplate.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_match, token: string) => {
    if (!(token in templateContext)) {
      return 'null';
    }

    return buildTemplateReplacement(templateContext[token] ?? null);
  });
}

function getExecutedTrackingRegistry(): Record<string, true> {
  if (!isBrowser()) {
    return {};
  }

  window.__zeytinExecutedTrackingScripts ??= {} as Record<string, true>;
  return window.__zeytinExecutedTrackingScripts;
}

function cloneScriptNode(source: HTMLScriptElement) {
  const target = document.createElement('script');
  Array.from(source.attributes).forEach((attribute) => {
    target.setAttribute(attribute.name, attribute.value);
  });

  target.text = source.text;
  return target;
}

export function executeTrackingSnippetOnce(
  key: string,
  template: string | undefined,
  context: Partial<TrackingTemplateContext> = {},
) {
  if (!isBrowser()) {
    return false;
  }

  const compiled = compileTrackingSnippet(template, context);
  if (!compiled) {
    return false;
  }

  const registry = getExecutedTrackingRegistry();
  if (registry[key]) {
    return false;
  }

  registry[key] = true;

  if (/<script/i.test(compiled)) {
    const templateElement = document.createElement('template');
    templateElement.innerHTML = compiled;

    const scripts = Array.from(templateElement.content.querySelectorAll('script'));
    scripts.forEach((scriptNode) => {
      document.head.appendChild(cloneScriptNode(scriptNode));
    });

    if (scripts.length > 0) {
      return true;
    }
  }

  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = compiled;
  document.head.appendChild(script);
  return true;
}

function parseOrderAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

type PurchaseTrackingSettings = Pick<
  PublicSettingsDto,
  'metaPixelPurchaseScript' | 'tiktokPixelPurchaseScript'
>;

type PageTrackingSettings = Pick<
  PublicSettingsDto,
  'metaPixelPageScript' | 'tiktokPixelPageScript'
>;

export function firePageTrackingScripts(
  settings: PageTrackingSettings,
  scopeKey: string,
) {
  executeTrackingSnippetOnce(
    `meta-page:${scopeKey}`,
    settings.metaPixelPageScript,
    {},
  );
  executeTrackingSnippetOnce(
    `tiktok-page:${scopeKey}`,
    settings.tiktokPixelPageScript,
    {},
  );
}

export function firePurchaseTrackingScripts(
  settings: PurchaseTrackingSettings,
  order: Order,
  scopeKey: string,
) {
  const context = {
    ORDER_ID: order.id,
    ORDER_NUMBER: order.orderNumber,
    VALUE: parseOrderAmount(order.grandTotal),
    CURRENCY: order.currency || 'TRY',
    PAYMENT_METHOD: order.paymentMethod,
    SOURCE: order.source,
  } satisfies Partial<TrackingTemplateContext>;

  executeTrackingSnippetOnce(
    `meta-purchase:${scopeKey}`,
    settings.metaPixelPurchaseScript,
    context,
  );
  executeTrackingSnippetOnce(
    `tiktok-purchase:${scopeKey}`,
    settings.tiktokPixelPurchaseScript,
    context,
  );
}
