import { createId } from './admin-content';
import { api } from './api';
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

function toArray(files: File[] | FileList) {
  return Array.isArray(files) ? files : Array.from(files);
}

function humanizeFileName(value: string) {
  const withoutExtension = value.replace(/\.[^.]+$/, '');
  const normalized = withoutExtension
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || 'Yeni medya';
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
  const uploadedItems: UploadedMediaAsset[] = [];

  for (const file of uploadFiles) {
    const formData = new FormData();
    formData.append('files', file);

    const response = await api.post<UploadMediaResponse>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    uploadedItems.push(...response.data.items);
  }

  return uploadedItems;
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
