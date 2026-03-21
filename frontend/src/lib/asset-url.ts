import { API_BASE_URL, API_ORIGIN } from './api';

const TRIMMED_API_BASE_URL = API_BASE_URL.replace(/\/+$/, '');
const TRIMMED_API_ORIGIN = API_ORIGIN.replace(/\/+$/, '');

function joinUrl(base: string, path: string) {
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function normalizeUploadPath(pathname: string) {
  if (pathname.startsWith('/api/uploads/')) {
    return joinUrl(TRIMMED_API_ORIGIN, pathname);
  }

  if (pathname.startsWith('/uploads/')) {
    return joinUrl(TRIMMED_API_BASE_URL, pathname);
  }

  return null;
}

export function resolveAssetUrl(value?: string | null) {
  const url = value?.trim();
  if (!url) {
    return '';
  }

  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (url.startsWith('//')) {
    return `${window.location.protocol}${url}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      const normalizedUploadUrl = normalizeUploadPath(parsed.pathname);
      if (normalizedUploadUrl) {
        return normalizedUploadUrl;
      }

      return parsed.toString();
    } catch {
      return url;
    }
  }

  const normalizedUploadUrl = normalizeUploadPath(url);
  if (normalizedUploadUrl) {
    return normalizedUploadUrl;
  }

  return joinUrl(TRIMMED_API_ORIGIN, url);
}

export function canonicalizeAssetUrl(value?: string | null) {
  return resolveAssetUrl(value);
}
