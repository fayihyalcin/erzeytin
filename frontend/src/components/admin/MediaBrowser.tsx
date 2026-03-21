import { useEffect, useMemo, useState } from 'react';
import { extractApiError } from '../../lib/api';
import {
  createMediaItemFromUpload,
  mergeMediaItems,
  resolveMediaAssetUrl,
  uploadMediaFiles,
} from '../../lib/media-library';
import { updateMediaLibrary } from '../../lib/admin-settings';
import type { MediaItem, MediaItemType } from '../../types/api';

const TYPE_LABELS: Record<MediaItemType, string> = {
  image: 'Resim',
  video: 'Video',
  document: 'Dokuman',
};

const TYPE_ACCEPT_MAP: Record<MediaItemType, string[]> = {
  image: ['image/*'],
  video: ['video/*'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
};

function matchesType(item: MediaItem, allowedTypes: MediaItemType[]) {
  return allowedTypes.length === 0 || allowedTypes.includes(item.type);
}

export function MediaBrowser({
  open,
  title = 'Medya kutuphanesi',
  items,
  allowedTypes = ['image', 'video', 'document'],
  autoSelectFirstUpload = false,
  onClose,
  onItemsChange,
  onSelect,
}: {
  open: boolean;
  title?: string;
  items: MediaItem[];
  allowedTypes?: MediaItemType[];
  autoSelectFirstUpload?: boolean;
  onClose: () => void;
  onItemsChange?: (items: MediaItem[]) => void;
  onSelect: (item: MediaItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('Tum klasorler');
  const [type, setType] = useState<'all' | MediaItemType>('all');
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>(items);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setLibraryItems(items);
  }, [items]);

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
      setUploadMessage(null);
      setDragActive(false);
    }
  }, [open]);

  const folderOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        libraryItems
          .filter((item) => matchesType(item, allowedTypes))
          .map((item) => item.folder.trim() || 'Genel'),
      ),
    ).sort((left, right) => left.localeCompare(right, 'tr'));

    return ['Tum klasorler', ...options];
  }, [allowedTypes, libraryItems]);

  const accept = useMemo(
    () => allowedTypes.flatMap((typeOption) => TYPE_ACCEPT_MAP[typeOption]).join(','),
    [allowedTypes],
  );

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('tr-TR');

    return libraryItems.filter((item) => {
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
  }, [allowedTypes, folder, libraryItems, search, type]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    setUploading(true);
    setUploadMessage(null);

    try {
      const uploadedAssets = await uploadMediaFiles(fileList, {
        folder: folder !== 'Tum klasorler' ? folder : 'Genel',
      });
      const uploadedItems = uploadedAssets.map(createMediaItemFromUpload);
      const nextItems = mergeMediaItems(libraryItems, uploadedItems);

      await updateMediaLibrary(nextItems);

      setLibraryItems(nextItems);
      onItemsChange?.(nextItems);
      setUploadMessage(`${uploadedItems.length} dosya kutuphaneye eklendi.`);

      if (autoSelectFirstUpload) {
        const firstUploaded = uploadedItems[0];
        if (firstUploaded) {
          const selectedItem =
            nextItems.find((item) => item.url === firstUploaded.url) ?? firstUploaded;
          onSelect(selectedItem);
          onClose();
        }
      }
    } catch (error) {
      setUploadMessage(extractApiError(error, 'Medya yukleme basarisiz oldu.'));
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  };

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
          <div className="admin-media-browser-header-actions">
            <label className="admin-secondary-button">
              <input
                accept={accept}
                hidden
                multiple
                onChange={(event) => {
                  void handleUpload(event.target.files);
                  event.target.value = '';
                }}
                type="file"
              />
              {uploading ? 'Yukleniyor...' : 'Coklu yukle'}
            </label>
            <button className="admin-ghost-button" onClick={onClose} type="button">
              Kapat
            </button>
          </div>
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

        <div
          className={dragActive ? 'admin-media-dropzone active' : 'admin-media-dropzone'}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget === event.target) {
              setDragActive(false);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            void handleUpload(event.dataTransfer.files);
          }}
        >
          <strong>Hizli yukleme</strong>
          <p>Resimleri bu alana birakin veya ustteki butondan secin. Dosyalar toplu olarak gonderilir.</p>
          {uploadMessage ? <small>{uploadMessage}</small> : null}
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
                    <img
                      alt={item.alt || item.title || 'Medya'}
                      decoding="async"
                      loading="lazy"
                      src={resolveMediaAssetUrl(item.thumbnailUrl || item.url)}
                    />
                  ) : item.type === 'video' ? (
                    <video muted playsInline preload="metadata" src={resolveMediaAssetUrl(item.url)} />
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
