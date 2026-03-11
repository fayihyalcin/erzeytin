import { useEffect, useMemo, useState } from 'react';
import type { MediaItem, MediaItemType } from '../../types/api';

const TYPE_LABELS: Record<MediaItemType, string> = {
  image: 'Resim',
  video: 'Video',
  document: 'Dokuman',
};

function matchesType(item: MediaItem, allowedTypes: MediaItemType[]) {
  return allowedTypes.length === 0 || allowedTypes.includes(item.type);
}

export function MediaBrowser({
  open,
  title = 'Medya kutuphanesi',
  items,
  allowedTypes = ['image', 'video', 'document'],
  onClose,
  onSelect,
}: {
  open: boolean;
  title?: string;
  items: MediaItem[];
  allowedTypes?: MediaItemType[];
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('Tum klasorler');
  const [type, setType] = useState<'all' | MediaItemType>('all');

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.classList.add('admin-modal-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('admin-modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setFolder('Tum klasorler');
      setType('all');
    }
  }, [open]);

  const folderOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        items
          .filter((item) => matchesType(item, allowedTypes))
          .map((item) => item.folder.trim() || 'Genel'),
      ),
    ).sort((left, right) => left.localeCompare(right, 'tr'));

    return ['Tum klasorler', ...options];
  }, [allowedTypes, items]);

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('tr-TR');

    return items.filter((item) => {
      if (!matchesType(item, allowedTypes)) {
        return false;
      }

      if (type !== 'all' && item.type !== type) {
        return false;
      }

      if (folder !== 'Tum klasorler' && (item.folder.trim() || 'Genel') !== folder) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const values = [item.title, item.alt, item.description, item.folder, item.url];
      return values.some((value) => value.toLocaleLowerCase('tr-TR').includes(keyword));
    });
  }, [allowedTypes, folder, items, search, type]);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <section
        aria-modal="true"
        className="admin-modal admin-media-browser"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-modal-header">
          <div>
            <h3>{title}</h3>
            <p>{visibleItems.length} medya kaydi listeleniyor.</p>
          </div>
          <button className="admin-ghost-button" onClick={onClose} type="button">
            Kapat
          </button>
        </header>

        <div className="admin-media-toolbar">
          <input
            className="admin-input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Medya ara"
            value={search}
          />

          <select className="admin-select" onChange={(event) => setFolder(event.target.value)} value={folder}>
            {folderOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            onChange={(event) => setType(event.target.value as 'all' | MediaItemType)}
            value={type}
          >
            <option value="all">Tum tipler</option>
            {allowedTypes.map((option) => (
              <option key={option} value={option}>
                {TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {visibleItems.length === 0 ? (
          <div className="admin-empty-state compact">
            <strong>Eslesen medya bulunamadi</strong>
            <p>Arama, klasor veya tip filtresini degistirerek tekrar deneyin.</p>
          </div>
        ) : (
          <div className="admin-media-grid">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                className="admin-media-card"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                type="button"
              >
                <div className="admin-media-preview">
                  {item.type === 'image' ? (
                    <img alt={item.alt || item.title || 'Medya'} src={item.thumbnailUrl || item.url} />
                  ) : item.type === 'video' ? (
                    <video muted playsInline preload="metadata" src={item.url} />
                  ) : (
                    <div className="admin-media-file-icon">{TYPE_LABELS[item.type]}</div>
                  )}
                </div>
                <div className="admin-media-meta">
                  <strong>{item.title || 'Adsiz medya'}</strong>
                  <span>{item.folder || 'Genel'}</span>
                  <small>{TYPE_LABELS[item.type]}</small>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
