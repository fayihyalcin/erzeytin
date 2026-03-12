import { mkdirSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { Request } from 'express';

const DEFAULT_UPLOAD_DIR = 'uploads';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'application/msword': '.doc',
  'application/pdf': '.pdf',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/gif': '.gif',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/webp': '.webp',
  'text/plain': '.txt',
  'video/mp4': '.mp4',
  'video/ogg': '.ogg',
  'video/webm': '.webm',
};

export function resolveUploadRoot(rawValue?: string) {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return resolve(process.cwd(), DEFAULT_UPLOAD_DIR);
  }

  return isAbsolute(trimmed) ? trimmed : resolve(process.cwd(), trimmed);
}

export function ensureUploadRoot(rawValue?: string) {
  const root = resolveUploadRoot(rawValue);
  mkdirSync(root, { recursive: true });
  return root;
}

export function normalizeMediaFolderLabel(value?: string) {
  return value?.trim() || 'Genel';
}

export function sanitizeMediaFolder(value?: string) {
  const source = value?.trim() || 'genel';
  const normalized = source
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized || 'genel';
}

export function ensureUploadTargetDir(rawValue: string | undefined, folder?: string) {
  const root = ensureUploadRoot(rawValue);
  const target = resolve(root, sanitizeMediaFolder(folder));
  mkdirSync(target, { recursive: true });
  return target;
}

export function sanitizeFileNameBase(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalized || 'dosya';
}

export function resolveFileExtension(originalName: string, mimeType: string) {
  const fromOriginal = originalName.includes('.')
    ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase()
    : '';

  if (fromOriginal) {
    return fromOriginal;
  }

  return MIME_EXTENSION_MAP[mimeType] ?? '';
}

export function detectMediaType(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  return 'document';
}

export function buildPublicUploadUrl(request: Request, pathname: string) {
  const forwardedProto = request.headers['x-forwarded-proto'];
  const protocol =
    typeof forwardedProto === 'string' && forwardedProto.trim()
      ? forwardedProto.split(',')[0].trim()
      : request.protocol;

  return `${protocol}://${request.get('host')}${pathname}`;
}
