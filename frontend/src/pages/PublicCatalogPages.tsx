import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PublicStorefrontLayout } from '../components/public/PublicStorefrontLayout';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { isInternalRoute, resolveStoreHref } from '../lib/public-site';
import { resolveProductImage as resolveCatalogProductImage } from '../lib/product-images';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
  Category,
  Product,
  PublicSettingsDto,
  WebsiteConfig,
  WebsiteManagedPageContent,
} from '../types/api';
import './PublicCatalogPages.css';

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

function usePublicCatalogData() {
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
      api.get<Product[]>('/catalog/public/products'),
    ])
      .then(([settingsResponse, categoriesResponse, productsResponse]) => {
        if (!mounted) {
          return;
        }

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
  }, []);

  return { categories, config, currency, loading, products };
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
      <Link className="pc-product-card-media" to={`/product/${product.id}`}>
        <img alt={product.name} src={resolveProductImage(product)} />
      </Link>

      <div className="pc-product-card-body">
        <span className="pc-product-card-category">{product.category?.name || 'Mağaza ürünü'}</span>
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
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

export function PublicCategoriesPage() {
  const location = useLocation();
  const { categories, config, currency, loading, products } = usePublicCatalogData();

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

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="pc-page-shell">
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
                    {image ? <img alt={category.name} src={image} /> : null}
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
                      <Link to={`/urunler?kategori=${encodeURIComponent(category.slug)}`}>Kategoriyi Aç</Link>
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
  const { categories, config, currency, loading, products } = usePublicCatalogData();

  const activeCategory = searchParams.get('kategori') ?? 'all';
  const activeQuery = searchParams.get('q') ?? '';

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

  const filteredProducts = useMemo(() => {
    const normalizedQuery = activeQuery.trim().toLocaleLowerCase('tr-TR');

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category?.slug === activeCategory;
      const haystack = [
        product.name,
        product.shortDescription,
        product.description,
        product.category?.name,
        ...(product.tags ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR');

      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, activeQuery, products]);

  const updateParams = (next: { kategori?: string; q?: string }) => {
    const params = new URLSearchParams(searchParams);

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

    setSearchParams(params, { replace: true });
  };

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="pc-page-shell">
        <ManagedPageHero eyebrow="Ürünler" page={config.pages.products} />

        <section className="pc-products-layout">
          <aside className="pc-products-sidebar">
            <div className="pc-sidebar-card">
              <span>Filtrele</span>
              <h2>Kategori seç</h2>
              <div className="pc-filter-list">
                <button
                  className={activeCategory === 'all' ? 'active' : ''}
                  onClick={() => updateParams({ kategori: 'all' })}
                  type="button"
                >
                  Tüm ürünler
                </button>
                {sortedCategories.map((category) => (
                  <button
                    className={activeCategory === category.slug ? 'active' : ''}
                    key={category.id}
                    onClick={() => updateParams({ kategori: category.slug })}
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
                <h2>{filteredProducts.length} ürün listelendi</h2>
              </div>

              <label className="pc-search-box">
                <span>Arama</span>
                <input
                  onChange={(event) => updateParams({ q: event.target.value })}
                  placeholder="Ürün, kategori veya etiket ara"
                  type="search"
                  value={activeQuery}
                />
              </label>
            </div>

            <div className="pc-product-grid">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <article className="pc-product-card skeleton" key={`product-skeleton-${index}`} />
                  ))
                : filteredProducts.map((product) => (
                    <ProductCatalogCard
                      currency={currency}
                      key={product.id}
                      onAdd={(item) => addProduct(item, 1)}
                      product={product}
                    />
                  ))}
            </div>

            {!loading && filteredProducts.length === 0 ? (
              <article className="pc-empty-state">
                <strong>Filtrelere uygun ürün bulunamadı</strong>
                <p>Admin panelinden yeni ürün ekleyebilir ya da farklı kategori seçerek listeyi yenileyebilirsiniz.</p>
                <button onClick={() => setSearchParams(new URLSearchParams())} type="button">
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
  const { config, currency, loading, products } = usePublicCatalogData();

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

  return (
    <PublicStorefrontLayout activePath={location.pathname} config={config} currency={currency}>
      <div className="pc-page-shell">
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
              <img alt={card.title} src={card.imageUrl} />
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
                  <img alt={product.name} src={resolveProductImage(product)} />
                  <div>
                    <span>{product.category?.name || 'Kampanyalı ürün'}</span>
                    <h3>{product.name}</h3>
                    <p>{product.shortDescription || 'Admin panelinden gelen indirimli ürün.'}</p>
                  </div>
                  <div className="pc-campaign-product-price">
                    <small>{formatter.format(parsePrice(product.compareAtPrice))}</small>
                    <strong>{formatter.format(parsePrice(product.price))}</strong>
                    <Link to={`/product/${product.id}`}>Ürünü Aç</Link>
                  </div>
                </article>
              ))}
        </section>

        <section className="pc-parallax-grid">
          {config.parallaxCards.map((card, index) => (
            <article className={index === 0 ? 'pc-parallax-card tall' : 'pc-parallax-card'} key={`${card.title}-${index}`}>
              <img alt={card.title} src={card.imageUrl} />
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
