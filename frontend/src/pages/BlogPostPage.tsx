import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { PublicBreadcrumbs } from '../components/public/PublicBreadcrumbs';
import { PublicStorefrontLayout } from '../components/public/PublicStorefrontLayout';
import { api } from '../lib/api';
import { parseBlogPosts } from '../lib/admin-content';
import {
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildBlogKeywords,
  buildDefaultSeoImageUrl,
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
  const location = useLocation();
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
  const currency = settings?.currency?.toUpperCase() ?? 'TRY';
  const pageDescription = summarizeText(
    post?.seoDescription || post?.excerpt || post?.content || config.homeSections.blogDescription,
    155,
  );
  const blogImageUrl = post?.coverImageUrl
    ? toAbsoluteSiteUrl(siteUrl, post.coverImageUrl)
    : buildDefaultSeoImageUrl(siteUrl);

  useSeo({
    title: buildPageTitle(post?.seoTitle || post?.title || 'Blog yazisi', siteName),
    description: pageDescription,
    canonicalUrl: post ? toAbsoluteSiteUrl(siteUrl, `/blog/${post.slug}`) : toAbsoluteSiteUrl(siteUrl, '/'),
    robots: post ? 'index,follow,max-image-preview:large' : 'noindex,follow',
    keywords: post ? buildBlogKeywords(post, siteName) : [siteName, 'blog'],
    imageUrl: blogImageUrl,
    imageAlt: post?.title || `${siteName} blog yazısı`,
    siteName,
    type: 'article',
    publishedTime: post?.publishedAt ?? post?.updatedAt,
    modifiedTime: post?.updatedAt,
    section: post?.category || 'Blog',
    jsonLd: post
      ? [
          buildWebPageSchema({
            siteUrl,
            path: `/blog/${post.slug}`,
            title: post.title,
            description: pageDescription,
            imageUrl: blogImageUrl,
          }),
          buildArticleSchema({
            siteUrl,
            path: `/blog/${post.slug}`,
            post,
            brandName: siteName,
            description: pageDescription,
            imageUrl: blogImageUrl,
            logoUrl: buildDefaultSeoImageUrl(siteUrl),
          }),
          buildBreadcrumbSchema(siteUrl, [
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Blog', path: '/' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]
      : undefined,
  });

  if (!loading && !post) {
    return <Navigate to="/" replace />;
  }

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="legal-page">
        {loading || !post ? (
          <section className="legal-content">Yazi yukleniyor...</section>
        ) : (
          <>
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
          </>
        )}
      </div>
    </PublicStorefrontLayout>
  );
}
