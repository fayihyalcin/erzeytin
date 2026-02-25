import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import { createDefaultWebsiteConfig, parseWebsiteConfig } from '../lib/website-config';
import type {
  Category,
  Product,
  PublicSettingsDto,
  WebsiteConfig,
  WebsiteFeatureItem,
  WebsitePromoCard,
} from '../types/api';
import './StorefrontPage.css';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1000&q=80';
const PARALLAX_CARDS = [
  {
    title: 'Erken Hasat Ozel Secki',
    subtitle: 'Ayvalik bahcelerinden soguk sikim tazelik',
    cta: 'Koleksiyonu Incele',
    href: '#products',
    imageUrl:
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1800&q=80',
  },
  {
    title: 'Butik Uretim Siyah Zeytin',
    subtitle: 'Geleneksel fermantasyon, dogal aroma',
    cta: 'Lezzetleri Kesfet',
    href: '#best-sellers',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80',
  },
];
const PARALLAX_STRIP_IMAGE =
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=2000&q=80';

function resolveProductImage(product: Product) {
  return product.featuredImage || product.images[0] || FALLBACK_PRODUCT_IMAGE;
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
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;
  const isUnfiltered = product.tags.some((tag) => tag.toLowerCase().includes('filtresiz'));
  const processLabel = isUnfiltered ? 'FILTRESIZ' : 'FILTRE EDILMIS';

  return (
    <article className="sf-product-card">
      <div className="sf-product-media">
        <div className="sf-product-season-badge" aria-hidden="true">
          <span className="year">2025-2026</span>
          <strong>YENI SEZON</strong>
          <span>{processLabel}</span>
        </div>
        <Link className="sf-card-link-media" to={`/product/${product.id}`}>
          <img src={resolveProductImage(product)} alt={product.name} />
        </Link>
      </div>

      <p className="sf-product-category-tag">{product.category?.name || 'Zeytin ve Zeytinyagi'}</p>
      <h4>
        <Link className="sf-card-link-title" to={`/product/${product.id}`}>
          {product.name}
        </Link>
      </h4>

      {hasDiscount ? (
        <p className="sf-product-discount-tag">%{discountPercent} indirim</p>
      ) : null}

      <p className="sf-product-shipping-note">{formatter.format(2000)} uzeri kargo bedava</p>

      <div className="sf-price-row">
        {hasDiscount ? <span className="sf-price-old">{formatter.format(compare)}</span> : null}
        <strong>{formatter.format(price)}</strong>
      </div>

      <button className="sf-add-cart" type="button" onClick={() => onAdd(product.id)}>
        Sepete Ekle
      </button>
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
        <Link className="sf-card-link-media" to={`/product/${product.id}`}>
          <img src={resolveProductImage(product)} alt={product.name} />
        </Link>
      </div>

      <h4>
        <Link className="sf-card-link-title" to={`/product/${product.id}`}>
          {product.name}
        </Link>
      </h4>
      <p className="sf-featured-meta">{product.category?.name || 'Zeytin ve Zeytinyagi'}</p>
      <p className={inStock ? 'sf-featured-stock in' : 'sf-featured-stock out'}>
        {inStock ? 'IN STOCK' : 'OUT OF STOCK'}
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
        <button className="primary" type="button" onClick={() => onAdd(product.id)}>
          Add to cart
        </button>
        <button className="ghost" type="button" onClick={() => onPreview(product)}>
          On Izleme
        </button>
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

  let badgeLabel = '';
  let badgeClass = 'discount';
  if (index === 2) {
    badgeLabel = 'TOP PRODUCT';
    badgeClass = 'top';
  } else if (index === 5) {
    badgeLabel = 'SUPER PRICE';
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
        <Link className="sf-card-link-media" to={`/product/${product.id}`}>
          <img src={resolveProductImage(product)} alt={product.name} />
        </Link>

        <div className="sf-best-float-actions">
          <button type="button" onClick={() => onPreview(product)} aria-label="On izleme">
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
        <Link className="sf-card-link-title" to={`/product/${product.id}`}>
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

      <p className="sf-best-delivery">2-day Delivery</p>

      <div className="sf-best-footer">
        <button type="button" onClick={() => onAdd(product.id)}>
          Add to cart
        </button>
        <button
          className="preview"
          type="button"
          onClick={() => onPreview(product)}
        >
          On Izleme
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

  return (
    <article className="sf-most-card">
      <div className="sf-most-media">
        <span className="sf-most-hot">HOT</span>
        {hasDiscount ? <span className="sf-most-off">-{discountPercent}%</span> : null}
        <button className="sf-most-fav" type="button" aria-label={`${product.name} favorilere ekle`}>
          +
        </button>
        <Link className="sf-card-link-media" to={`/product/${product.id}`}>
          <img src={resolveProductImage(product)} alt={product.name} />
        </Link>
      </div>

      <p className="sf-most-category">{product.category?.name || 'Category'}</p>
      <h4>
        <Link className="sf-card-link-title" to={`/product/${product.id}`}>
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
        <button type="button" onClick={() => onAdd(product.id)}>
          Add to cart
        </button>
        <button className="ghost" type="button" onClick={() => onPreview(product)}>
          On Izleme
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
      <img src={card.imageUrl} alt={card.title} />
      <div className="sf-promo-overlay">
        <span>Enjoy 20% savings</span>
        <h4>{card.title}</h4>
        <p>{card.subtitle}</p>
        <a href={card.ctaHref}>{card.ctaLabel}</a>
      </div>
    </article>
  );
}

export function StorefrontPage() {
  const { addProduct, itemCount: cartCount } = useStoreCart();
  const defaultConfig = useMemo(() => createDefaultWebsiteConfig(), []);
  const [settings, setSettings] = useState<PublicSettingsDto | null>(null);
  const [config, setConfig] = useState<WebsiteConfig>(createDefaultWebsiteConfig);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    document.body.classList.add('storefront-body');
    return () => {
      document.body.classList.remove('storefront-body');
    };
  }, []);

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
  const navItems = config.navItems.length > 0 ? config.navItems : defaultConfig.navItems;
  const promoCards = config.promoCards.length > 0 ? config.promoCards : defaultConfig.promoCards;
  const featureItems =
    config.featureItems.length > 0 ? config.featureItems : defaultConfig.featureItems;
  const footerColumns =
    config.footerColumns.length > 0 ? config.footerColumns : defaultConfig.footerColumns;

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % heroSlides.length);
    }, 5200);

    return () => {
      window.clearInterval(interval);
    };
  }, [heroSlides.length]);

  useEffect(() => {
    if (slideIndex < heroSlides.length) {
      return;
    }

    setSlideIndex(0);
  }, [slideIndex, heroSlides.length]);

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

  const categoryItemCount = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      const categoryId = product.category?.id;
      if (!categoryId) {
        return acc;
      }

      acc[categoryId] = (acc[categoryId] ?? 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const categoryShowcase = useMemo(() => {
    if (categories.length > 0) {
      return categories.slice(0, 6).map((category) => ({
        id: category.id,
        name: category.name,
        count: categoryItemCount[category.id] ?? 0,
      }));
    }

    return [
      { id: 'olive-oil', name: 'Sizma Zeytinyagi', count: productPool.length },
      { id: 'black-olive', name: 'Gemlik Siyah Zeytin', count: Math.max(3, productPool.length) },
      { id: 'green-olive', name: 'Kirilmis Yesil Zeytin', count: Math.max(2, productPool.length) },
      { id: 'special', name: 'Gurme Seriler', count: Math.max(1, productPool.length) },
    ];
  }, [categories, categoryItemCount, productPool.length]);

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
      { id: 'sizma-zeytinyagi', label: 'Sizma Zeytinyagi' },
      { id: 'gemlik-siyah-zeytin', label: 'Siyah Zeytin' },
      { id: 'yesil-zeytin', label: 'Yesil Zeytin' },
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

  const dealClock = useMemo(
    () => countDownParts(dealDeadline - clockNow),
    [dealDeadline, clockNow],
  );

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
    setPreviewQty(1);
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

  if (loading) {
    return <div className="storefront-loading">Website yukleniyor...</div>;
  }

  return (
    <div className="storefront-page">
      <div className="sf-top-strip">
        <div className="sf-container sf-top-inner">
          <div className="sf-top-left">
            <span>Need Support?</span>
            <strong>Call Us</strong>
            <a href="tel:+902120000000">(+90 212-000-0103)</a>
          </div>

          <div className="sf-top-center">
            <span>English</span>
            <span>{currency}</span>
            <span className="sf-top-badge">%25 OFF</span>
            <span>{config.announcement}</span>
          </div>

          <div className="sf-top-right">
            <a href="#footer">About us</a>
            <a href="#footer">My Account</a>
            <a href="#footer">Order Tracking</a>
          </div>
        </div>
      </div>

      <header className="sf-main-header">
        <div className="sf-container sf-brand-row">
          <a className="sf-logo" href="#hero">
            <span className="sf-logo-mark">Z</span>
            <span className="sf-logo-text">
              <strong>{config.theme.brandName}</strong>
              <small>{config.theme.tagline}</small>
            </span>
          </a>

          <form
            className="sf-search-form"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              type="search"
              placeholder="Search olive oil, olives, categories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" aria-label="Search products">
              Ara
            </button>
          </form>

          <div className="sf-header-actions">
            <Link className="sf-customer-btn" to="/customer/dashboard">
              Musteri Giris
            </Link>
            <Link className="sf-account-btn" to="/admin">
              {config.theme.adminButtonLabel}
            </Link>
            <Link className="sf-cart-btn" to="/cart">
              Cart
              <span>{cartCount} items</span>
            </Link>
          </div>

          <button
            className="sf-mobile-toggle"
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            MENU
          </button>
        </div>

        <div className="sf-nav-row">
          <div className="sf-container sf-nav-inner">
            <a className="sf-all-categories" href="#categories">
              Explore All Categories
            </a>

            <nav className={mobileMenuOpen ? 'sf-nav sf-nav-open' : 'sf-nav'}>
              {navItems.map((item) => (
                <a
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="sf-support-right">
              <span>24/7 Support</span>
              <strong>888-777-999</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="sf-main">
        <section className="sf-hero-section" id="hero">
          {highlightedSlide ? (
            <article className="sf-hero-card">
              <img
                className="sf-hero-bg-image"
                src={highlightedSlide.imageUrl}
                alt={highlightedSlide.title}
              />

              <div className="sf-hero-content">
                <p className="sf-hero-pretitle">{highlightedSlide.badge || 'Yeni Sezon'}</p>
                <h1>{highlightedSlide.title}</h1>
                <p>{highlightedSlide.subtitle || 'Ayvalik ve Memecik seckileriyle dogal tatlar'}</p>
                <small>{highlightedSlide.description}</small>
                <a href={highlightedSlide.ctaHref}>{highlightedSlide.ctaLabel}</a>
              </div>

              <button className="sf-hero-arrow left" type="button" onClick={goToPrevSlide}>
                {'<'}
              </button>
              <button className="sf-hero-arrow right" type="button" onClick={goToNextSlide}>
                {'>'}
              </button>

              <div className="sf-hero-dots">
                {heroSlides.map((slide, index) => (
                  <button
                    key={`${slide.title}-${index}`}
                    className={index === slideIndex ? 'sf-dot active' : 'sf-dot'}
                    type="button"
                    onClick={() => setSlideIndex(index)}
                  />
                ))}
              </div>
            </article>
          ) : null}
        </section>

        <section className="sf-category-row" id="categories">
          <div className="sf-container">
            <div className="sf-category-grid">
              {categoryShowcase.map((category) => (
                <a key={category.id} className="sf-category-chip" href="#products">
                  <strong>{category.name}</strong>
                  <span>{category.count} urun</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="sf-parallax-gallery" aria-label="Parallax campaign cards">
          <div className="sf-container">
            <div className="sf-parallax-grid">
              {PARALLAX_CARDS.map((item) => (
                <article
                  key={item.title}
                  className="sf-parallax-card"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                >
                  <div className="sf-parallax-content">
                    <p>{item.subtitle}</p>
                    <h3>{item.title}</h3>
                    <a href={item.href}>{item.cta}</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sf-hot-picks" id="products">
          <div className="sf-container">
            <div className="sf-section-head">
              <h2>Gunun Sicak Firsatlari</h2>
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
                <h2>Featured Products</h2>
                <p>Ayin en cok tercih edilen zeytin ve zeytinyagi urunleri</p>
              </div>
              <a href="#products">View All</a>
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
              <p className="sf-featured-empty">Listelenecek urun bulunamadi.</p>
            )}
          </div>
        </section>

        <section className="sf-parallax-ribbon" aria-label="Parallax olive banner">
          <div className="sf-container">
            <article
              className="sf-parallax-ribbon-shell"
              style={{ backgroundImage: `url(${PARALLAX_STRIP_IMAGE})` }}
            >
              <div className="sf-parallax-ribbon-inner">
                <div>
                  <p>Dogadan sofraya premium seri</p>
                  <h3>Zeytinyagi ve zeytinlerde taze dolum kampanyalari</h3>
                </div>
                <a href="#campaigns">Kampanyayi Ac</a>
              </div>
            </article>
          </div>
        </section>

        <section className="sf-best-sellers" id="best-sellers">
          <div className="sf-container">
            <div className="sf-best-head">
              <h2>Best Sellers</h2>
              <a href="#product-list">View All</a>
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
              <p className="sf-featured-empty">Best sellers alaninda gosterilecek urun bulunamadi.</p>
            )}
          </div>
        </section>

        <section className="sf-most-popular" id="most-popular">
          <div className="sf-container">
            <div className="sf-most-head">
              <h2>Most Popular</h2>
              <p>All our new arrivals in an exclusive brand selection</p>
            </div>

            <div className="sf-most-panel">
              <div className="sf-most-tabs">
                <button
                  type="button"
                  className={popularTab === 'all' ? 'active' : undefined}
                  onClick={() => setPopularTab('all')}
                >
                  View All
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
                  <p className="sf-featured-empty">Bu filtre icin gosterilecek urun yok.</p>
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
                {previewProduct.category?.name || 'Zeytin ve Zeytinyagi'}
              </p>
              <h3>{previewProduct.name}</h3>

              <div className="sf-preview-rating">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={`modal-rate-${index}`} className={index < 4 ? 'rate-on' : 'rate-off'} />
                ))}
                <small>(5 customer reviews)</small>
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
                  'Urun detaylari yakinda eklenecektir.'}
              </p>

              <div className="sf-preview-actions">
                <label>
                  Adet
                  <input
                    type="number"
                    min={1}
                    max={Math.max(previewProduct.stock, 1)}
                    value={previewQty}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      if (!Number.isFinite(nextValue)) {
                        return;
                      }

                      const maxStock = Math.max(previewProduct.stock, 1);
                      setPreviewQty(Math.min(Math.max(Math.floor(nextValue), 1), maxStock));
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    addToCartWithQty(previewProduct.id, previewQty);
                    closePreview();
                  }}
                >
                  Add to cart
                </button>
              </div>

              <div className="sf-preview-meta">
                <p>
                  <strong>Category:</strong> {previewProduct.category?.name || 'Food & Grocery'}
                </p>
                <p>
                  <strong>Stock:</strong> {Math.max(previewProduct.stock, 0)}
                </p>
                <p>
                  <strong>Tags:</strong> {previewProduct.tags?.join(', ') || 'home, olive, gourmet'}
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
                {column.links.map((link) => (
                  <li key={`${column.title}-${link}`}>
                    <a href="#footer">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="sf-footer-column">
            <h5>Iletisim</h5>
            <ul>
              <li>{settings?.supportEmail || 'destek@erzeytin.com'}</li>
              <li>+90 850 000 00 00</li>
              <li>Ayvalik / Balikesir</li>
            </ul>
          </div>
        </div>

        <div className="sf-container sf-footer-bottom">
          <span>
            {config.theme.brandName} (c) {new Date().getFullYear()} - Tum haklari saklidir.
          </span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Yukari Don
          </button>
        </div>
      </footer>
    </div>
  );
}
