import type { BlogPost, MediaItem, MediaItemType } from '../types/api';
import { canonicalizeAssetUrl } from './asset-url';

function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `${prefix}-${String(random).replace(/[^a-zA-Z0-9-]/g, '')}`;
}

export function slugify(value: string, fallback = 'icerik') {
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

  return slug || fallback;
}

function toStringValue(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value.trim();
}

function toArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.map((item) => toStringValue(item)).filter((item) => item.length > 0);
}

function normalizeMediaType(value: unknown): MediaItemType {
  if (value === 'video' || value === 'document') {
    return value;
  }

  return 'image';
}

export function createEmptyMediaItem(): MediaItem {
  const timestamp = nowIso();
  return {
    id: createId('media'),
    title: '',
    url: '',
    type: 'image',
    folder: 'Genel',
    alt: '',
    description: '',
    thumbnailUrl: '',
    mimeType: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function parseMediaLibrary(raw?: string | null): MediaItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const record = item as Record<string, unknown>;
        const url = toStringValue(record.url);
        if (!url) {
          return null;
        }

        const createdAt = toStringValue(record.createdAt, nowIso());
        const updatedAt = toStringValue(record.updatedAt, createdAt);
        return {
          id: toStringValue(record.id, createId('media')),
          title: toStringValue(record.title),
          url: canonicalizeAssetUrl(url),
          type: normalizeMediaType(record.type),
          folder: toStringValue(record.folder, 'Genel'),
          alt: toStringValue(record.alt),
          description: toStringValue(record.description),
          thumbnailUrl: canonicalizeAssetUrl(toStringValue(record.thumbnailUrl, url)),
          mimeType: toStringValue(record.mimeType),
          createdAt,
          updatedAt,
        } satisfies MediaItem;
      })
      .filter((item): item is MediaItem => item !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } catch {
    return [];
  }
}

export function createEmptyBlogPost(): BlogPost {
  const timestamp = nowIso();
  return {
    id: createId('post'),
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    category: 'Genel',
    tags: [],
    isPublished: true,
    publishedAt: timestamp,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function parseBlogPosts(raw?: string | null): BlogPost[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const record = item as Record<string, unknown>;
        const title = toStringValue(record.title);
        if (!title) {
          return null;
        }

        const createdAt = toStringValue(record.createdAt, nowIso());
        const updatedAt = toStringValue(record.updatedAt, createdAt);
        const isPublished = Boolean(record.isPublished ?? true);
        return {
          id: toStringValue(record.id, createId('post')),
          slug: toStringValue(record.slug, slugify(title, 'yazi')),
          title,
          excerpt: toStringValue(record.excerpt),
          content: toStringValue(record.content),
          coverImageUrl: toStringValue(record.coverImageUrl),
          category: toStringValue(record.category, 'Genel'),
          tags: toArray(record.tags),
          isPublished,
          publishedAt: isPublished ? toStringValue(record.publishedAt, createdAt) : null,
          seoTitle: toStringValue(record.seoTitle),
          seoDescription: toStringValue(record.seoDescription),
          seoKeywords: toArray(record.seoKeywords),
          createdAt,
          updatedAt,
        } satisfies BlogPost;
      })
      .filter((item): item is BlogPost => item !== null)
      .sort((left, right) => {
        const leftDate = left.publishedAt ?? left.updatedAt;
        const rightDate = right.publishedAt ?? right.updatedAt;
        return rightDate.localeCompare(leftDate);
      });
  } catch {
    return [];
  }
}
