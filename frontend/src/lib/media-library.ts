import { createId } from './admin-content';
import { api, API_ORIGIN } from './api';
import type { MediaItem, MediaItemType } from '../types/api';

interface UploadedMediaAsset {
  folder: string;
  filename: string;
  mimeType: string;
  originalName: string;
  path: string;
  size: number;
  type: MediaItemType;
  url: string;
}

interface UploadMediaResponse {
  items: UploadedMediaAsset[];
  uploadedAt: string;
}

const MAX_UPLOAD_BATCH_SIZE = 20;
const MAX_PARALLEL_UPLOAD_BATCHES = 2;

function toArray(files: File[] | FileList) {
  return Array.isArray(files) ? files : Array.from(files);
}

function chunkFiles(files: File[], size: number) {
  const chunks: File[][] = [];

  for (let index = 0; index < files.length; index += size) {
    chunks.push(files.slice(index, index + size));
  }

  return chunks;
}

function humanizeFileName(value: string) {
  const withoutExtension = value.replace(/\.[^.]+$/, '');
  const normalized = withoutExtension
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || 'Yeni medya';
}

async function uploadBatch(endpoint: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file, file.name);
  });

  const response = await api.post<UploadMediaResponse>(endpoint, formData);
  return response.data.items;
}

async function runUploadQueue(endpoint: string, batches: File[][]) {
  const results: UploadedMediaAsset[][] = new Array(batches.length);
  let nextBatchIndex = 0;

  async function worker() {
    while (nextBatchIndex < batches.length) {
      const currentIndex = nextBatchIndex;
      nextBatchIndex += 1;
      results[currentIndex] = await uploadBatch(endpoint, batches[currentIndex]);
    }
  }

  const workerCount = Math.min(MAX_PARALLEL_UPLOAD_BATCHES, batches.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results.flat();
}

export async function uploadMediaFiles(
  files: File[] | FileList,
  options?: { folder?: string },
) {
  const uploadFiles = toArray(files).filter(Boolean);
  if (uploadFiles.length === 0) {
    return [] as UploadedMediaAsset[];
  }

  const params = new URLSearchParams();
  if (options?.folder?.trim()) {
    params.set('folder', options.folder.trim());
  }

  const endpoint =
    params.size > 0 ? `/media/upload?${params.toString()}` : '/media/upload';
  const batches = chunkFiles(uploadFiles, MAX_UPLOAD_BATCH_SIZE);

  return runUploadQueue(endpoint, batches);
}

export function createMediaItemFromUpload(asset: UploadedMediaAsset): MediaItem {
  const timestamp = new Date().toISOString();

  return {
    alt: '',
    createdAt: timestamp,
    description: '',
    folder: asset.folder,
    id: createId('media'),
    mimeType: asset.mimeType,
    thumbnailUrl: asset.type === 'document' ? '' : asset.url,
    title: humanizeFileName(asset.originalName),
    type: asset.type,
    updatedAt: timestamp,
    url: asset.url,
  };
}

export function mergeMediaItems(existing: MediaItem[], incoming: MediaItem[]) {
  const byUrl = new Map(existing.map((item) => [item.url, item]));

  for (const item of incoming) {
    const previous = byUrl.get(item.url);
    if (previous) {
      byUrl.set(item.url, {
        ...item,
        createdAt: previous.createdAt,
        id: previous.id,
      });
      continue;
    }

    byUrl.set(item.url, item);
  }

  return [...byUrl.values()].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export function resolveMediaAssetUrl(value?: string | null) {
  const url = value?.trim();
  if (!url) {
    return '';
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  if (url.startsWith('//')) {
    return `${window.location.protocol}${url}`;
  }

  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}
