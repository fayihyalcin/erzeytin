import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PublicBreadcrumbs } from '../components/public/PublicBreadcrumbs';
import { api } from '../lib/api';
import { parseBlogPosts } from '../lib/admin-content';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildPageTitle,
  buildWebPageSchema,
  summarizeText,
  toAbsoluteSiteUrl,
} from '../lib/public-seo';
import { useSeo } from '../lib/seo';
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
  const [settings, setSettings] = useState<PublicSettingsDto | null>(null);
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

        setSettings(response.data);
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
  const siteUrl = settings?.siteUrl ?? null;
  const siteName = settings?.storeName?.trim() || config.theme.brandName || 'Er Zeytincilik';
  const pageDescription = summarizeText(
    post?.seoDescription || post?.excerpt || post?.content || config.homeSections.blogDescription,
    155,
  );

  useSeo({
    title: buildPageTitle(post?.seoTitle || post?.title || 'Blog yazisi', siteName),
    description: pageDescription,
    canonicalUrl: post ? toAbsoluteSiteUrl(siteUrl, `/blog/${post.slug}`) : toAbsoluteSiteUrl(siteUrl, '/'),
    robots: post ? 'index,follow,max-image-preview:large' : 'noindex,follow',
    keywords: post?.seoKeywords?.length ? post.seoKeywords : post?.tags ?? [],
    imageUrl: post?.coverImageUrl ? toAbsoluteSiteUrl(siteUrl, post.coverImageUrl) : undefined,
    siteName,
    type: 'article',
    jsonLd: post
      ? [
          buildWebPageSchema({
            siteUrl,
            path: `/blog/${post.slug}`,
            title: post.title,
            description: pageDescription,
          }),
          buildArticleSchema({
            siteUrl,
            path: `/blog/${post.slug}`,
            post,
            brandName: siteName,
            description: pageDescription,
            imageUrl: post.coverImageUrl
              ? toAbsoluteSiteUrl(siteUrl, post.coverImageUrl)
              : undefined,
          }),
          buildBreadcrumbSchema(siteUrl, [
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Blog', path: '/' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]
      : undefined,
  });

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
          <nav className="legal-nav" aria-label="Blog gezinme">
            <Link to="/">Ana Sayfa</Link>
            <Link to="/urunler">Urunler</Link>
            <Link to="/kampanyalar">Kampanyalar</Link>
            <Link to="/iletisim">Iletisim</Link>
          </nav>
        </div>
      </header>

      <section className="legal-content" style={{ paddingBottom: 0 }}>
        <PublicBreadcrumbs
          items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Blog', href: '/' },
            { label: post.title },
          ]}
        />
      </section>

      <article>
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
                decoding="async"
                loading="eager"
                fetchPriority="high"
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
      </article>
    </main>
  );
}
