interface ProductImageSource {
  id?: string;
  name?: string;
  categoryName?: string | null;
}

const PRODUCT_IMAGE_FILES = [
  'egevena-avantajli-gurme-setleri-ile-ekon-0e13.webp',
  'gurme-setler-2025-2026-premium-erken-h--e280-.webp',
  'gurme-setler-5li-zeytin-paketi-siyahye--fe1e-.webp',
  'zeytinyagi-2025-2026-premium-erken-has-a30-83.webp',
  'zeytinyagi-erken-hasat-1l-naturel-sizm-fb4-60.webp',
  'zeytinyagi-olgun-hasat-1l-naturel-sizm-4819-a.webp',
  'zeytinyagi-olgun-hasat-5l-naturel-sizm-9832ba (1).webp',
  'zeytinyagi-olgun-hasat-5l-naturel-sizm-9832ba.webp',
];

const PRODUCT_IMAGE_POOL = PRODUCT_IMAGE_FILES.map(
  (fileName) => `/product/${encodeURIComponent(fileName)}`,
);

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function resolveSeed(source: ProductImageSource) {
  return `${source.id ?? ''}|${source.name ?? ''}|${source.categoryName ?? ''}`;
}

export function resolveProductImage(
  source: ProductImageSource,
  offset = 0,
) {
  if (PRODUCT_IMAGE_POOL.length === 0) {
    return '';
  }

  const seedHash = hashString(resolveSeed(source));
  const index = (seedHash + Math.max(0, Math.floor(offset))) % PRODUCT_IMAGE_POOL.length;
  return PRODUCT_IMAGE_POOL[index];
}

export function resolveProductGallery(
  source: ProductImageSource,
  count = 4,
) {
  const safeCount = Math.max(1, Math.floor(count));
  const maxCount = Math.min(safeCount, PRODUCT_IMAGE_POOL.length);

  if (maxCount <= 0) {
    return [] as string[];
  }

  return Array.from({ length: maxCount }, (_, index) =>
    resolveProductImage(source, index),
  );
}

