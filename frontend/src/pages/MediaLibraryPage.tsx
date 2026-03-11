import { useEffect, useMemo, useState } from 'react';
import { createEmptyMediaItem, parseMediaLibrary } from '../lib/admin-content';
import { fetchSettingsRecord, updateSettingsRecord } from '../lib/admin-settings';
import type { MediaItem, MediaItemType } from '../types/api';

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url) || url.startsWith('data:image/');
}

function isVideo(url: string) {
  return /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video/');
}

const TYPE_OPTIONS: Array<{ value: MediaItemType; label: string }> = [
  { value: 'image', label: 'Resim' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Dokuman' },
];

export function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<MediaItem>(createEmptyMediaItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('Tum klasorler');
  const [typeFilter, setTypeFilter] = useState<'all' | MediaItemType>('all');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const settings = await fetchSettingsRecord();
        if (!mounted) {
          return;
        }

        const mediaItems = parseMediaLibrary(settings.mediaLibrary);
        setItems(mediaItems);
        setForm(mediaItems[0] ?? createEmptyMediaItem());
        setEditingId(mediaItems[0]?.id ?? null);
      } catch {
        if (mounted) {
          setMessage('Medya kutuphanesi yuklenemedi.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const folderOptions = useMemo(() => {
    const options = Array.from(new Set(items.map((item) => item.folder.trim() || 'Genel'))).sort(
      (left, right) => left.localeCompare(right, 'tr'),
    );
    return ['Tum klasorler', ...options];
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('tr-TR');
    return items.filter((item) => {
      if (folderFilter !== 'Tum klasorler' && (item.folder.trim() || 'Genel') !== folderFilter) {
        return false;
      }

      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [item.title, item.alt, item.description, item.folder, item.url].some((value) =>
        value.toLocaleLowerCase('tr-TR').includes(keyword),
      );
    });
  }, [folderFilter, items, search, typeFilter]);

  const persistItems = async (nextItems: MediaItem[], nextMessage: string) => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettingsRecord({
        mediaLibrary: JSON.stringify(nextItems),
      });
      setItems(nextItems);
      setMessage(nextMessage);
    } catch {
      setMessage('Medya kutuphanesi kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (item: MediaItem) => {
    setEditingId(item.id);
    setForm(item);
  };

  const handleNew = () => {
    const empty = createEmptyMediaItem();
    setEditingId(null);
    setForm(empty);
  };

  const handleSave = async () => {
    if (!form.url.trim()) {
      setMessage('Medya URL alani zorunludur.');
      return;
    }

    const timestamp = new Date().toISOString();
    const normalized = {
      ...form,
      title: form.title.trim(),
      url: form.url.trim(),
      folder: form.folder.trim() || 'Genel',
      alt: form.alt.trim(),
      description: form.description.trim(),
      thumbnailUrl:
        form.thumbnailUrl.trim() || (form.type === 'document' ? '' : form.url.trim()),
      mimeType: form.mimeType.trim(),
      updatedAt: timestamp,
      createdAt: editingId ? form.createdAt : timestamp,
    } satisfies MediaItem;

    const nextItems = editingId
      ? items.map((item) => (item.id === editingId ? normalized : item))
      : [normalized, ...items];

    await persistItems(
      nextItems.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      editingId ? 'Medya kaydi guncellendi.' : 'Yeni medya kaydi eklendi.',
    );
    setEditingId(normalized.id);
    setForm(normalized);
  };

  const handleDelete = async () => {
    if (!editingId) {
      return;
    }

    const nextItems = items.filter((item) => item.id !== editingId);
    await persistItems(nextItems, 'Medya kaydi silindi.');
    setEditingId(nextItems[0]?.id ?? null);
    setForm(nextItems[0] ?? createEmptyMediaItem());
  };

  const handleUpload = async (file: File) => {
    setMessage(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const timestamp = new Date().toISOString();
      setForm((current) => ({
        ...current,
        title: current.title || file.name.replace(/\.[^.]+$/, ''),
        url: dataUrl,
        thumbnailUrl: dataUrl,
        mimeType: file.type,
        type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'document',
        updatedAt: timestamp,
      }));
      setMessage('Dosya forma yerlestirildi. Kaydet diyerek kutuphaneye ekleyebilirsiniz.');
    } catch {
      setMessage('Dosya okunamadi. Lutfen farkli bir dosya deneyin.');
    }
  };

  if (loading) {
    return <section className="admin-panel">Medya kutuphanesi yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">CMS / Medya</span>
          <h2>Medya kutuphanesi</h2>
          <p>Resim, video ve dokuman baglantilarini tek merkezde toplayin.</p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-secondary-button" onClick={handleNew} type="button">
            Yeni medya
          </button>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Tarayici</h3>
              <p>{items.length} medya ogesi kayitli.</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <input
              className="admin-input"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Medya ara"
              value={search}
            />
            <select
              className="admin-select"
              onChange={(event) => setFolderFilter(event.target.value)}
              value={folderFilter}
            >
              {folderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="admin-select"
              onChange={(event) => setTypeFilter(event.target.value as 'all' | MediaItemType)}
              value={typeFilter}
            >
              <option value="all">Tum tipler</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {filteredItems.length === 0 ? (
            <div className="admin-empty-state compact">
              <strong>Medya bulunamadi</strong>
              <p>Yeni bir medya ekleyin veya filtreleri temizleyin.</p>
            </div>
          ) : (
            <div className="admin-media-grid">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className={editingId === item.id ? 'admin-media-card active' : 'admin-media-card'}
                  onClick={() => handleSelect(item)}
                  type="button"
                >
                  <div className="admin-media-preview">
                    {item.type === 'image' ? (
                      <img alt={item.alt || item.title || 'Medya'} src={item.thumbnailUrl || item.url} />
                    ) : item.type === 'video' ? (
                      <video muted playsInline preload="metadata" src={item.url} />
                    ) : (
                      <div className="admin-media-file-icon">DOC</div>
                    )}
                  </div>
                  <div className="admin-media-meta">
                    <strong>{item.title || 'Adsiz medya'}</strong>
                    <span>{item.folder || 'Genel'}</span>
                    <small>{TYPE_OPTIONS.find((option) => option.value === item.type)?.label}</small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>{editingId ? 'Medya duzenle' : 'Yeni medya ekle'}</h3>
              <p>
                Kutuphaneden secilebilir kayitlar olusturun. Urunlerde hem buradan hem de dogrudan
                URL ile kullanabilirsiniz.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="admin-label">
              <span>Baslik</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                value={form.title}
              />
            </label>

            <label className="admin-label">
              <span>Tur</span>
              <select
                className="admin-select"
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as MediaItemType })
                }
                value={form.type}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-label">
              <span>Klasor</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, folder: event.target.value })}
                placeholder="Urunler / Hero / Blog"
                value={form.folder}
              />
            </label>

            <label className="admin-label">
              <span>MIME turu</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, mimeType: event.target.value })}
                placeholder="image/webp"
                value={form.mimeType}
              />
            </label>

            <label className="admin-label admin-span-full">
              <span>Medya URL</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, url: event.target.value })}
                placeholder="https:// veya data:"
                value={form.url}
              />
            </label>

            <label className="admin-label admin-span-full">
              <span>Kucuk onizleme URL</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })}
                placeholder="Bos birakilirsa medya URL kullanilir"
                value={form.thumbnailUrl}
              />
            </label>

            <label className="admin-label admin-span-full">
              <span>Alt metin</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, alt: event.target.value })}
                value={form.alt}
              />
            </label>

            <label className="admin-label admin-span-full">
              <span>Aciklama</span>
              <textarea
                className="admin-textarea"
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={5}
                value={form.description}
              />
            </label>
          </div>

          <div className="admin-upload-box">
            <div>
              <strong>Cihazdan ekle</strong>
              <p>Kucuk boyutlu dosyalari dogrudan data URL olarak kutuphaneye kaydedebilirsiniz.</p>
            </div>
            <label className="admin-upload-trigger">
              <input
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleUpload(file);
                  }
                  event.target.value = '';
                }}
                type="file"
              />
              Dosya sec
            </label>
          </div>

          {form.url ? (
            <div className="admin-media-inline-preview large">
              {isVideo(form.url) ? (
                <video controls playsInline src={form.url} />
              ) : isImage(form.url) ? (
                <img alt={form.alt || form.title || 'Onizleme'} src={form.thumbnailUrl || form.url} />
              ) : (
                <div className="admin-document-preview">
                  <strong>{form.title || 'Dokuman onizlemesi'}</strong>
                  <span>Bu medya dokuman tipinde kaydedilecek.</span>
                </div>
              )}
            </div>
          ) : null}

          <div className="admin-form-actions">
            <button className="admin-primary-button" disabled={saving} onClick={() => void handleSave()} type="button">
              {saving ? 'Kaydediliyor...' : editingId ? 'Kaydi guncelle' : 'Kutuphane kaydi ekle'}
            </button>
            {editingId ? (
              <button className="admin-danger-button" disabled={saving} onClick={() => void handleDelete()} type="button">
                Sil
              </button>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
