import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStoreCart } from '../context/StoreCartContext';
import { api } from '../lib/api';
import type { Product, PublicSettingsDto } from '../types/api';
import './StorefrontPage.css';
import './ProductDetailPage.css';

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1000&q=80';

function resolveProductImage(product: Product) {
  return product.featuredImage || product.images[0] || FALLBACK_PRODUCT_IMAGE;
}

function uniqueGalleryImages(product: Product) {
  const images = [product.featuredImage, ...(product.images ?? [])]
    .filter((image): image is string => !!image)
    .filter((image, index, arr) => arr.indexOf(image) === index);

  if (images.length > 0) {
    return images;
  }

  return [FALLBACK_PRODUCT_IMAGE];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getRelatedVisibleCount(width: number) {
  if (width <= 640) {
    return 1;
  }
  if (width <= 920) {
    return 2;
  }
  if (width <= 1260) {
    return 3;
  }
  if (width <= 1480) {
    return 4;
  }

  return 6;
}

function CartGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="19" r="1.7" />
      <circle cx="17" cy="19" r="1.7" />
      <path d="M2 3h2l2.2 10.4a1 1 0 0 0 1 .8h9.4a1 1 0 0 0 1-.8L20 7H6" />
    </svg>
  );
}

function BagGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l-1 12a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8L6 8Z" />
      <path d="M9 8V6a3 3 0 1 1 6 0v2" />
    </svg>
  );
}

function HeartGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-7-4.2-9-8.3C1.7 8.9 3.2 6 6.4 6c2 0 3.2 1 4.1 2.3C11.3 7 12.6 6 14.6 6c3.2 0 4.7 2.9 6.4 5.7-2 4.1-9 8.3-9 8.3Z" />
    </svg>
  );
}

function RefreshGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8 8 0 1 0-2 5.3" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function ZoomGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}

function RelatedProductCard({
  product,
  formatter,
  onAdd,
}: {
  product: Product;
  formatter: Intl.NumberFormat;
  onAdd: (product: Product) => void;
}) {
  const price = Number(product.price ?? 0);
  const compare = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;

  return (
    <article className="sf-related-card">
      <Link to={`/product/${product.id}`} className="sf-related-media">
        <img src={resolveProductImage(product)} alt={product.name} />
      </Link>
      <h4>
        <Link to={`/product/${product.id}`}>{product.name}</Link>
      </h4>
      <p>{product.category?.name || 'Zeytin ve Zeytinyagi'}</p>
      <div className="sf-related-price">
        <strong>{formatter.format(price)}</strong>
        {hasDiscount ? <span>{formatter.format(compare)}</span> : null}
        {hasDiscount ? <small>%{discountPercent} OFF</small> : null}
      </div>
      <button type="button" onClick={() => onAdd(product)}>
        Sepete Ekle
      </button>
    </article>
  );
}

interface DetailContentProps {
  product: Product;
  products: Product[];
  formatter: Intl.NumberFormat;
  onAddProduct: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

function ProductDetailContent({
  product,
  products,
  formatter,
  onAddProduct,
  onBuyNow,
}: DetailContentProps) {
  const galleryImages = useMemo(() => uniqueGalleryImages(product), [product]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedStart, setRelatedStart] = useState(0);
  const [relatedVisibleCount, setRelatedVisibleCount] = useState(() =>
    getRelatedVisibleCount(typeof window !== 'undefined' ? window.innerWidth : 1600),
  );
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

  const maxQuantity = Math.max(product.stock, 1);
  const selectedImage = galleryImages[selectedImageIndex] ?? galleryImages[0] ?? FALLBACK_PRODUCT_IMAGE;
  const price = Number(product.price ?? 0);
  const compare = Number(product.compareAtPrice ?? 0);
  const hasDiscount = compare > price && price > 0;
  const discountPercent = hasDiscount
    ? Math.round(((compare - price) / compare) * 100)
    : 0;
  const shortSummary =
    product.shortDescription ||
    product.description ||
    `${product.name} icin taze dolum ve guvenli teslimat secenegi.`;

  const relatedProducts = useMemo(() => {
    const sameCategory = products.filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.category?.id &&
        product.category?.id &&
        candidate.category.id === product.category.id,
    );

    if (sameCategory.length >= 6) {
      return sameCategory.slice(0, 12);
    }

    const fallback = products.filter((candidate) => candidate.id !== product.id);
    return [...sameCategory, ...fallback].slice(0, 12);
  }, [product, products]);

  const safeRelatedStart =
    relatedProducts.length > 0 ? ((relatedStart % relatedProducts.length) + relatedProducts.length) % relatedProducts.length : 0;

  const visibleRelatedProducts = useMemo(() => {
    if (relatedProducts.length === 0) {
      return [];
    }

    if (relatedProducts.length <= relatedVisibleCount) {
      return relatedProducts;
    }

    const doubled = [...relatedProducts, ...relatedProducts];
    return doubled.slice(safeRelatedStart, safeRelatedStart + relatedVisibleCount);
  }, [relatedProducts, relatedVisibleCount, safeRelatedStart]);

  const goToPrevImage = useCallback(() => {
    if (galleryImages.length <= 1) {
      return;
    }

    setSelectedImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  }, [galleryImages.length]);

  const goToNextImage = useCallback(() => {
    if (galleryImages.length <= 1) {
      return;
    }

    setSelectedImageIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  }, [galleryImages.length]);

  const changeQuantity = useCallback(
    (next: number) => {
      const normalized = Math.floor(next);
      setQuantity(clamp(Number.isFinite(normalized) ? normalized : 1, 1, maxQuantity));
    },
    [maxQuantity],
  );

  const openZoom = useCallback(() => {
    setZoomLevel(1);
    setZoomOrigin('50% 50%');
    setZoomOpen(true);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setRelatedVisibleCount(getRelatedVisibleCount(window.innerWidth));
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (!zoomOpen) {
      document.body.classList.remove('sf-modal-open');
      return;
    }

    document.body.classList.add('sf-modal-open');
    return () => {
      document.body.classList.remove('sf-modal-open');
    };
  }, [zoomOpen]);

  useEffect(() => {
    if (!zoomOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomOpen(false);
        return;
      }

      if (event.key === 'ArrowLeft') {
        goToPrevImage();
        return;
      }

      if (event.key === 'ArrowRight') {
        goToNextImage();
        return;
      }

      if (event.key === '+' || event.key === '=') {
        setZoomLevel((current) => clamp(current + 0.2, 1, 4));
        return;
      }

      if (event.key === '-') {
        setZoomLevel((current) => clamp(current - 0.2, 1, 4));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [goToNextImage, goToPrevImage, zoomOpen]);

  return (
    <div className="storefront-page sf-pd-page">
      <div className="sf-container">
        <header className="sf-pd-head">
          <h1>{product.name}</h1>
          <p>{shortSummary}</p>
        </header>

        <section className="sf-pd-shell">
          <div className="sf-pd-gallery">
            <div className="sf-pd-thumbs">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={index === selectedImageIndex ? 'active' : undefined}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} />
                </button>
              ))}
            </div>

            <div className="sf-pd-main-media">
              {galleryImages.length > 1 ? (
                <button className="sf-pd-main-arrow left" type="button" onClick={goToPrevImage} aria-label="Onceki gorsel">
                  {'<'}
                </button>
              ) : null}

              <button className="sf-pd-zoom-chip" type="button" onClick={openZoom}>
                <ZoomGlyph />
                <span>Zoom</span>
              </button>

              <img src={selectedImage} alt={product.name} onClick={openZoom} />

              {galleryImages.length > 1 ? (
                <button className="sf-pd-main-arrow right" type="button" onClick={goToNextImage} aria-label="Sonraki gorsel">
                  {'>'}
                </button>
              ) : null}
            </div>
          </div>

          <aside className="sf-pd-info">
            <div className="sf-pd-review-line">
              <span className="star" aria-hidden="true">
                *
              </span>
              <span>Henuz Degerlendirilmemis</span>
              <button type="button">Ilk Sen Degerlendir</button>
            </div>

            <div className="sf-pd-price-row">
              <strong>{formatter.format(price)}</strong>
              {hasDiscount ? <span>{formatter.format(compare)}</span> : null}
            </div>
            {hasDiscount ? <p className="sf-pd-discount">%{discountPercent} indirim</p> : null}
            <p className="sf-pd-shipping">{formatter.format(2000)} uzeri kargo bedava</p>

            <div className="sf-pd-qty-line">
              <span className="sf-pd-qty-label">ADET</span>
              <div className="sf-pd-qty-box">
                <button type="button" onClick={() => changeQuantity(quantity - 1)} aria-label="Miktari azalt">
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(event) => changeQuantity(Number(event.target.value))}
                />
                <button type="button" onClick={() => changeQuantity(quantity + 1)} aria-label="Miktari arttir">
                  +
                </button>
              </div>
            </div>

            <div className="sf-pd-actions">
              <button className="sf-pd-btn add" type="button" onClick={() => onAddProduct(product, quantity)}>
                <CartGlyph />
                <span>Sepete Ekle</span>
              </button>
              <button className="sf-pd-btn buy" type="button" onClick={() => onBuyNow(product, quantity)}>
                <BagGlyph />
                <span>Hemen Al</span>
              </button>
              <button className="sf-pd-icon-btn" type="button" aria-label="Favorilere ekle">
                <HeartGlyph />
              </button>
              <button className="sf-pd-icon-btn" type="button" aria-label="Karsilastir">
                <RefreshGlyph />
              </button>
            </div>

            <dl className="sf-pd-meta">
              <div>
                <dt>Barkodu</dt>
                <dd>{product.barcode || '-'}</dd>
              </div>
              <div>
                <dt>Markasi</dt>
                <dd>{product.brand || 'Aydoganlar'}</dd>
              </div>
              <div>
                <dt>Stok</dt>
                <dd>{Math.max(product.stock, 0)}</dd>
              </div>
              <div>
                <dt>SKU</dt>
                <dd>{product.sku || '-'}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="sf-pd-description">
          <h2>Urun Detaylari</h2>
          <p>
            {product.description ||
              'Urun ozenle secilen hammaddelerle uretilmistir. Serin ve gunes almayan ortamda saklayiniz.'}
          </p>
          <div className="sf-pd-note-grid">
            <p>Taze dolum ve izlenebilir parti numarasi</p>
            <p>Guvenli paketleme ve hasarsiz teslimat</p>
            <p>Yuksek stok dogrulugu ve hizli sevkiyat</p>
            <p>Kurumsal siparislerde ozel fiyatlandirma</p>
          </div>
        </section>

        <section className="sf-related-products">
          <div className="sf-related-head">
            <h2>Related Products</h2>
            <div className="sf-related-nav">
              <button
                type="button"
                onClick={() =>
                  setRelatedStart((current) =>
                    relatedProducts.length === 0
                      ? 0
                      : current === 0
                      ? relatedProducts.length - 1
                      : current - 1,
                  )
                }
                disabled={relatedProducts.length <= relatedVisibleCount}
              >
                {'<'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setRelatedStart((current) =>
                    relatedProducts.length === 0 ? 0 : (current + 1) % relatedProducts.length,
                  )
                }
                disabled={relatedProducts.length <= relatedVisibleCount}
              >
                {'>'}
              </button>
            </div>
          </div>

          {visibleRelatedProducts.length > 0 ? (
            <div
              className="sf-related-grid"
              style={{ gridTemplateColumns: `repeat(${visibleRelatedProducts.length}, minmax(0, 1fr))` }}
            >
              {visibleRelatedProducts.map((relatedProduct) => (
                <RelatedProductCard
                  key={`related-${relatedProduct.id}`}
                  product={relatedProduct}
                  formatter={formatter}
                  onAdd={(target) => onAddProduct(target, 1)}
                />
              ))}
            </div>
          ) : (
            <p className="sf-featured-empty">Ilgili urun bulunamadi.</p>
          )}
        </section>
      </div>

      {zoomOpen ? (
        <div className="sf-pd-lightbox" role="dialog" aria-modal="true" onClick={() => setZoomOpen(false)}>
          <div className="sf-pd-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <div className="sf-pd-lightbox-toolbar">
              <button type="button" onClick={() => setZoomLevel((current) => clamp(current - 0.2, 1, 4))}>
                -
              </button>
              <span>{Math.round(zoomLevel * 100)}%</span>
              <button type="button" onClick={() => setZoomLevel((current) => clamp(current + 0.2, 1, 4))}>
                +
              </button>
              <button type="button" onClick={() => setZoomLevel(1)}>
                1:1
              </button>
              <button type="button" onClick={() => setZoomOpen(false)}>
                Kapat
              </button>
            </div>

            <div
              className="sf-pd-lightbox-media"
              onWheel={(event) => {
                event.preventDefault();
                setZoomLevel((current) =>
                  clamp(current + (event.deltaY < 0 ? 0.2 : -0.2), 1, 4),
                );
              }}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                setZoomOrigin(`${clamp(x, 0, 100)}% ${clamp(y, 0, 100)}%`);
              }}
            >
              {galleryImages.length > 1 ? (
                <button className="sf-pd-lightbox-arrow left" type="button" onClick={goToPrevImage} aria-label="Onceki gorsel">
                  {'<'}
                </button>
              ) : null}

              <img
                src={selectedImage}
                alt={product.name}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: zoomOrigin }}
              />

              {galleryImages.length > 1 ? (
                <button className="sf-pd-lightbox-arrow right" type="button" onClick={goToNextImage} aria-label="Sonraki gorsel">
                  {'>'}
                </button>
              ) : null}
            </div>

            <p className="sf-pd-lightbox-help">
              Mouse wheel ile zoom yapin. Ok tuslariyla gorseller arasinda gecis yapabilirsiniz.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addProduct } = useStoreCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('TRY');

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
      api.get<Product[]>('/catalog/public/products'),
    ])
      .then(([settingsResponse, productsResponse]) => {
        if (!mounted) {
          return;
        }

        setProducts(productsResponse.data);
        if (settingsResponse.data.currency) {
          setCurrency(settingsResponse.data.currency.toUpperCase());
        }
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

  const product = useMemo(
    () => products.find((item) => item.id === productId) ?? null,
    [products, productId],
  );

  if (loading) {
    return <div className="storefront-loading">Urun detayi yukleniyor...</div>;
  }

  if (!product) {
    return (
      <div className="storefront-page sf-pd-page">
        <div className="sf-container sf-detail-not-found">
          <h1>Urun Bulunamadi</h1>
          <p>Urun kaldirilmis veya link gecersiz olabilir.</p>
          <Link to="/">Ana Sayfaya Don</Link>
        </div>
      </div>
    );
  }

  return (
    <ProductDetailContent
      key={product.id}
      product={product}
      products={products}
      formatter={formatter}
      onAddProduct={addProduct}
      onBuyNow={(target, quantity) => {
        addProduct(target, quantity);
        navigate('/cart');
      }}
    />
  );
}
