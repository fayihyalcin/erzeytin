const MAX_TRACKING_PARAM_COUNT = 24;
const MAX_TRACKING_KEY_LENGTH = 64;
const MAX_TRACKING_VALUE_LENGTH = 255;
const MAX_URL_LENGTH = 1200;
const MAX_PATH_LENGTH = 255;
const MAX_REFERRER_LENGTH = 512;

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

type TrackingPayloadRecord = Record<string, unknown>;

function toLimitedString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, maxLength);
}

function isAllowedTrackingParamKey(key: string) {
  return key.startsWith('utm_') || ALLOWED_TRACKING_PARAM_KEYS.has(key);
}

function sanitizeTrackingParams(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value as TrackingPayloadRecord);
  const sanitized: Record<string, string> = {};

  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim().toLowerCase().slice(0, MAX_TRACKING_KEY_LENGTH);
    if (!key || !isAllowedTrackingParamKey(key)) {
      continue;
    }

    const normalizedValue = toLimitedString(rawValue, MAX_TRACKING_VALUE_LENGTH);
    if (!normalizedValue) {
      continue;
    }

    sanitized[key] = normalizedValue;

    if (Object.keys(sanitized).length >= MAX_TRACKING_PARAM_COUNT) {
      break;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeTrackedUrl(value: unknown, fallbackParams?: Record<string, string>) {
  const normalized = toLimitedString(value, MAX_URL_LENGTH * 2);
  if (!normalized) {
    return undefined;
  }

  try {
    const url = new URL(normalized);
    const mergedParams = {
      ...(sanitizeTrackingParams(Object.fromEntries(url.searchParams.entries())) ?? {}),
      ...(fallbackParams ?? {}),
    };

    url.hash = '';
    url.search = '';

    Object.entries(mergedParams).forEach(([key, paramValue]) => {
      url.searchParams.set(key, paramValue);
    });

    return url.toString().slice(0, MAX_URL_LENGTH);
  } catch {
    return normalized.slice(0, MAX_URL_LENGTH);
  }
}

function sanitizeIsoDate(value: unknown) {
  const normalized = toLimitedString(value, 64);
  if (!normalized) {
    return undefined;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

export function sanitizeOrderTrackingPayload(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as TrackingPayloadRecord;
  const params = sanitizeTrackingParams(record.params);
  const sanitized = {
    entryUrl: sanitizeTrackedUrl(record.entryUrl ?? record.pageUrl, params),
    currentUrl: sanitizeTrackedUrl(record.currentUrl, params),
    entryPath: toLimitedString(record.entryPath ?? record.pathname, MAX_PATH_LENGTH),
    currentPath: toLimitedString(record.currentPath, MAX_PATH_LENGTH),
    referrer: sanitizeTrackedUrl(record.referrer)?.slice(0, MAX_REFERRER_LENGTH),
    capturedAt: sanitizeIsoDate(record.capturedAt),
    params,
  };

  const compact = Object.entries(sanitized).reduce<Record<string, unknown>>(
    (accumulator, [key, rawValue]) => {
      if (rawValue === undefined || rawValue === null) {
        return accumulator;
      }

      if (
        typeof rawValue === 'object' &&
        !Array.isArray(rawValue) &&
        Object.keys(rawValue).length === 0
      ) {
        return accumulator;
      }

      accumulator[key] = rawValue;
      return accumulator;
    },
    {},
  );

  return Object.keys(compact).length > 0 ? compact : null;
}
