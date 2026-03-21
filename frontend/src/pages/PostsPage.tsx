import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AiSeoAssistant } from '../components/admin/AiSeoAssistant';
import { MediaPickerField } from '../components/admin/MediaPickerField';
import { createEmptyBlogPost, parseBlogPosts, parseMediaLibrary, slugify } from '../lib/admin-content';
import { fetchSettingsRecord, updateSettingsRecord } from '../lib/admin-settings';
import { createAiSeoSuggestions } from '../lib/ai-seo';
import type { BlogPost, MediaItem } from '../types/api';

function toTagList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toTagText(value: string[]) {
  return value.join(', ');
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Taslak';
  }

  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<BlogPost>(createEmptyBlogPost);
  const [tagText, setTagText] = useState('');
  const [seoKeywordText, setSeoKeywordText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

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

        const parsedPosts = parseBlogPosts(settings.blogPosts);
        const parsedMedia = parseMediaLibrary(settings.mediaLibrary);
        setPosts(parsedPosts);
        setMediaItems(parsedMedia);
        if (parsedPosts[0]) {
          setEditingId(parsedPosts[0].id);
          setForm(parsedPosts[0]);
          setTagText(toTagText(parsedPosts[0].tags));
          setSeoKeywordText(toTagText(parsedPosts[0].seoKeywords));
        }
      } catch {
        if (mounted) {
          setMessage('Yazi listesi yuklenemedi.');
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

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('tr-TR');
    return posts.filter((post) => {
      if (statusFilter === 'published' && !post.isPublished) {
        return false;
      }

      if (statusFilter === 'draft' && post.isPublished) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [post.title, post.excerpt, post.category, post.slug].some((value) =>
        value.toLocaleLowerCase('tr-TR').includes(keyword),
      );
    });
  }, [posts, search, statusFilter]);

  const persistPosts = async (nextPosts: BlogPost[], successMessage: string) => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSettingsRecord({
        blogPosts: JSON.stringify(nextPosts),
      });
      setPosts(nextPosts);
      setMessage(successMessage);
    } catch {
      setMessage('Yazi listesi kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const selectPost = (post: BlogPost) => {
    setEditingId(post.id);
    setForm(post);
    setTagText(toTagText(post.tags));
    setSeoKeywordText(toTagText(post.seoKeywords));
  };

  const handleNew = () => {
    const next = createEmptyBlogPost();
    setEditingId(null);
    setForm(next);
    setTagText('');
    setSeoKeywordText('');
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setMessage('Baslik zorunludur.');
      return;
    }

    const timestamp = new Date().toISOString();
    const normalizedTitle = form.title.trim();
    const normalizedSlug = slugify(form.slug || normalizedTitle, 'yazi');
    const normalized = {
      ...form,
      title: normalizedTitle,
      slug: normalizedSlug,
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category.trim() || 'Genel',
      tags: toTagList(tagText),
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      seoKeywords: toTagList(seoKeywordText),
      coverImageUrl: form.coverImageUrl.trim(),
      updatedAt: timestamp,
      publishedAt: form.isPublished ? form.publishedAt ?? timestamp : null,
      createdAt: editingId ? form.createdAt : timestamp,
    } satisfies BlogPost;

    const nextPosts = editingId
      ? posts.map((post) => (post.id === editingId ? normalized : post))
      : [normalized, ...posts];

    await persistPosts(
      nextPosts.sort((left, right) => {
        const leftKey = left.publishedAt ?? left.updatedAt;
        const rightKey = right.publishedAt ?? right.updatedAt;
        return rightKey.localeCompare(leftKey);
      }),
      editingId ? 'Yazi guncellendi.' : 'Yeni yazi eklendi.',
    );
    setEditingId(normalized.id);
    setForm(normalized);
    setSeoKeywordText(toTagText(normalized.seoKeywords));
  };

  const seoSuggestions = useMemo(
    () =>
      createAiSeoSuggestions({
        title: form.title,
        category: form.category,
        summary: form.excerpt,
        content: form.content,
        tags: toTagList(tagText),
        existingKeywords: toTagList(seoKeywordText),
        fallbackSlug: form.slug || form.title,
      }),
    [form.category, form.content, form.excerpt, form.slug, form.title, seoKeywordText, tagText],
  );

  const handleDelete = async () => {
    if (!editingId) {
      return;
    }

    const nextPosts = posts.filter((post) => post.id !== editingId);
    await persistPosts(nextPosts, 'Yazi silindi.');
    if (nextPosts[0]) {
      selectPost(nextPosts[0]);
    } else {
      handleNew();
    }
  };

  if (loading) {
    return <section className="admin-panel">Yazilar yukleniyor...</section>;
  }

  return (
    <div className="admin-page-stack">
      <section className="admin-page-header">
        <div>
          <span className="admin-eyebrow">CMS / Yazilar</span>
          <h2>Yazi yonetimi</h2>
          <p>Blog, rehber ve hikaye iceriklerini buradan yayinlayin.</p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-secondary-button" onClick={handleNew} type="button">
            Yeni yazi
          </button>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}

      <section className="admin-overview-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>Yazi listesi</h3>
              <p>{posts.length} kayit bulundu.</p>
            </div>
          </div>

          <div className="admin-toolbar">
            <input
              className="admin-input"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Yazi ara"
              value={search}
            />
            <select
              className="admin-select"
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | 'published' | 'draft')
              }
              value={statusFilter}
            >
              <option value="all">Tum durumlar</option>
              <option value="published">Yayinda</option>
              <option value="draft">Taslak</option>
            </select>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="admin-empty-state compact">
              <strong>Yazi bulunamadi</strong>
              <p>Yeni bir yazi ekleyin veya filtreleri degistirin.</p>
            </div>
          ) : (
            <div className="admin-stack-list">
              {filteredPosts.map((post) => (
                <button
                  key={post.id}
                  className={editingId === post.id ? 'admin-post-card active' : 'admin-post-card'}
                  onClick={() => selectPost(post)}
                  type="button"
                >
                  {post.coverImageUrl ? (
                    <img alt={post.title} src={post.coverImageUrl} />
                  ) : (
                    <div className="admin-post-placeholder">Yazi</div>
                  )}
                  <div>
                    <strong>{post.title}</strong>
                    <span>{post.category}</span>
                    <small>
                      {post.isPublished ? 'Yayinda' : 'Taslak'} - {formatDate(post.publishedAt)}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h3>{editingId ? 'Yazi duzenle' : 'Yeni yazi ekle'}</h3>
              <p>Icerik, SEO ve kapak gorseli tek ekranda yonetilir.</p>
            </div>
            {editingId ? (
              <Link className="admin-inline-link" to={`/blog/${form.slug || ''}`} target="_blank">
                Yayin onizleme
              </Link>
            ) : null}
          </div>

          <div className="admin-form-grid">
            <label className="admin-label admin-span-full">
              <span>Baslik</span>
              <input
                className="admin-input"
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setForm((current) => ({
                    ...current,
                    title: nextTitle,
                    slug: current.slug ? current.slug : slugify(nextTitle, 'yazi'),
                  }));
                }}
                value={form.title}
              />
            </label>

            <label className="admin-label">
              <span>Slug</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, slug: slugify(event.target.value, 'yazi') })}
                value={form.slug}
              />
            </label>

            <label className="admin-label">
              <span>Kategori</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                value={form.category}
              />
            </label>

            <label className="admin-label">
              <span>Durum</span>
              <select
                className="admin-select"
                onChange={(event) =>
                  setForm({ ...form, isPublished: event.target.value === '1' })
                }
                value={form.isPublished ? '1' : '0'}
              >
                <option value="1">Yayinda</option>
                <option value="0">Taslak</option>
              </select>
            </label>

            <label className="admin-label">
              <span>Yayin tarihi</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, publishedAt: event.target.value || null })}
                type="datetime-local"
                value={form.publishedAt ? form.publishedAt.slice(0, 16) : ''}
              />
            </label>

            <label className="admin-label admin-span-full">
              <span>Ozet</span>
              <textarea
                className="admin-textarea"
                onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
                rows={3}
                value={form.excerpt}
              />
            </label>

            <MediaPickerField
              allowedTypes={['image']}
              helperText="Kapak gorselini medya kutuphanesinden secin veya harici URL verin."
              items={mediaItems}
              label="Kapak gorseli"
              onChange={(value) => setForm({ ...form, coverImageUrl: value })}
              value={form.coverImageUrl}
            />

            <label className="admin-label admin-span-full">
              <span>Etiketler</span>
              <input
                className="admin-input"
                onChange={(event) => setTagText(event.target.value)}
                placeholder="zeytinyagi, tarif, marka"
                value={tagText}
              />
            </label>

            <label className="admin-label admin-span-full">
              <span>Icerik</span>
              <textarea
                className="admin-textarea"
                onChange={(event) => setForm({ ...form, content: event.target.value })}
                rows={14}
                value={form.content}
              />
            </label>

            <label className="admin-label">
              <span>SEO baslik</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
                value={form.seoTitle}
              />
            </label>

            <label className="admin-label">
              <span>SEO aciklama</span>
              <input
                className="admin-input"
                onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
                value={form.seoDescription}
              />
            </label>

            <label className="admin-label admin-span-full">
              <span>SEO anahtar kelimeler</span>
              <input
                className="admin-input"
                onChange={(event) => setSeoKeywordText(event.target.value)}
                placeholder="zeytinyagi, tarif, marka"
                value={seoKeywordText}
              />
            </label>
          </div>

          <AiSeoAssistant
            descriptionSuggestion={seoSuggestions.description}
            keywordsSuggestion={seoSuggestions.keywords}
            onApplyDescription={() => setForm((current) => ({ ...current, seoDescription: seoSuggestions.description }))}
            onApplyKeywords={() => setSeoKeywordText(seoSuggestions.keywords.join(', '))}
            onApplySlug={() => setForm((current) => ({ ...current, slug: seoSuggestions.slug }))}
            onApplySummary={() => setForm((current) => ({ ...current, excerpt: seoSuggestions.summary }))}
            onApplyTitle={() => setForm((current) => ({ ...current, seoTitle: seoSuggestions.title }))}
            slugSuggestion={seoSuggestions.slug}
            summaryLabel="Kisa ozet onerisi"
            summarySuggestion={seoSuggestions.summary}
            titleSuggestion={seoSuggestions.title}
          />

          <div className="admin-form-actions">
            <button className="admin-primary-button" disabled={saving} onClick={() => void handleSave()} type="button">
              {saving ? 'Kaydediliyor...' : editingId ? 'Yaziyi guncelle' : 'Yazi ekle'}
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
