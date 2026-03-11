import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { parseBlogPosts } from '../lib/admin-content';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type { BlogPost, PublicSettingsDto, WebsiteConfig } from '../types/api';
import './LegalPages.css';

function splitParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get<PublicSettingsDto>('/settings/public')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setConfig(parseWebsiteConfig(response.data.websiteConfig));
        setPosts(parseBlogPosts(response.data.blogPosts).filter((item) => item.isPublished));
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const post = useMemo(() => posts.find((item) => item.slug === slug) ?? null, [posts, slug]);
  const relatedPosts = useMemo(
    () => posts.filter((item) => item.slug !== slug).slice(0, 3),
    [posts, slug],
  );

  if (loading) {
    return <main className="legal-page"><section className="legal-content">Yazi yukleniyor...</section></main>;
  }

  if (!post) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="legal-page">
      <header className="legal-topbar">
        <div className="legal-topbar-inner">
          <Link to="/" className="legal-brand">
            {config.theme.brandName}
          </Link>
          <nav className="legal-nav">
            <Link to="/">Ana Sayfa</Link>
            <Link to="/cart">Sepet</Link>
            <Link to="/iletisim">Iletisim</Link>
          </nav>
        </div>
      </header>

      <section className="legal-hero">
        <p className="contact-hero-badge">{post.category}</p>
        <h1>{post.title}</h1>
        <p>{post.excerpt || config.homeSections.blogDescription}</p>
      </section>

      <section className="legal-content">
        {post.coverImageUrl ? (
          <article className="legal-section">
            <img
              alt={post.title}
              src={post.coverImageUrl}
              style={{ width: '100%', borderRadius: 16, objectFit: 'cover', maxHeight: 480 }}
            />
          </article>
        ) : null}

        <article className="legal-section">
          <h2>Yayin detayi</h2>
          <p>
            {new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString('tr-TR')} -{' '}
            {post.tags.length > 0 ? post.tags.join(', ') : 'Genel icerik'}
          </p>
        </article>

        <article className="legal-section">
          <h2>Icerik</h2>
          <div>
            {splitParagraphs(post.content || post.excerpt).map((paragraph, index) => (
              <p key={`${post.id}-paragraph-${index}`}>{paragraph}</p>
            ))}
          </div>
        </article>

        {relatedPosts.length > 0 ? (
          <article className="legal-section">
            <h2>Diger yazilar</h2>
            <div className="admin-quick-grid">
              {relatedPosts.map((item) => (
                <Link key={item.id} className="admin-quick-card" to={`/blog/${item.slug}`}>
                  <strong>{item.title}</strong>
                  <span>{item.excerpt || item.category}</span>
                </Link>
              ))}
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
