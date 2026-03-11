interface ProductImageSource {
  id?: string;
  name?: string;
  categoryName?: string | null;
  featuredImage?: string | null;
  images?: string[] | null;
}

export const PRODUCT_PLACEHOLDER_IMAGE = '/product-placeholder.svg';

function normalizeProvidedImages(source: ProductImageSource) {
  const images = Array.isArray(source.images)
    ? source.images
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

  const featuredImage =
    typeof source.featuredImage === 'string' ? source.featuredImage.trim() : '';

  if (featuredImage && images.includes(featuredImage)) {
    return [featuredImage, ...images.filter((item) => item !== featuredImage)];
  }

  if (featuredImage) {
    return [featuredImage, ...images];
  }

  return images;
}

export function resolveProductImage(
  source: ProductImageSource,
  offset = 0,
) {
  const providedImages = normalizeProvidedImages(source);
  if (providedImages.length > 0) {
    return providedImages[Math.max(0, Math.floor(offset)) % providedImages.length];
  }

  return PRODUCT_PLACEHOLDER_IMAGE;
}

export function resolveProductGallery(
  source: ProductImageSource,
  count = 4,
) {
  const providedImages = normalizeProvidedImages(source);
  const safeCount = Math.max(1, Math.floor(count));

  if (providedImages.length > 0) {
    return providedImages.slice(0, safeCount);
  }

  return [PRODUCT_PLACEHOLDER_IMAGE];
}
