import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { StorefrontBrandLink } from '../components/public/StorefrontBrandLink';
import { StorefrontMobileCategoryStrip } from '../components/public/StorefrontMobileCategoryStrip';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { parseBlogPosts } from '../lib/admin-content';
import { resolveAssetUrl } from '../lib/asset-url';
import { resolvePublicProductPath, resolveStoreNavItemHref } from '../lib/public-site';
import { resolveProductImage as resolveCatalogProductImage } from '../lib/product-images';
import { buildStoreHeaderNavItems } from '../lib/storefront-navigation';
import {
  buildBreadcrumbSchema,
  buildDefaultSeoImageUrl,
  buildOrganizationSchema,
  buildPageTitle,
  buildSiteKeywords,
  buildWebPageSchema,
  buildWebsiteSchema,
  summarizeText,
  toAbsoluteSiteUrl,
} from '../lib/public-seo';
import { useSeo } from '../lib/seo';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
  BlogPost,
  Category,
  Product,
  PublicSettingsDto,
  WebsiteConfig,
  WebsiteFeatureItem,
  WebsiteHeroSlide,
  WebsitePromoCard,
} from '../types/api';
import './StorefrontPage.css';

function resolveProductImage(product: Product) {
  return resolveCatalogProductImage({
    id: product.id,
    name: product.name,
    categoryName: product.category?.name,
    featuredImage: product.featuredImage,
    images: product.images,
  });
}

function featureIconSymbol(icon: string) {
  const normalized = icon.trim().toLowerCase();
  if (normalized === 'truck') {
    return 'TR';
  }
  if (normalized === 'shield') {
    return 'SV';
  }
  if (normalized === 'gift') {
    return 'HD';
  }
  if (normalized === 'leaf') {
    return 'DG';
  }
  return 'ER';
}

function FeatureIcon({ item }: { item: WebsiteFeatureItem }) {
  return <span className="sf-feature-icon">{featureIconSymbol(item.icon)}</span>;
}

function countDownParts(ms: number) {
  const remaining = Math.max(ms, 0);
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((remaining / (1000 * 60)) % 60);
  const secs = Math.floor((remaining / 1000) % 60);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    mins: String(mins).padStart(2, '0'),
    secs: String(secs).padStart(2, '0'),
  };
}

function isVideoMedia(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url) || url.startsWith('data:video/');
}

function resolveHeroPoster(slide: WebsiteHeroSlide) {
  return resolveAssetUrl(slide.posterUrl || slide.imageUrl || '');
}

function ProductShowcaseCard({
  product,
  formatter,
  onAdd,
}: {
  product: Product;
  formatter: Intl.NumberFormat;
  onAdd: (id: string) => void;
}) {
  const price = Number(product.price ?? 0);
  const compare = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price > 0;
  const inStock = product.stock > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;

  return (
    <article className="sf-product-card">
      <div className="sf-product-media">
        <Link className="sf-card-link-media" to={resolvePublicProductPath(product)}>
          <img decoding="async" loading="lazy" src={resolveProductImage(product)} alt={product.name} />
        </Link>
      </div>

      <p className="sf-product-category-tag">{product.category?.name || 'Zeytin ve Zeytinyağı'}</p>
      <h4>
        <Link className="sf-card-link-title" to={resolvePublicProductPath(product)}>
          {product.name}
        </Link>
      </h4>

      <div className="sf-product-inline-meta">
        <span className={inStock ? 'in-stock' : 'out-of-stock'}>
          {inStock ? 'Stokta' : 'Tükendi'}
        </span>
        <span>{inStock ? 'Hızlı teslimat' : 'Stok yenileniyor'}</span>
      </div>

      {hasDiscount ? (
        <p className="sf-product-discount-tag">%{discountPercent} indirim</p>
      ) : null}

      <p className="sf-product-shipping-note">Sepette ekstra ücret çıkmaz</p>

      <div className="sf-product-card-footer">
        <div className="sf-price-row">
          {hasDiscount ? <span className="sf-price-old">{formatter.format(compare)}</span> : null}
          <strong>{formatter.format(price)}</strong>
        </div>

        <div className="sf-product-card-actions">
          <Link className="sf-product-detail-link" to={resolvePublicProductPath(product)}>
            Incele
          </Link>
          <button
            className="sf-add-cart"
            disabled={!inStock}
            type="button"
            onClick={() => onAdd(product.id)}
          >
            {inStock ? 'Hızlı Ekle' : 'Tükendi'}
          </button>
        </div>
      </div>
    </article>
  );
}

function FeaturedProductCard({
  product,
  index,
  formatter,
  onAdd,
  onPreview,
}: {
  product: Product;
  index: number;
  formatter: Intl.NumberFormat;
  onAdd: (id: string) => void;
  onPreview: (product: Product) => void;
}) {
  const price = Number(product.price ?? 0);
  const compare = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;
  const rating = 4 + (index % 2);
  const inStock = product.stock > 0;

  return (
    <article className="sf-featured-card">
      <div className="sf-featured-media">
        {hasDiscount ? <span className="sf-featured-discount">%{discountPercent}</span> : null}
        <Link className="sf-card-link-media" to={resolvePublicProductPath(product)}>
          <img decoding="async" loading="lazy" src={resolveProductImage(product)} alt={product.name} />
        </Link>
      </div>

      <h4>
        <Link className="sf-card-link-title" to={resolvePublicProductPath(product)}>
          {product.name}
        </Link>
      </h4>
      <p className="sf-featured-meta">{product.category?.name || 'Zeytin ve Zeytinyağı'}</p>
      <p className={inStock ? 'sf-featured-stock in' : 'sf-featured-stock out'}>
        {inStock ? 'Stokta' : 'Tükendi'}
      </p>

      <div className="sf-featured-rating" aria-label={`Rating ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <span
            key={`${product.id}-rate-${starIndex}`}
            className={starIndex < rating ? 'rate-on' : 'rate-off'}
          />
        ))}
        <small>{120 + index}</small>
      </div>

      <div className="sf-featured-price">
        {hasDiscount ? <span className="old">{formatter.format(compare)}</span> : null}
        <strong>{formatter.format(price)}</strong>
      </div>

      <div className="sf-featured-actions">
        <button className="primary" disabled={!inStock} type="button" onClick={() => onAdd(product.id)}>
          {inStock ? 'Sepete Ekle' : 'Tükendi'}
        </button>
        <button className="ghost" type="button" onClick={() => onPreview(product)}>
          Ön İzleme
        </button>
      </div>
    </article>
  );
}

function HeroFeaturedProductCard({
  product,
  formatter,
  onAdd,
}: {
  product: Product;
  formatter: Intl.NumberFormat;
  onAdd: (id: string) => void;
}) {
  const price = Number(product.price ?? 0);
  const compare = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;
  const inStock = product.stock > 0;

  return (
    <article className="sf-hero-product-card">
      <Link className="sf-hero-product-media" to={resolvePublicProductPath(product)}>
        {hasDiscount ? <span className="sf-hero-product-badge">%{discountPercent}</span> : null}
        <img decoding="async" loading="lazy" src={resolveProductImage(product)} alt={product.name} />
      </Link>

      <div className="sf-hero-product-copy">
        <p className="sf-hero-product-category">{product.category?.name || 'Zeytin ve Zeytinyağı'}</p>
        <h3>
          <Link to={resolvePublicProductPath(product)}>{product.name}</Link>
        </h3>
        <p className={inStock ? 'sf-hero-product-stock in' : 'sf-hero-product-stock out'}>
          {inStock ? 'Stokta, hızlı gönderi' : 'Tükendi'}
        </p>

        <div className="sf-hero-product-footer">
          <div className="sf-hero-product-price">
            {hasDiscount ? <span className="old">{formatter.format(compare)}</span> : null}
            <strong>{formatter.format(price)}</strong>
          </div>

          <button disabled={!inStock} type="button" onClick={() => onAdd(product.id)}>
            {inStock ? 'Sepete Ekle' : 'Tükendi'}
          </button>
        </div>
      </div>
    </article>
  );
}

function HeroFeaturedPlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="sf-hero-product-card placeholder" aria-hidden="true">
      <div className="sf-hero-product-media sf-hero-product-media--placeholder" />

      <div className="sf-hero-product-copy">
        <p className="sf-hero-product-category">Vitrin Alanı</p>
        <h3>{title}</h3>
        <p className="sf-hero-product-stock pending">{description}</p>

        <div className="sf-hero-product-footer">
          <div className="sf-hero-product-price">
            <span className="old">Ürün slotu</span>
            <strong>Yakında</strong>
          </div>

          <button disabled type="button">
            Beklemede
          </button>
        </div>
      </div>
    </article>
  );
}

function BestSellerCard({
  product,
  index,
  formatter,
  onAdd,
  onPreview,
}: {
  product: Product;
  index: number;
  formatter: Intl.NumberFormat;
  onAdd: (id: string) => void;
  onPreview: (product: Product) => void;
}) {
  const price = Number(product.price ?? 0);
  const compare = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;
  const inStock = product.stock > 0;

  let badgeLabel = '';
  let badgeClass = 'discount';
  if (index === 2) {
    badgeLabel = 'Öne Çıkan';
    badgeClass = 'top';
  } else if (index === 5) {
    badgeLabel = 'Süper Fiyat';
    badgeClass = 'super';
  } else if (hasDiscount) {
    badgeLabel = `%${discountPercent}`;
    badgeClass = 'discount';
  }

  const rating = 4 + (index % 2);

  return (
    <article className={index === 0 ? 'sf-best-card highlight' : 'sf-best-card'}>
      <div className="sf-best-media">
        {badgeLabel ? <span className={`sf-best-badge ${badgeClass}`}>{badgeLabel}</span> : null}
        <Link className="sf-card-link-media" to={resolvePublicProductPath(product)}>
          <img decoding="async" loading="lazy" src={resolveProductImage(product)} alt={product.name} />
        </Link>

        <div className="sf-best-float-actions">
          <button type="button" onClick={() => onPreview(product)} aria-label="Ön izleme">
            ON
          </button>
          <button type="button" onClick={() => onAdd(product.id)} aria-label="Sepete ekle">
            SE
          </button>
        </div>

        <div className="sf-best-dots" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, dotIndex) => (
            <span
              key={`${product.id}-dot-${dotIndex}`}
              className={dotIndex === 0 ? 'active' : undefined}
            />
          ))}
        </div>
      </div>

      <h4>
        <Link className="sf-card-link-title" to={resolvePublicProductPath(product)}>
          {product.name}
        </Link>
      </h4>

      <div className="sf-best-rating">
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <span
            key={`${product.id}-best-rate-${starIndex}`}
            className={starIndex < rating ? 'on' : 'off'}
          />
        ))}
        <small>1</small>
      </div>

      <div className="sf-best-price">
        {hasDiscount ? <span className="old">{formatter.format(compare)}</span> : null}
        <strong>{formatter.format(price)}</strong>
      </div>

      <p className="sf-best-delivery">2 Günde Teslimat</p>

      <div className="sf-best-footer">
        <button disabled={!inStock} type="button" onClick={() => onAdd(product.id)}>
          {inStock ? 'Sepete Ekle' : 'Tükendi'}
        </button>
        <button
          className="preview"
          type="button"
          onClick={() => onPreview(product)}
        >
          Ön İzleme
        </button>
      </div>
    </article>
  );
}

function MostPopularCard({
  product,
  index,
  formatter,
  onAdd,
  onPreview,
}: {
  product: Product;
  index: number;
  formatter: Intl.NumberFormat;
  onAdd: (id: string) => void;
  onPreview: (product: Product) => void;
}) {
  const price = Number(product.price ?? 0);
  const compare = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;
  const rating = 3 + (index % 3);
  const inStock = product.stock > 0;

  return (
    <article className="sf-most-card">
      <div className="sf-most-media">
        <span className="sf-most-hot">Popüler</span>
        {hasDiscount ? <span className="sf-most-off">-{discountPercent}%</span> : null}
        <button className="sf-most-fav" type="button" aria-label={`${product.name} favorilere ekle`}>
          +
        </button>
        <Link className="sf-card-link-media" to={resolvePublicProductPath(product)}>
          <img decoding="async" loading="lazy" src={resolveProductImage(product)} alt={product.name} />
        </Link>
      </div>

      <p className="sf-most-category">{product.category?.name || 'Kategori'}</p>
      <h4>
        <Link className="sf-card-link-title" to={resolvePublicProductPath(product)}>
          {product.name}
        </Link>
      </h4>

      <div className="sf-most-rating">
        {Array.from({ length: 5 }).map((_, starIndex) => (
          <span
            key={`${product.id}-most-rate-${starIndex}`}
            className={starIndex < rating ? 'on' : 'off'}
          />
        ))}
        <small>1</small>
      </div>

      <div className="sf-most-price">
        {hasDiscount ? <span className="old">{formatter.format(compare)}</span> : null}
        <strong>{formatter.format(price)}</strong>
      </div>

      <div className="sf-most-actions">
        <button disabled={!inStock} type="button" onClick={() => onAdd(product.id)}>
          {inStock ? 'Sepete Ekle' : 'Tükendi'}
        </button>
        <button className="ghost" type="button" onClick={() => onPreview(product)}>
          Ön İzleme
        </button>
      </div>
    </article>
  );
}

function PromoCta({
  card,
  className,
}: {
  card: WebsitePromoCard;
  className?: string;
}) {
  return (
    <article className={className ? `sf-promo-card ${className}` : 'sf-promo-card'}>
      <img decoding="async" loading="lazy" src={card.imageUrl} alt={card.title} />
      <div className="sf-promo-overlay">
        <span>%20 avantaj fırsatı</span>
        <h4>{card.title}</h4>
        <p>{card.subtitle}</p>
        <a href={card.ctaHref}>{card.ctaLabel}</a>
      </div>
    </article>
  );
}

function normalizeFooterLabel(label: string) {
  return label
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveFooterLink(linkLabel: string) {
  const normalized = normalizeFooterLabel(linkLabel);

  if (normalized.includes('iletisim')) {
    return '/iletisim';
  }
  if (normalized.includes('kvkk')) {
    return '/kvkk';
  }
  if (normalized.includes('gizlilik')) {
    return '/gizlilik';
  }
  if (
    normalized.includes('satis') ||
    normalized.includes('iade') ||
    normalized.includes('kargo') ||
    normalized.includes('teslimat')
  ) {
    return '/satis-sozlesmesi';
  }
  if (
    normalized.includes('siparis') ||
    normalized.includes('favori') ||
    normalized.includes('adres') ||
    normalized.includes('hesabim')
  ) {
    return '/customer/dashboard';
  }
  if (normalized.includes('sikca') || normalized.includes('soru') || normalized.includes('sss')) {
    return '/gizlilik';
  }
  if (normalized.includes('uretim') || normalized.includes('surec') || normalized.includes('kampanya')) {
    return '/kampanyalar';
  }
  if (normalized.includes('hakkimizda')) {
    return '/';
  }
  if (normalized.includes('urun') || normalized.includes('magaza') || normalized.includes('kategori')) {
    return '/urunler';
  }

  return '/iletisim';
}

function isInternalRoute(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

function BlogPreviewCard({ post }: { post: BlogPost }) {
  const publishedLabel = new Date(post.publishedAt ?? post.updatedAt).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="sf-blog-card">
      <Link className="sf-blog-media" to={`/blog/${post.slug}`}>
        {post.coverImageUrl ? (
          <img decoding="async" loading="lazy" src={post.coverImageUrl} alt={post.title} />
        ) : (
          <span>{post.category || 'Blog'}</span>
        )}
      </Link>

      <div className="sf-blog-body">
        <div className="sf-blog-meta">
          <span>{post.category || 'Genel'}</span>
          <time dateTime={post.publishedAt ?? post.updatedAt}>{publishedLabel}</time>
        </div>

        <h4>
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h4>

        <p>{post.excerpt || post.seoDescription || 'Bu yazı için özet içerik yakında eklenecek.'}</p>

        {post.tags.length > 0 ? (
          <div className="sf-blog-tags">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={`${post.id}-${tag}`}>{tag}</span>
            ))}
          </div>
        ) : null}

        <Link className="sf-blog-link" to={`/blog/${post.slug}`}>
          Yazıyı Oku
        </Link>
      </div>
    </article>
  );
}

export function StorefrontPage() {
  const { addProduct, itemCount: cartCount, subtotal: cartSubtotal } = useStoreCart();
  const { isAuthenticated: isCustomerAuthenticated, logout: logoutCustomer } =
    useCustomerAuth();
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const [settings, setSettings] = useState<PublicSettingsDto | null>(null);
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewQty, setPreviewQty] = useState(1);
  const [hotStart, setHotStart] = useState(0);
  const [popularTab, setPopularTab] = useState('all');
  const [popularStart, setPopularStart] = useState(0);
  const [popularVisibleCount, setPopularVisibleCount] = useState(6);
  const [dealDeadline] = useState(
    () => Date.now() + 1000 * ((2 * 24 + 9) * 60 * 60 + 12 * 60 + 30),
  );
  const [clockNow, setClockNow] = useState(Date.now());
  const heroVideoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  useEffect(() => {
    document.body.classList.add('storefront-body');
    return () => {
      document.body.classList.remove('storefront-body');
    };
  }, []);

  useEffect(() => {
    const className = 'sf-mobile-nav-open';
    if (mobileMenuOpen) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }

    return () => {
      document.body.classList.remove(className);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

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

        setSettings(settingsResponse.data);
        setConfig(parseWebsiteConfig(settingsResponse.data.websiteConfig));
        setCategories(categoriesResponse.data);
        setProducts(productsResponse.data);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setConfig(defaultConfig);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [defaultConfig]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!previewProduct) {
      document.body.classList.remove('sf-modal-open');
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewProduct(null);
      }
    };

    document.body.classList.add('sf-modal-open');
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('sf-modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [previewProduct]);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        setPopularVisibleCount(1);
        return;
      }
      if (width <= 920) {
        setPopularVisibleCount(2);
        return;
      }
      if (width <= 1200) {
        setPopularVisibleCount(3);
        return;
      }
      if (width <= 1440) {
        setPopularVisibleCount(4);
        return;
      }

      setPopularVisibleCount(6);
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => {
      window.removeEventListener('resize', updateVisibleCount);
    };
  }, []);

  const heroSlides = config.heroSlides.length > 0 ? config.heroSlides : defaultConfig.heroSlides;
  const promoCards = config.promoCards.length > 0 ? config.promoCards : defaultConfig.promoCards;
  const featureItems =
    config.featureItems.length > 0 ? config.featureItems : defaultConfig.featureItems;
  const footerColumns =
    config.footerColumns.length > 0 ? config.footerColumns : defaultConfig.footerColumns;
  const blogPosts = useMemo(
    () => parseBlogPosts(settings?.blogPosts).filter((item) => item.isPublished).slice(0, 3),
    [settings?.blogPosts],
  );
  const ribbon = config.ribbon.title ? config.ribbon : defaultConfig.ribbon;
  const contact = config.contact.phoneDisplay ? config.contact : defaultConfig.contact;
  const homeSections = config.homeSections;

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % heroSlides.length);
    }, isVideoMedia(heroSlides[slideIndex]?.videoUrl ?? '') ? 8200 : 5600);

    return () => {
      window.clearInterval(interval);
    };
  }, [heroSlides, slideIndex]);

  useEffect(() => {
    if (slideIndex < heroSlides.length) {
      return;
    }

    setSlideIndex(0);
  }, [slideIndex, heroSlides.length]);

  useEffect(() => {
    Object.entries(heroVideoRefs.current).forEach(([key, video]) => {
      if (!video) {
        return;
      }

      const isActive = Number(key) === slideIndex;
      if (isActive) {
        void video.play().catch(() => undefined);
        return;
      }

      video.pause();
      video.currentTime = 0;
    });
  }, [slideIndex]);

  const currency = settings?.currency?.toUpperCase() || 'TRY';
  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 2,
      });
    }
  }, [currency]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return products;
    }

    return products.filter((product) => {
      const values = [product.name, product.category?.name ?? '', ...(product.tags ?? [])];
      return values.some((value) => value.toLowerCase().includes(keyword));
    });
  }, [products, search]);

  const productPool = filteredProducts.length > 0 ? filteredProducts : products;

  const headerNavItems = useMemo(() => buildStoreHeaderNavItems(categories), [categories]);

  useEffect(() => {
    if (productPool.length <= 5) {
      setHotStart(0);
      return;
    }

    if (hotStart < productPool.length) {
      return;
    }

    setHotStart(0);
  }, [hotStart, productPool.length]);

  const hotProducts = useMemo(() => {
    if (productPool.length <= 5) {
      return productPool;
    }

    const doubled = [...productPool, ...productPool];
    return doubled.slice(hotStart, hotStart + 5);
  }, [productPool, hotStart]);

  const heroFeaturedProducts = useMemo(() => {
    const inStockProducts = productPool.filter((product) => product.stock > 0);
    const soldOutProducts = productPool.filter((product) => product.stock <= 0);

    return [...inStockProducts, ...soldOutProducts].slice(0, 3);
  }, [productPool]);

  const heroFeaturedPlaceholders = useMemo(() => {
    return [
      {
        id: 'hero-slot-1',
        title: 'Yeni Sezon Seçkisi',
        description: 'Ürün yüklendiğinde burada görünecek.',
      },
      {
        id: 'hero-slot-2',
        title: 'Günlük Favori',
        description: 'Sağ kolondaki ürün vitrini için hazır.',
      },
      {
        id: 'hero-slot-3',
        title: 'Vitrin Ürünü',
        description: 'Bu kart otomatik olarak ürünle dolacak.',
      },
    ].slice(Math.max(heroFeaturedProducts.length, 0), 3);
  }, [heroFeaturedProducts.length]);

  const featuredProducts = useMemo(() => productPool.slice(0, 10), [productPool]);
  const bestSellerProducts = useMemo(() => productPool.slice(0, 6), [productPool]);
  const popularTabs = useMemo(() => {
    if (categories.length > 0) {
      return categories.slice(0, 5).map((category) => ({
        id: category.id,
        label: category.name,
      }));
    }

    return [
      { id: 'sizma-zeytinyagi', label: 'Sızma Zeytinyağı' },
      { id: 'gemlik-siyah-zeytin', label: 'Siyah Zeytin' },
      { id: 'yesil-zeytin', label: 'Yeşil Zeytin' },
      { id: 'gurme', label: 'Gurme' },
    ];
  }, [categories]);

  const mostPopularProducts = useMemo(() => {
    if (popularTab === 'all') {
      return productPool;
    }

    return productPool.filter((product) => {
      if (!product.category) {
        return false;
      }

      return product.category.id === popularTab || product.category.slug === popularTab;
    });
  }, [productPool, popularTab]);

  useEffect(() => {
    setPopularStart(0);
  }, [popularTab, popularVisibleCount]);

  useEffect(() => {
    if (mostPopularProducts.length <= popularVisibleCount) {
      setPopularStart(0);
      return;
    }

    if (popularStart < mostPopularProducts.length) {
      return;
    }

    setPopularStart(0);
  }, [popularStart, mostPopularProducts.length, popularVisibleCount]);

  const popularDisplayProducts = useMemo(() => {
    if (mostPopularProducts.length === 0) {
      return [];
    }

    if (mostPopularProducts.length <= popularVisibleCount) {
      return mostPopularProducts;
    }

    const doubled = [...mostPopularProducts, ...mostPopularProducts];
    return doubled.slice(popularStart, popularStart + popularVisibleCount);
  }, [mostPopularProducts, popularStart, popularVisibleCount]);

  const highlightedSlide = heroSlides[slideIndex] ?? heroSlides[0];
  const promoPrimary = promoCards[0];
  const promoSecondary = promoCards[1] ?? promoCards[0];
  const promoTertiary = promoCards[2] ?? promoCards[0];
  const siteUrl = settings?.siteUrl ?? null;
  const homeImageUrl = highlightedSlide?.imageUrl
    ? toAbsoluteSiteUrl(siteUrl, highlightedSlide.imageUrl)
    : buildDefaultSeoImageUrl(siteUrl);
  const homeKeywords = buildSiteKeywords({
    brandName: config.theme.brandName,
    tagline: config.theme.tagline,
    categoryNames: categories.map((category) => category.name),
    extra: heroFeaturedProducts.map((product) => product.name),
  });
  const homeDescription = summarizeText(
    highlightedSlide?.description ||
      config.announcement ||
      `${config.theme.brandName} dogal zeytin ve zeytinyagi urunlerini modern storefront akisi ile sunar.`,
    155,
  );

  useSeo({
    title: buildPageTitle(config.theme.brandName || 'Er Zeytincilik', config.theme.brandName),
    description: homeDescription,
    canonicalUrl: toAbsoluteSiteUrl(siteUrl, '/'),
    keywords: homeKeywords,
    siteName: config.theme.brandName,
    imageUrl: homeImageUrl,
    imageAlt: `${config.theme.brandName} ana sayfa`,
    jsonLd: [
      buildWebPageSchema({
        siteUrl,
        path: '/',
        title: config.theme.brandName,
        description: homeDescription,
        imageUrl: homeImageUrl,
      }),
      buildOrganizationSchema({
        siteUrl,
        name: config.theme.brandName,
        email: contact.email,
        phone: contact.phoneDisplay,
        logoUrl: buildDefaultSeoImageUrl(siteUrl),
      }),
      buildWebsiteSchema({
        siteUrl,
        name: config.theme.brandName,
        description: homeDescription,
        imageUrl: homeImageUrl,
      }),
      buildBreadcrumbSchema(siteUrl, [{ name: 'Ana Sayfa', path: '/' }]),
    ],
  });

  const dealClock = useMemo(
    () => countDownParts(dealDeadline - clockNow),
    [dealDeadline, clockNow],
  );
  const previewMaxQuantity = previewProduct ? Math.max(previewProduct.stock, 0) : 0;
  const previewCanPurchase = previewMaxQuantity > 0;

  const addToCart = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    addProduct(product, 1);
  };

  const addToCartWithQty = (productId: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    addProduct(product, safeQuantity);
  };

  const openPreview = (product: Product) => {
    setPreviewProduct(product);
    setPreviewQty(product.stock > 0 ? 1 : 0);
  };

  const closePreview = () => {
    setPreviewProduct(null);
    setPreviewQty(1);
  };

  const goToNextSlide = () => {
    setSlideIndex((current) => (current + 1) % Math.max(heroSlides.length, 1));
  };

  const goToPrevSlide = () => {
    setSlideIndex((current) => (current === 0 ? Math.max(heroSlides.length - 1, 0) : current - 1));
  };

  const nextHotProducts = () => {
    if (productPool.length <= 5) {
      return;
    }

    setHotStart((current) => (current + 1) % productPool.length);
  };

  const prevHotProducts = () => {
    if (productPool.length <= 5) {
      return;
    }

    setHotStart((current) => (current === 0 ? productPool.length - 1 : current - 1));
  };

  const nextPopularProducts = () => {
    if (mostPopularProducts.length <= popularVisibleCount) {
      return;
    }

    setPopularStart((current) => (current + 1) % mostPopularProducts.length);
  };

  const prevPopularProducts = () => {
    if (mostPopularProducts.length <= popularVisibleCount) {
      return;
    }

    setPopularStart((current) =>
      current === 0 ? mostPopularProducts.length - 1 : current - 1,
    );
  };

  return (
    <div className="storefront-page">
      <div className="sf-top-strip">
        <div className="sf-container sf-top-inner">
          <div className="sf-top-left">
            <span>Destek ve sipariş hattı</span>
            <strong>Bizi Ara</strong>
            <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
          </div>

          <div className="sf-top-center">
            <span>Türkçe</span>
            <span>{currency}</span>
            <span className="sf-top-badge">%25 İndirim</span>
            <span>{config.announcement}</span>
          </div>

          <div className="sf-top-right">
            <Link to={isCustomerAuthenticated ? '/customer/dashboard' : '/customer/login'}>
              {isCustomerAuthenticated ? 'Hesabım' : 'Müşteri Girişi'}
            </Link>
            <Link to="/satis-sozlesmesi">Satış Sözleşmesi</Link>
            <Link to="/iletisim">İletişim</Link>
          </div>
        </div>
      </div>

      <header className="sf-main-header">
        <div className="sf-container sf-brand-row">
          <StorefrontBrandLink brandName={config.theme.brandName} />

          <form
            className="sf-search-form"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              type="search"
              placeholder="Zeytinyağı, zeytin, kategori ara"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" aria-label="Ürün ara">
              Ara
            </button>
          </form>

          <div className="sf-header-actions">
            <Link
              aria-label={isCustomerAuthenticated ? 'Müşteri paneli' : 'Müşteri girişi'}
              className="sf-customer-btn sf-header-icon-button"
              to={isCustomerAuthenticated ? '/customer/dashboard' : '/customer/login'}
            >
              <span className="sf-header-action-icon sf-header-action-icon-user" aria-hidden="true" />
              <span className="sf-header-action-label">
                {isCustomerAuthenticated ? 'Hesabım' : 'Müşteri Girişi'}
              </span>
            </Link>
            {isCustomerAuthenticated ? (
              <button className="sf-account-btn" type="button" onClick={() => logoutCustomer()}>
                <span className="sf-header-action-label">Çıkış</span>
              </button>
            ) : null}
            <Link
              aria-label={`Sepetim, ${cartCount} ürün`}
              className="sf-cart-btn sf-header-icon-button"
              to="/cart"
            >
              <span className="sf-header-action-icon sf-header-action-icon-cart" aria-hidden="true" />
              <span className="sf-header-action-label">Sepetim</span>
              <span className="sf-header-action-count" aria-hidden="true">
                {cartCount}
              </span>
            </Link>
          </div>

          <button
            className="sf-mobile-toggle"
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-controls="storefront-home-mobile-nav"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            <span
              className={
                mobileMenuOpen
                  ? 'sf-mobile-toggle-bars sf-mobile-toggle-bars-open'
                  : 'sf-mobile-toggle-bars'
              }
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </span>
          </button>

          <StorefrontMobileCategoryStrip
            activePath="/"
            items={headerNavItems}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>

        <button
          type="button"
          aria-label="Menüyü kapat"
          className={mobileMenuOpen ? 'sf-mobile-backdrop active' : 'sf-mobile-backdrop'}
          onClick={() => setMobileMenuOpen(false)}
        />

        <div className="sf-nav-row">
          <div
            className={
              mobileMenuOpen
                ? 'sf-container sf-nav-inner sf-nav-inner-open'
                : 'sf-container sf-nav-inner'
            }
          >
            <button
              type="button"
              className="sf-mobile-nav-close"
              onClick={() => setMobileMenuOpen(false)}
            >
              Kapat
            </button>
            <nav
              id="storefront-home-mobile-nav"
              aria-label="Mağaza gezinme"
              className={mobileMenuOpen ? 'sf-nav sf-nav-open' : 'sf-nav'}
            >
              {headerNavItems.map((item) => {
                const href = resolveStoreNavItemHref(item);

                if (isInternalRoute(href)) {
                  return (
                    <Link key={`${item.label}-${href}`} onClick={() => setMobileMenuOpen(false)} to={href}>
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <a key={`${item.label}-${href}`} href={href} onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="sf-mobile-nav-actions">
              <Link
                className="sf-mobile-nav-primary"
                onClick={() => setMobileMenuOpen(false)}
                to={isCustomerAuthenticated ? '/customer/dashboard' : '/customer/login'}
              >
                {isCustomerAuthenticated ? 'Hesabım' : 'Müşteri Girişi'}
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} to="/cart">
                Sepetim ({cartCount})
              </Link>
              {isCustomerAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logoutCustomer();
                    setMobileMenuOpen(false);
                  }}
                >
                  Çıkış Yap
                </button>
              ) : null}
            </div>

            <div className="sf-support-right">
              <span>{contact.workingHours}</span>
              <strong>{contact.phoneDisplay}</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="sf-main">
        <section className="sf-hero-section" id="hero">
          <div className="sf-container sf-hero-layout has-featured-products">
            {highlightedSlide ? (
              <article className="sf-hero-card sf-hero-card--media-only" aria-label="Acilis slider">
                <div className="sf-hero-modern">
                  <div className="sf-hero-slides">
                    {heroSlides.map((slide, index) => {
                      const isActive = index === slideIndex;
                      const posterUrl = resolveHeroPoster(slide);

                      return (
                        <section
                          key={`hero-modern-${slide.title}-${index}`}
                          className={isActive ? 'sf-hero-slide active' : 'sf-hero-slide'}
                          aria-hidden={!isActive}
                        >
                          <img
                            alt={slide.title}
                            className="sf-hero-slide-image"
                            fetchPriority={index === 0 ? 'high' : 'auto'}
                            src={posterUrl}
                          />
                        </section>
                      );
                    })}
                  </div>

                  <button
                    aria-label="Onceki slider gorseli"
                    className="sf-hero-media-arrow left"
                    type="button"
                    onClick={goToPrevSlide}
                  >
                    {'<'}
                  </button>
                  <button
                    aria-label="Sonraki slider gorseli"
                    className="sf-hero-media-arrow right"
                    type="button"
                    onClick={goToNextSlide}
                  >
                    {'>'}
                  </button>

                  <div className="sf-hero-media-dots" aria-label="Slider noktaları">
                    {heroSlides.map((slide, index) => (
                      <button
                        key={`hero-media-dot-${slide.title}-${index}`}
                        aria-label={`${index + 1}. slider gorseli`}
                        className={index === slideIndex ? 'sf-hero-media-dot active' : 'sf-hero-media-dot'}
                        type="button"
                        onClick={() => setSlideIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              </article>
            ) : null}

            <aside className="sf-hero-featured-panel" aria-label="Öne çıkan ürünler">
              <div className="sf-hero-featured-list">
                {heroFeaturedProducts.map((product) => (
                  <HeroFeaturedProductCard
                    key={`hero-featured-${product.id}`}
                    product={product}
                    formatter={formatter}
                    onAdd={addToCart}
                  />
                ))}
                {heroFeaturedPlaceholders.map((item) => (
                  <HeroFeaturedPlaceholderCard
                    key={item.id}
                    title={item.title}
                    description={item.description}
                  />
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="sf-free-shipping-band" aria-label="Ücretsiz kargo avantajı">
          <div className="sf-container">
            <article className="sf-free-shipping-band-card">
              <div className="sf-free-shipping-band-copy">
                <span className="sf-free-shipping-kicker">Teslimat Avantajı</span>
                <h2>Ücretsiz Kargo</h2>
                <p>
                  Türkiye geneline gönderilen siparişlerde ekstra kargo ücreti çıkmaz.
                  Koruyucu paketleme ile hızlı sevkiyat birlikte sunulur.
                </p>
              </div>

              <div className="sf-free-shipping-points" aria-label="Ücretsiz kargo detayları">
                <span>Ekstra ücret yok</span>
                <span>Güvenli paketleme</span>
                <span>Hızlı sevkiyat</span>
              </div>
            </article>
          </div>
        </section>

        <section className="sf-hot-picks" id="products">
          <div className="sf-container">
            <div className="sf-section-head">
              <div>
                <h2>{homeSections.hotDealsTitle}</h2>
                <p>{homeSections.hotDealsDescription}</p>
              </div>
              <div className="sf-head-right">
                <div className="sf-deal-clock">
                  Bitmesine: {dealClock.days}:{dealClock.hours}:{dealClock.mins}:{dealClock.secs}
                </div>
                <div className="sf-carousel-nav">
                  <button type="button" onClick={prevHotProducts}>
                    {'<'}
                  </button>
                  <button type="button" onClick={nextHotProducts}>
                    {'>'}
                  </button>
                </div>
              </div>
            </div>

            <div className="sf-products-grid">
              {hotProducts.map((product, index) => (
                <ProductShowcaseCard
                  key={`${product.id}-${index}`}
                  product={product}
                  formatter={formatter}
                  onAdd={addToCart}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="sf-featured-products" id="product-list">
          <div className="sf-container">
            <div className="sf-featured-head">
              <div>
                <h2>{homeSections.featuredTitle}</h2>
                <p>{homeSections.featuredDescription}</p>
              </div>
              <a href="#products">Tümünü Gör</a>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="sf-featured-grid">
                {featuredProducts.map((product, index) => (
                  <FeaturedProductCard
                    key={`featured-${product.id}-${index}`}
                    product={product}
                    index={index}
                    formatter={formatter}
                    onAdd={addToCart}
                    onPreview={openPreview}
                  />
                ))}
              </div>
            ) : (
              <p className="sf-featured-empty">Listelenecek ürün bulunamadı.</p>
            )}
          </div>
        </section>

        <section className="sf-parallax-ribbon" aria-label="Parallax olive banner">
          <div className="sf-container">
            <article
              className="sf-parallax-ribbon-shell"
              style={{ backgroundImage: `url(${ribbon.imageUrl})` }}
            >
              <div className="sf-parallax-ribbon-inner">
                <div>
                  <p>{ribbon.eyebrow}</p>
                  <h3>{ribbon.title}</h3>
                </div>
                <a href={ribbon.ctaHref}>{ribbon.ctaLabel}</a>
              </div>
            </article>
          </div>
        </section>

        <section className="sf-best-sellers" id="best-sellers">
          <div className="sf-container">
            <div className="sf-best-head">
              <div>
                <h2>{homeSections.bestSellersTitle}</h2>
                <p>{homeSections.bestSellersDescription}</p>
              </div>
              <a href="#product-list">Tümünü Gör</a>
            </div>

            {bestSellerProducts.length > 0 ? (
              <div className="sf-best-grid">
                {bestSellerProducts.map((product, index) => (
                  <BestSellerCard
                    key={`best-${product.id}-${index}`}
                    product={product}
                    index={index}
                    formatter={formatter}
                    onAdd={addToCart}
                    onPreview={openPreview}
                  />
                ))}
              </div>
            ) : (
              <p className="sf-featured-empty">Çok satanlar alanında gösterilecek ürün bulunamadı.</p>
            )}
          </div>
        </section>

        <section className="sf-most-popular" id="most-popular">
          <div className="sf-container">
            <div className="sf-most-head">
              <h2>{homeSections.popularTitle}</h2>
              <p>{homeSections.popularDescription}</p>
            </div>

            <div className="sf-most-panel">
              <div className="sf-most-tabs">
                <button
                  type="button"
                  className={popularTab === 'all' ? 'active' : undefined}
                  onClick={() => setPopularTab('all')}
                >
                  Tümü
                </button>
                {popularTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={popularTab === tab.id ? 'active' : undefined}
                    onClick={() => setPopularTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="sf-most-slider-wrap">
                <button
                  className="sf-most-arrow left"
                  type="button"
                  onClick={prevPopularProducts}
                  disabled={mostPopularProducts.length <= popularVisibleCount}
                >
                  {'<'}
                </button>

                {popularDisplayProducts.length > 0 ? (
                  <div
                    className="sf-most-slider"
                    style={{
                      gridTemplateColumns: `repeat(${popularDisplayProducts.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {popularDisplayProducts.map((product, index) => (
                      <MostPopularCard
                        key={`most-${product.id}-${index}`}
                        product={product}
                        index={index}
                        formatter={formatter}
                        onAdd={addToCart}
                        onPreview={openPreview}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="sf-featured-empty">Bu filtre için gösterilecek ürün yok.</p>
                )}

                <button
                  className="sf-most-arrow right"
                  type="button"
                  onClick={nextPopularProducts}
                  disabled={mostPopularProducts.length <= popularVisibleCount}
                >
                  {'>'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="sf-mosaic" id="campaigns">
          <div className="sf-container">
            <div className="sf-mosaic-grid">
              {promoPrimary ? (
                <PromoCta card={promoPrimary} className="sf-promo-tone-rose" />
              ) : null}
              {promoSecondary ? (
                <PromoCta card={promoSecondary} className="sf-promo-tone-gold" />
              ) : null}
              {promoTertiary ? (
                <PromoCta card={promoTertiary} className="sf-promo-tone-aqua" />
              ) : null}
            </div>
          </div>
        </section>

        <section className="sf-free-shipping-showcase" aria-label="Ücretsiz kargo bannerı">
          <div className="sf-container">
            <article className="sf-free-shipping-showcase-card">
              <div className="sf-free-shipping-showcase-copy">
                <span className="sf-free-shipping-kicker">Kargo Ayrıcalığı</span>
                <h3>Siparişlerinize ücretsiz kargo avantajı ekledik</h3>
                <p>
                  Ürün fiyatı neyse ödeme de o olur. Sepette ekstra kargo ücreti
                  çıkmadan siparişinizi güvenle tamamlayabilirsiniz.
                </p>
              </div>

              <div className="sf-free-shipping-showcase-actions">
                <span className="sf-free-shipping-chip">Tüm siparişlerde geçerli</span>
                <a href="#product-list">Ürünleri İncele</a>
              </div>
            </article>
          </div>
        </section>

        {blogPosts.length > 0 ? (
          <section className="sf-blog-section" id="blog">
            <div className="sf-container">
              <div className="sf-featured-head">
                <div>
                  <h2>{homeSections.blogTitle}</h2>
                  <p>{homeSections.blogDescription}</p>
                </div>
                <Link to={`/blog/${blogPosts[0].slug}`}>Son Yazıyı Aç</Link>
              </div>

              <div className="sf-blog-grid">
                {blogPosts.map((post) => (
                  <BlogPreviewCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="sf-features">
          <div className="sf-container sf-features-grid">
            {featureItems.map((item) => (
              <article key={`${item.icon}-${item.title}`} className="sf-feature-item">
                <FeatureIcon item={item} />
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sf-newsletter">
          <div className="sf-container sf-newsletter-inner">
            <div>
              <h3>{config.newsletterTitle}</h3>
              <p>{config.newsletterDescription}</p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <input type="email" placeholder="E-posta adresiniz" />
              <button type="submit">Abone Ol</button>
            </form>
          </div>
        </section>
      </main>

      {cartCount > 0 ? (
        <div className="sf-mobile-cart-dock">
          <div className="sf-mobile-cart-dock-meta">
            <span>{cartCount} ürün sepette</span>
            <strong>{formatter.format(cartSubtotal)}</strong>
          </div>
          <Link to="/cart">Sepete Git</Link>
        </div>
      ) : null}

      {previewProduct ? (
        <div className="sf-preview-modal" role="dialog" aria-modal="true" onClick={closePreview}>
          <div className="sf-preview-panel" onClick={(event) => event.stopPropagation()}>
            <button className="sf-preview-close" type="button" onClick={closePreview} aria-label="Kapat">
              x
            </button>

            <div className="sf-preview-media">
              <img src={resolveProductImage(previewProduct)} alt={previewProduct.name} />
            </div>

            <div className="sf-preview-content">
              <p className="sf-preview-category">
                {previewProduct.category?.name || 'Zeytin ve Zeytinyağı'}
              </p>
              <h3>{previewProduct.name}</h3>

              <div className="sf-preview-rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={`modal-rate-${index}`} className={index < 4 ? 'rate-on' : 'rate-off'} />
                ))}
                <small>(5 müşteri yorumu)</small>
              </div>

              <div className="sf-preview-price">
                {Number(previewProduct.compareAtPrice ?? 0) > Number(previewProduct.price ?? 0) ? (
                  <span>{formatter.format(Number(previewProduct.compareAtPrice ?? 0))}</span>
                ) : null}
                <strong>{formatter.format(Number(previewProduct.price ?? 0))}</strong>
              </div>

              <p className="sf-preview-description">
                {previewProduct.description ||
                  previewProduct.shortDescription ||
                  'Ürün detayları yakında eklenecektir.'}
              </p>

              <div className="sf-preview-actions">
                <label>
                  Adet
                  <input
                    type="number"
                    disabled={!previewCanPurchase}
                    min={previewCanPurchase ? 1 : 0}
                    max={previewMaxQuantity}
                    value={previewQty}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (!Number.isFinite(nextValue)) {
                        return;
                      }

                      if (!previewCanPurchase) {
                        setPreviewQty(0);
                        return;
                      }

                      setPreviewQty(
                        Math.min(Math.max(Math.floor(nextValue), 1), previewMaxQuantity),
                      );
                    }}
                  />
                </label>
                <button
                  disabled={!previewCanPurchase}
                  type="button"
                  onClick={() => {
                    addToCartWithQty(previewProduct.id, previewQty);
                    closePreview();
                  }}
                >
                  {previewCanPurchase ? 'Sepete Ekle' : 'Stokta Yok'}
                </button>
              </div>

              <div className="sf-preview-meta">
                <p>
                  <strong>Kategori:</strong> {previewProduct.category?.name || 'Gıda ve Market'}
                </p>
                <p>
                  <strong>Stok:</strong> {Math.max(previewProduct.stock, 0)}
                </p>
                <p>
                  <strong>Etiketler:</strong> {previewProduct.tags?.join(', ') || 'ev, zeytin, gurme'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="sf-footer" id="footer">
        <div className="sf-container sf-footer-grid">
          {footerColumns.map((column) => (
            <div key={column.title} className="sf-footer-column">
              <h5>{column.title}</h5>
              <ul>
                {column.links.map((link) => {
                  const href = (link.href || '').trim() || resolveFooterLink(link.label);
                  const isSectionLink = href.startsWith('#');
                  const isRouteLink = isInternalRoute(href);

                  return (
                    <li key={`${column.title}-${link.label}-${href}`}>
                      {isSectionLink ? (
                        <a href={href}>{link.label}</a>
                      ) : isRouteLink ? (
                        <Link to={href}>{link.label}</Link>
                      ) : (
                        <a
                          href={href}
                          rel={href.startsWith('http') ? 'noreferrer' : undefined}
                          target={href.startsWith('http') ? '_blank' : undefined}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="sf-footer-column">
            <h5>İletişim</h5>
            <ul>
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              <li>
                <a href={contact.phoneLink}>{contact.phoneDisplay}</a>
              </li>
              <li>{contact.address}</li>
              <li>{contact.workingHours}</li>
            </ul>
          </div>
        </div>

        <div className="sf-container sf-footer-legal-links">
          <Link to="/kvkk">{config.legalPages.kvkk.title}</Link>
          <Link to="/gizlilik">{config.legalPages.privacy.title}</Link>
          <Link to="/satis-sozlesmesi">{config.legalPages.sales.title}</Link>
          <Link to="/iletisim">İletişim</Link>
        </div>

        <div className="sf-container sf-footer-bottom">
          <span>
            {config.theme.brandName} (c) {new Date().getFullYear()} - Tüm hakları saklıdır.
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Yukarı Dön
          </button>
        </div>
      </footer>
    </div>
  );
}

