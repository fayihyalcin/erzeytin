import { useMemo, useState } from 'react';
import { MediaBrowser } from './MediaBrowser';
import type { MediaItem, MediaItemType } from '../../types/api';

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video/');
}

export function MediaPickerField({
  label,
  value,
  onChange,
  items,
  allowedTypes = ['image'],
  placeholder = 'https://',
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: MediaItem[];
  allowedTypes?: MediaItemType[];
  placeholder?: string;
  helperText?: string;
}) {
  const [browserOpen, setBrowserOpen] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.url === value || item.thumbnailUrl === value) ?? null,
    [items, value],
  );

  return (
    <div className="admin-media-field">
      <label className="admin-label">
        <span>{label}</span>
        <div className="admin-media-inline">
          <input
            className="admin-input"
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            value={value}
          />
          <button className="admin-secondary-button" onClick={() => setBrowserOpen(true)} type="button">
            Kutuphaneden Sec
          </button>
          {value ? (
            <button className="admin-ghost-button" onClick={() => onChange('')} type="button">
              Temizle
            </button>
          ) : null}
        </div>
      </label>

      {helperText ? <small className="admin-field-hint">{helperText}</small> : null}

      {value ? (
        <div className="admin-media-inline-preview">
          {isVideo(value) ? (
            <video controls playsInline src={value} />
          ) : (
            <img alt={selectedItem?.alt || label} src={selectedItem?.thumbnailUrl || value} />
          )}
          <div>
            <strong>{selectedItem?.title || 'Harici medya baglantisi'}</strong>
            <span>{selectedItem?.folder || 'Dogrudan URL'}</span>
          </div>
        </div>
      ) : null}

      <MediaBrowser
        allowedTypes={allowedTypes}
        items={items}
        onClose={() => setBrowserOpen(false)}
        onSelect={(item: MediaItem) => onChange(item.url)}
        open={browserOpen}
      />
    </div>
  );
}
