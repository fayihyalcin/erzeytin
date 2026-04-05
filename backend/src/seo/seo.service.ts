import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../catalog/category.entity';
import { Product } from '../catalog/product.entity';
import { Setting } from '../settings/setting.entity';

interface ParsedBlogPost {
  slug: string;
  publishedAt: string | null;
  updatedAt: string;
  coverImageUrl: string | null;
}

interface SitemapEntry {
  path: string;
  lastModified?: string | null;
  priority?: string;
  changeFrequency?: string;
  imageUrls?: string[];
}

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepository: Repository<Setting>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async renderRobotsTxt() {
    const settingsMap = await this.getSettingsMap(['siteUrl']);
    const siteUrl = this.resolveSiteUrl(settingsMap.siteUrl);

    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /dashboard',
      'Disallow: /admin',
      'Disallow: /login',
      'Disallow: /cart',
      'Disallow: /checkout',
      'Disallow: /customer/',
      'Disallow: /api/',
      `Host: ${siteUrl}`,
      `Sitemap: ${this.toAbsoluteUrl(siteUrl, '/sitemap.xml')}`,
    ].join('\n');
  }

  async renderSitemapXml() {
    const [settingsMap, categories, products] = await Promise.all([
      this.getSettingsMap(['siteUrl', 'websiteConfig', 'blogPosts']),
      this.categoriesRepository.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC', updatedAt: 'DESC' },
      }),
      this.productsRepository.find({
        where: { isActive: true },
        order: { updatedAt: 'DESC' },
        relations: ['category'],
      }),
    ]);

    const siteUrl = this.resolveSiteUrl(settingsMap.siteUrl);
    const blogPosts = this.parseBlogPosts(settingsMap.blogPosts?.value);
    const contentTimestamps = [
      settingsMap.websiteConfig?.updatedAt.toISOString(),
      ...categories.map((category) => category.updatedAt.toISOString()),
      ...products.map((product) => product.updatedAt.toISOString()),
      ...blogPosts.map((post) => post.publishedAt ?? post.updatedAt),
    ].filter((value): value is string => Boolean(value));

    const latestContentUpdatedAt = this.findLatestTimestamp(contentTimestamps);
    const latestCatalogUpdatedAt = this.findLatestTimestamp([
      ...categories.map((category) => category.updatedAt.toISOString()),
      ...products.map((product) => product.updatedAt.toISOString()),
      latestContentUpdatedAt ?? undefined,
    ]);
    const latestCampaignUpdatedAt = this.findLatestTimestamp([
      ...products
        .filter((product) => {
          const compareAtPrice = Number(product.compareAtPrice ?? 0);
          const price = Number(product.price ?? 0);
          return compareAtPrice > 0 && compareAtPrice > price;
        })
        .map((product) => product.updatedAt.toISOString()),
      latestCatalogUpdatedAt ?? undefined,
    ]);

    const entries: SitemapEntry[] = [
      {
        path: '/',
        lastModified: latestContentUpdatedAt,
        priority: '1.0',
        changeFrequency: 'daily',
        imageUrls: [this.toAbsoluteUrl(siteUrl, '/brand-logo.jpg')],
      },
      {
        path: '/kategoriler',
        lastModified: latestCatalogUpdatedAt,
        priority: '0.9',
        changeFrequency: 'daily',
      },
      {
        path: '/urunler',
        lastModified: latestCatalogUpdatedAt,
        priority: '0.9',
        changeFrequency: 'daily',
      },
      {
        path: '/kampanyalar',
        lastModified: latestCampaignUpdatedAt,
        priority: '0.8',
        changeFrequency: 'daily',
      },
      {
        path: '/iletisim',
        lastModified: latestContentUpdatedAt,
        priority: '0.7',
        changeFrequency: 'monthly',
      },
      {
        path: '/kvkk',
        lastModified: settingsMap.websiteConfig?.updatedAt.toISOString(),
        priority: '0.3',
        changeFrequency: 'yearly',
      },
      {
        path: '/gizlilik',
        lastModified: settingsMap.websiteConfig?.updatedAt.toISOString(),
        priority: '0.3',
        changeFrequency: 'yearly',
      },
      {
        path: '/satis-sozlesmesi',
        lastModified: settingsMap.websiteConfig?.updatedAt.toISOString(),
        priority: '0.3',
        changeFrequency: 'yearly',
      },
      ...categories.map((category) => ({
        path: `/urunler?kategori=${encodeURIComponent(category.slug)}`,
        lastModified: category.updatedAt.toISOString(),
        priority: '0.7',
        changeFrequency: 'weekly',
        imageUrls: category.imageUrl ? [category.imageUrl] : [],
      })),
      ...products.map((product) => ({
        path: product.slug ? `/urun/${product.slug}` : `/product/${product.id}`,
        lastModified: product.updatedAt.toISOString(),
        priority: '0.8',
        changeFrequency: 'weekly',
        imageUrls: this.productImageUrls(product),
      })),
      ...blogPosts.map((post) => ({
        path: `/blog/${post.slug}`,
        lastModified: post.publishedAt ?? post.updatedAt,
        priority: '0.6',
        changeFrequency: 'monthly',
        imageUrls: post.coverImageUrl ? [post.coverImageUrl] : [],
      })),
    ];

    const dedupedEntries = Array.from(
      new Map(entries.map((entry) => [entry.path, entry] satisfies [string, SitemapEntry])).values(),
    );
    const body = dedupedEntries
      .map((entry) => this.renderSitemapUrl(siteUrl, entry))
      .join('');

    return (
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ` +
      `xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">` +
      `${body}</urlset>`
    );
  }

  private async getSettingsMap(keys: string[]) {
    const records = await this.settingsRepository.find({
      where: { key: In(keys) },
    });

    return records.reduce<Record<string, Setting | undefined>>((accumulator, current) => {
      accumulator[current.key] = current;
      return accumulator;
    }, {});
  }

  private resolveSiteUrl(setting?: Setting) {
    const value = setting?.value?.trim();
    if (!value) {
      return 'http://localhost:5173';
    }

    const normalized = value.replace(/\/+$/, '');
    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }

    return `https://${normalized}`;
  }

  private toAbsoluteUrl(siteUrl: string, path: string) {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return new URL(normalizedPath, `${siteUrl}/`).toString();
  }

  private renderSitemapUrl(siteUrl: string, entry: SitemapEntry) {
    const lastModified = entry.lastModified ? `<lastmod>${this.escapeXml(entry.lastModified)}</lastmod>` : '';
    const changeFrequency = entry.changeFrequency
      ? `<changefreq>${this.escapeXml(entry.changeFrequency)}</changefreq>`
      : '';
    const priority = entry.priority ? `<priority>${this.escapeXml(entry.priority)}</priority>` : '';
    const images = (entry.imageUrls ?? [])
      .filter((value) => value.trim().length > 0)
      .map((value) => this.toAbsoluteUrl(siteUrl, value))
      .filter((value, index, array) => array.indexOf(value) === index)
      .map((value) => `<image:image><image:loc>${this.escapeXml(value)}</image:loc></image:image>`)
      .join('');

    return (
      `<url>` +
      `<loc>${this.escapeXml(this.toAbsoluteUrl(siteUrl, entry.path))}</loc>` +
      lastModified +
      changeFrequency +
      priority +
      images +
      `</url>`
    );
  }

  private parseBlogPosts(raw?: string | null) {
    if (!raw) {
      return [] as ParsedBlogPost[];
    }

    try {
      const parsed = JSON.parse(raw) as unknown[];
      if (!Array.isArray(parsed)) {
        return [] as ParsedBlogPost[];
      }

      return parsed
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const record = item as Record<string, unknown>;
          const slug = String(record.slug ?? '').trim();
          const title = String(record.title ?? '').trim();
          const updatedAt = String(record.updatedAt ?? '').trim();

          if (!slug || !title || !updatedAt || record.isPublished === false) {
            return null;
          }

          return {
            slug,
            publishedAt: record.publishedAt ? String(record.publishedAt) : null,
            updatedAt,
            coverImageUrl: record.coverImageUrl ? String(record.coverImageUrl) : null,
          } satisfies ParsedBlogPost;
        })
        .filter((item): item is ParsedBlogPost => item !== null);
    } catch {
      return [] as ParsedBlogPost[];
    }
  }

  private productImageUrls(product: Product) {
    const candidates = [product.featuredImage, ...(product.images ?? [])];
    return candidates.filter((value): value is string => Boolean(value && value.trim().length > 0));
  }

  private findLatestTimestamp(values: Array<string | undefined>) {
    const validDates = values
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .sort((left, right) => right.getTime() - left.getTime());

    return validDates[0]?.toISOString();
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
