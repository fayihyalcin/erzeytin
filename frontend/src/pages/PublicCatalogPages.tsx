import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PublicBreadcrumbs } from '../components/public/PublicBreadcrumbs';
import { PublicStorefrontLayout } from '../components/public/PublicStorefrontLayout';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import {
  isInternalRoute,
  resolvePublicCategoryFilterPath,
  resolvePublicProductPath,
  resolveStoreHref,
} from '../lib/public-site';
import { resolveProductImage as resolveCatalogProductImage } from '../lib/product-images';
import {
  buildBreadcrumbSchema,
  buildCollectionSchema,
  buildPageTitle,
  buildWebPageSchema,
  summarizeText,
  toAbsoluteSiteUrl,
} from '../lib/public-seo';
import { useSeo } from '../lib/seo';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
  Category,
  PaginatedResponse,
  Product,
  PublicSettingsDto,
  WebsiteConfig,
  WebsiteManagedPageContent,
} from '../types/api';
import './PublicCatalogPages.css';

const PUBLIC_PRODUCTS_PAGE_SIZE = 12;

function resolveProductImage(product: Product) {
  return resolveCatalogProductImage({
    id: product.id,
    name: product.name,
    categoryName: product.category?.name,
    featuredImage: product.featuredImage,
    images: product.images,
  });
}

function isVideoMedia(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url) || url.startsWith('data:video/');
}

function resolveManagedPoster(page: WebsiteManagedPageContent) {
  return page.posterUrl || page.mediaUrl || '';
}

function ManagedLink({
  children,
  className,
  href,
}: {
  children: ReactNode;
  className?: string;
  href: string;
}) {
  if (isInternalRoute(href)) {
    return (
      <Link className={className} to={href}>
        {children}
      </Link>
    );
  }

  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}

function parsePrice(value: string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveCategoryImage(category: Category, products: Product[]) {
  if (category.imageUrl) {
    return category.imageUrl;
  }

  const firstProduct = products.find((product) => product.category?.id === category.id);
  return firstProduct ? resolveProductImage(firstProduct) : '';
}

function usePublicCatalogData(options?: { includeProducts?: boolean }) {
  const includeProducts = options?.includeProducts ?? true;
  const [settings, setSettings] = useState<PublicSettingsDto | null>(null);
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState('TRY');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get<PublicSettingsDto>('/settings/public'),
      api.get<Category[]>('/catalog/public/categories'),
      includeProducts
        ? api.get<Product[]>('/catalog/public/products')
        : Promise.resolve({ data: [] as Product[] }),
    ])
      .then(([settingsResponse, categoriesResponse, productsResponse]) => {
        if (!mounted) {
          return;
        }

        setSettings(settingsResponse.data);
        setConfig(parseWebsiteConfig(settingsResponse.data.websiteConfig));
        setCurrency(settingsResponse.data.currency ?? 'TRY');
        setCategories(categoriesResponse.data);
        setProducts(productsResponse.data);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [includeProducts]);

  return { categories, config, currency, loading, products, settings };
}

function ManagedPageHero({
  page,
  eyebrow,
}: {
  page: WebsiteManagedPageContent;
  eyebrow: string;
}) {
  const hasVideo = Boolean(page.videoUrl) && isVideoMedia(page.videoUrl);
  const posterUrl = resolveManagedPoster(page);

  return (
    <section className="pc-page-hero">
      <div className="pc-page-hero-media" aria-hidden="true">
        {hasVideo ? (
          <video autoPlay className="pc-page-hero-video" loop muted playsInline poster={posterUrl || undefined}>
            <source src={page.videoUrl} />
          </video>
        ) : posterUrl ? (
          <img alt={page.title} className="pc-page-hero-image" src={posterUrl} />
        ) : null}
        <div className="pc-page-hero-overlay" />
      </div>

      <div className="pc-page-hero-shell">
        <div className="pc-page-hero-copy">
          <span className="pc-page-hero-badge">{page.badge || eyebrow}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="pc-page-hero-actions">
            <ManagedLink href={resolveStoreHref(page.primaryCtaHref, page.primaryCtaLabel)}>
              {page.primaryCtaLabel}
            </ManagedLink>
            <ManagedLink
              className="ghost"
              href={resolveStoreHref(page.secondaryCtaHref, page.secondaryCtaLabel)}
            >
              {page.secondaryCtaLabel}
            </ManagedLink>
          </div>
        </div>

        <aside className="pc-page-hero-summary">
          <strong>{page.summaryTitle}</strong>
          <p>{page.summaryText}</p>
          <ul>
            {page.highlights.map((item, index) => (
              <li key={`${page.title}-${index}`}>{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function ProductCatalogCard({
  currency,
  onAdd,
  product,
}: {
  currency: string;
  onAdd: (product: Product) => void;
  product: Product;
}) {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
      }),
    [currency],
  );
  const price = parsePrice(product.price);
  const compare = parsePrice(product.compareAtPrice);
  const hasDiscount = compare > price && price > 0;
  const inStock = product.stock > 0;

  return (
    <article className="pc-product-card">
      <Link className="pc-product-card-media" to={resolvePublicProductPath(product)}>
        <img alt={product.name} decoding="async" loading="lazy" src={resolveProductImage(product)} />
      </Link>

      <div className="pc-product-card-body">
        <span className="pc-product-card-category">{product.category?.name || 'Mağaza ürünü'}</span>
        <h3>
          <Link to={resolvePublicProductPath(product)}>{product.name}</Link>
        </h3>
        <p>{product.shortDescription || 'Admin panelinden yönetilen ürün kartı.'}</p>

        <div className="pc-product-card-meta">
          <span className={inStock ? 'in-stock' : 'out-stock'}>
            {inStock ? 'Stokta' : 'Tükendi'}
          </span>
          {hasDiscount ? <small>İndirimli fiyat</small> : <small>Standart fiyat</small>}
        </div>

        <div className="pc-product-card-footer">
          <div className="pc-product-card-price">
            {hasDiscount ? <span>{formatter.format(compare)}</span> : null}
            <strong>{formatter.format(price)}</strong>
          </div>
          <button disabled={!inStock} onClick={() => onAdd(product)} type="button">
            {inStock ? 'Sepete Ekle' : 'Tükendi'}
          </button>
        </div>
      </div>
    </article>
  );
}

function PublicCatalogPagination({
  page,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    const nextPages: number[] = [];

    for (let current = start; current <= end; current += 1) {
      nextPages.push(current);
    }

    return nextPages;
  }, [page, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pc-pagination" aria-label="Urun sayfalama">
      <p>
        Toplam <strong>{total}</strong> urun
      </p>
      <div className="pc-pagination-actions">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
          {'<'}
        </button>
        {pages.map((pageNumber) => (
          <button
            className={pageNumber === page ? 'active' : undefined}
            key={`public-page-${pageNumber}`}
            onClick={() => onPageChange(pageNumber)}
            type="button"
          >
            {pageNumber}
          </button>
        ))}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} type="button">
          {'>'}
        </button>
      </div>
    </nav>
  );
}

export function PublicCategoriesPage() {
  const location = useLocation();
  const { categories, config, currency, loading, products, settings } = usePublicCatalogData();

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) => {
        if (left.displayOrder !== right.displayOrder) {
          return left.displayOrder - right.displayOrder;
        }

        return left.name.localeCompare(right.name, 'tr');
      }),
    [categories],
  );

  const categorySummaries = useMemo(
    () =>
      sortedCategories.map((category) => {
        const categoryProducts = products.filter((product) => product.category?.id === category.id);

        return {
          category,
          image: resolveCategoryImage(category, products),
          productCount: categoryProducts.length,
          sampleProducts: categoryProducts.slice(0, 3),
        };
      }),
    [products, sortedCategories],
  );

  const siteUrl = settings?.siteUrl ?? null;
  const pageDescription = summarizeText(
    config.pages.categories.description ||
      'Er Zeytincilik kategori vitrini; zeytinyagi, zeytin ve gurme urunleri tek akista sunar.',
    155,
  );

  useSeo({
    title: buildPageTitle('Kategori vitrini', config.theme.brandName),
    description: pageDescription,
    canonicalUrl: toAbsoluteSiteUrl(siteUrl, '/kategoriler'),
    keywords: ['kategori', 'zeytinyagi', 'zeytin', 'gurme urunler'],
    siteName: config.theme.brandName,
    jsonLd: [
      buildWebPageSchema({
        siteUrl,
        path: '/kategoriler',
        title: 'Kategori vitrini',
        description: pageDescription,
      }),
      buildCollectionSchema({
        siteUrl,
        path: '/kategoriler',
        name: 'Kategori vitrini',
        description: pageDescription,
        items: categorySummaries.map(({ category }) => ({
          name: category.name,
          path: resolvePublicCategoryFilterPath(category.slug),
        })),
      }),
      buildBreadcrumbSchema(siteUrl, [
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Kategoriler', path: '/kategoriler' },
      ]),
    ],
  });

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="pc-page-shell">
        <PublicBreadcrumbs
          items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Kategoriler' },
          ]}
        />
        <ManagedPageHero eyebrow="Kategoriler" page={config.pages.categories} />

        <section className="pc-stat-strip">
          <article>
            <strong>{sortedCategories.length}</strong>
            <span>Aktif kategori</span>
          </article>
          <article>
            <strong>{products.length}</strong>
            <span>Yayında ürün</span>
          </article>
          <article>
            <strong>{config.featureItems.length}</strong>
            <span>Mağaza avantaj alanı</span>
          </article>
        </section>

        <section className="pc-section-head">
          <div>
            <span>Kategori vitrini</span>
            <h2>Mobilde de hızlı gezilen kategori akışı</h2>
            <p>Kategori görselleri, açıklamaları ve ürün adetleri adminden geldiği için sayfa hep güncel kalır.</p>
          </div>
          <Link to="/urunler">Tüm ürünleri aç</Link>
        </section>

        <section className="pc-category-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <article className="pc-category-card skeleton" key={`category-skeleton-${index}`} />
              ))
            : categorySummaries.map(({ category, image, productCount, sampleProducts }) => (
                <article className="pc-category-card" key={category.id}>
                  <div className="pc-category-card-media">
                    {image ? <img alt={category.name} decoding="async" loading="lazy" src={image} /> : null}
                    <span>{productCount} ürün</span>
                  </div>

                  <div className="pc-category-card-body">
                    <div>
                      <h3>{category.name}</h3>
                      <p>{category.description || 'Kategori açıklaması admin panelinden yönetilir.'}</p>
                    </div>

                    <div className="pc-category-card-chips">
                      {sampleProducts.length > 0 ? (
                        sampleProducts.map((product) => <span key={product.id}>{product.name}</span>)
                      ) : (
                        <span>Henüz ürün eklenmedi</span>
                      )}
                    </div>

                    <div className="pc-category-card-actions">
                      <Link to={resolvePublicCategoryFilterPath(category.slug)}>Kategoriyi Aç</Link>
                      <Link className="ghost" to="/iletisim">
                        Bilgi Al
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
        </section>
      </div>
    </PublicStorefrontLayout>
  );
}

export function PublicProductsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addProduct } = useStoreCart();
  const { categories, config, currency, loading, settings } = usePublicCatalogData({
    includeProducts: false,
  });

  const activeCategory = searchParams.get('kategori') ?? 'all';
  const activeQuery = searchParams.get('q') ?? '';
  const activePage = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const searchParamsKey = searchParams.toString();
  const [searchInput, setSearchInput] = useState(activeQuery);
  const deferredSearchInput = useDeferredValue(searchInput);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: PUBLIC_PRODUCTS_PAGE_SIZE,
    totalPages: 1,
  });

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) => {
        if (left.displayOrder !== right.displayOrder) {
          return left.displayOrder - right.displayOrder;
        }

        return left.name.localeCompare(right.name, 'tr');
      }),
    [categories],
  );

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  const updateParams = (next: { kategori?: string; page?: number; q?: string }) => {
    const params = new URLSearchParams(searchParamsKey);

    if (typeof next.kategori !== 'undefined') {
      if (!next.kategori || next.kategori === 'all') {
        params.delete('kategori');
      } else {
        params.set('kategori', next.kategori);
      }
    }

    if (typeof next.q !== 'undefined') {
      if (!next.q.trim()) {
        params.delete('q');
      } else {
        params.set('q', next.q.trim());
      }
    }

    if (typeof next.page !== 'undefined') {
      if (!next.page || next.page <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(next.page));
      }
    }

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const normalizedInput = deferredSearchInput.trim();
    if (normalizedInput === activeQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      updateParams({ q: normalizedInput, page: 1 });
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeQuery, deferredSearchInput, searchParamsKey]);

  useEffect(() => {
    let mounted = true;

    setProductsLoading(true);

    api
      .get<PaginatedResponse<Product>>('/catalog/public/products/list', {
        params: {
          page: activePage,
          pageSize: PUBLIC_PRODUCTS_PAGE_SIZE,
          search: activeQuery || undefined,
          category: activeCategory !== 'all' ? activeCategory : undefined,
        },
      })
      .then((response) => {
        if (!mounted) {
          return;
        }

        setProducts(response.data.items);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          pageSize: response.data.pageSize,
          totalPages: response.data.totalPages,
        });
      })
      .finally(() => {
        if (mounted) {
          setProductsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [activeCategory, activePage, activeQuery]);

  const siteUrl = settings?.siteUrl ?? null;
  const activeCategoryName =
    sortedCategories.find((category) => category.slug === activeCategory)?.name ?? '';
  const canonicalParams = new URLSearchParams();

  if (activeCategory !== 'all') {
    canonicalParams.set('kategori', activeCategory);
  }
  if (activePage > 1) {
    canonicalParams.set('page', String(activePage));
  }

  const canonicalPath = canonicalParams.toString()
    ? `/urunler?${canonicalParams.toString()}`
    : '/urunler';
  const pageTitle = activeCategoryName ? `${activeCategoryName} urunleri` : 'Tum urunler';
  const pageDescription = summarizeText(
    activeCategoryName
      ? `${activeCategoryName} kategorisindeki urunleri filtreli katalog akisi ile inceleyin.`
      : config.pages.products.description || 'Tum urunler filtreli katalog akisi ile listelenir.',
    155,
  );

  useSeo({
    title: buildPageTitle(pageTitle, config.theme.brandName),
    description: pageDescription,
    canonicalUrl: toAbsoluteSiteUrl(siteUrl, canonicalPath),
    robots: activeQuery.trim()
      ? 'noindex,follow,max-image-preview:large'
      : 'index,follow,max-image-preview:large',
    keywords: ['urunler', activeCategoryName, 'zeytinyagi', 'zeytin'].filter((item) => item),
    siteName: config.theme.brandName,
    jsonLd: [
      buildWebPageSchema({
        siteUrl,
        path: canonicalPath,
        title: pageTitle,
        description: pageDescription,
      }),
      buildCollectionSchema({
        siteUrl,
        path: canonicalPath,
        name: pageTitle,
        description: pageDescription,
        items: products.map((product) => ({
          name: product.name,
          path: resolvePublicProductPath(product),
        })),
      }),
      buildBreadcrumbSchema(siteUrl, [
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Urunler', path: '/urunler' },
        ...(activeCategoryName ? [{ name: activeCategoryName, path: canonicalPath }] : []),
      ]),
    ],
  });

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="pc-page-shell">
        <PublicBreadcrumbs
          items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Urunler', href: activeCategoryName ? '/urunler' : undefined },
            ...(activeCategoryName ? [{ label: activeCategoryName }] : []),
          ]}
        />
        <ManagedPageHero eyebrow="Ürünler" page={config.pages.products} />

        <section className="pc-products-layout">
          <aside className="pc-products-sidebar">
            <div className="pc-sidebar-card">
              <span>Filtrele</span>
              <h2>Kategori seç</h2>
              <div className="pc-filter-list">
                <button
                  className={activeCategory === 'all' ? 'active' : ''}
                  onClick={() => updateParams({ kategori: 'all', page: 1 })}
                  type="button"
                >
                  Tüm ürünler
                </button>
                {sortedCategories.map((category) => (
                  <button
                    className={activeCategory === category.slug ? 'active' : ''}
                    key={category.id}
                    onClick={() => updateParams({ kategori: category.slug, page: 1 })}
                    type="button"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pc-sidebar-card accent">
              <strong>{config.pages.products.summaryTitle}</strong>
              <p>{config.pages.products.summaryText}</p>
              <ul>
                {config.pages.products.highlights.map((item, index) => (
                  <li key={`products-highlight-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="pc-products-main">
            <div className="pc-products-toolbar">
              <div>
                <span>Katalog</span>
                <h2>{pagination.total} ürün listelendi</h2>
              </div>

              <label className="pc-search-box">
                <span>Arama</span>
                <input
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Ürün, kategori veya etiket ara"
                  type="search"
                  value={searchInput}
                />
              </label>
            </div>

            <div className="pc-product-grid">
              {loading || productsLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <article className="pc-product-card skeleton" key={`product-skeleton-${index}`} />
                  ))
                : products.map((product) => (
                    <ProductCatalogCard
                      currency={currency}
                      key={product.id}
                      onAdd={(item) => addProduct(item, 1)}
                      product={product}
                    />
                  ))}
            </div>

            <PublicCatalogPagination
              onPageChange={(page) => updateParams({ page })}
              page={pagination.page}
              total={pagination.total}
              totalPages={pagination.totalPages}
            />

            {!loading && !productsLoading && products.length === 0 ? (
              <article className="pc-empty-state">
                <strong>Filtrelere uygun ürün bulunamadı</strong>
                <p>Admin panelinden yeni ürün ekleyebilir ya da farklı kategori seçerek listeyi yenileyebilirsiniz.</p>
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams(new URLSearchParams(), { replace: true });
                  }}
                  type="button"
                >
                  Filtreleri temizle
                </button>
              </article>
            ) : null}
          </section>
        </section>
      </div>
    </PublicStorefrontLayout>
  );
}

export function PublicCampaignsPage() {
  const location = useLocation();
  const { config, currency, loading, products, settings } = usePublicCatalogData();

  const discountedProducts = useMemo(
    () =>
      products
        .filter((product) => parsePrice(product.compareAtPrice) > parsePrice(product.price))
        .sort((left, right) => parsePrice(right.compareAtPrice) - parsePrice(left.compareAtPrice))
        .slice(0, 6),
    [products],
  );

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
      }),
    [currency],
  );

  const siteUrl = settings?.siteUrl ?? null;
  const pageDescription = summarizeText(
    config.pages.campaigns.description ||
      'Kampanyalar, indirimli urunler ve promo bloklari tek sayfada sergilenir.',
    155,
  );

  useSeo({
    title: buildPageTitle('Kampanyalar', config.theme.brandName),
    description: pageDescription,
    canonicalUrl: toAbsoluteSiteUrl(siteUrl, '/kampanyalar'),
    keywords: ['kampanya', 'indirim', 'zeytinyagi', 'zeytin'],
    siteName: config.theme.brandName,
    jsonLd: [
      buildWebPageSchema({
        siteUrl,
        path: '/kampanyalar',
        title: 'Kampanyalar',
        description: pageDescription,
      }),
      buildCollectionSchema({
        siteUrl,
        path: '/kampanyalar',
        name: 'Kampanyalar',
        description: pageDescription,
        items: discountedProducts.map((product) => ({
          name: product.name,
          path: resolvePublicProductPath(product),
        })),
      }),
      buildBreadcrumbSchema(siteUrl, [
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Kampanyalar', path: '/kampanyalar' },
      ]),
    ],
  });

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="pc-page-shell">
        <PublicBreadcrumbs
          items={[
            { label: 'Ana Sayfa', href: '/' },
            { label: 'Kampanyalar' },
          ]}
        />
        <ManagedPageHero eyebrow="Kampanyalar" page={config.pages.campaigns} />

        <section className="pc-section-head">
          <div>
            <span>Fırsat blokları</span>
            <h2>Admin panelinden yönetilen kampanya modülleri</h2>
            <p>Ribbon, promo kartları ve öne çıkan indirimli ürünler bu sayfada satış odaklı bir dille birleşir.</p>
          </div>
          <ManagedLink href={resolveStoreHref(config.ribbon.ctaHref, config.ribbon.ctaLabel)}>
            {config.ribbon.ctaLabel}
          </ManagedLink>
        </section>

        <section className="pc-ribbon-banner" style={{ backgroundImage: `url(${config.ribbon.imageUrl})` }}>
          <div className="pc-ribbon-banner-overlay" />
          <div className="pc-ribbon-banner-copy">
            <span>{config.ribbon.eyebrow}</span>
            <h2>{config.ribbon.title}</h2>
            <ManagedLink href={resolveStoreHref(config.ribbon.ctaHref, config.ribbon.ctaLabel)}>
              {config.ribbon.ctaLabel}
            </ManagedLink>
          </div>
        </section>

        <section className="pc-promo-grid">
          {config.promoCards.map((card, index) => (
            <article className={index === 0 ? 'pc-promo-card featured' : 'pc-promo-card'} key={`${card.title}-${index}`}>
              <img alt={card.title} decoding="async" loading="lazy" src={card.imageUrl} />
              <div className="pc-promo-card-copy">
                <span>Promo modulu</span>
                <h3>{card.title}</h3>
                <p>{card.subtitle}</p>
                <ManagedLink href={resolveStoreHref(card.ctaHref, card.ctaLabel)}>{card.ctaLabel}</ManagedLink>
              </div>
            </article>
          ))}
        </section>

        <section className="pc-section-head">
          <div>
            <span>İndirimli ürünler</span>
            <h2>Fiyat avantajına sahip ürünleri öne çıkarın</h2>
            <p>Fiyat ve karşılaştırma fiyatına göre dinamik olarak oluşan liste müşteriyi hızlı satın almaya yönlendirir.</p>
          </div>
          <Link to="/urunler">Tüm ürünleri gör</Link>
        </section>

        <section className="pc-campaign-products">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <article className="pc-campaign-product skeleton" key={`campaign-skeleton-${index}`} />
              ))
            : discountedProducts.map((product) => (
                <article className="pc-campaign-product" key={product.id}>
                  <img alt={product.name} decoding="async" loading="lazy" src={resolveProductImage(product)} />
                  <div>
                    <span>{product.category?.name || 'Kampanyalı ürün'}</span>
                    <h3>{product.name}</h3>
                    <p>{product.shortDescription || 'Admin panelinden gelen indirimli ürün.'}</p>
                  </div>
                  <div className="pc-campaign-product-price">
                    <small>{formatter.format(parsePrice(product.compareAtPrice))}</small>
                    <strong>{formatter.format(parsePrice(product.price))}</strong>
                    <Link to={resolvePublicProductPath(product)}>Ürünü Aç</Link>
                  </div>
                </article>
              ))}
        </section>

        <section className="pc-parallax-grid">
          {config.parallaxCards.map((card, index) => (
            <article className={index === 0 ? 'pc-parallax-card tall' : 'pc-parallax-card'} key={`${card.title}-${index}`}>
              <img alt={card.title} decoding="async" loading="lazy" src={card.imageUrl} />
              <div className="pc-parallax-card-copy">
                <span>Vitrin blogu</span>
                <h3>{card.title}</h3>
                <p>{card.subtitle}</p>
                <ManagedLink href={resolveStoreHref(card.ctaHref, card.ctaLabel)}>{card.ctaLabel}</ManagedLink>
              </div>
            </article>
          ))}
        </section>
      </div>
    </PublicStorefrontLayout>
  );
}
