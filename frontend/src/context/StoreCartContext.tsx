import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { resolveProductGallery, resolveProductImage } from '../lib/product-images';
import type { Product } from '../types/api';
import { useToast } from './ToastContext';

const STORAGE_KEY = 'zeytin_store_cart_v1';

interface CartProductSnapshot {
  id: string;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  featuredImage: string | null;
  images: string[];
  categoryName: string | null;
  stock: number;
}

export interface StoreCartItem {
  productId: string;
  quantity: number;
  product: CartProductSnapshot;
}

interface StoreCartContextValue {
  items: StoreCartItem[];
  itemCount: number;
  subtotal: number;
  addProduct: (product: Product, quantity?: number) => void;
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getQuantity: (productId: string) => number;
}

const StoreCartContext = createContext<StoreCartContextValue | undefined>(undefined);

function toProductSnapshot(product: Product): CartProductSnapshot {
  const categoryName = product.category?.name ?? null;

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: String(product.price ?? '0'),
    compareAtPrice: product.compareAtPrice ?? null,
    featuredImage:
      resolveProductImage({
        id: product.id,
        name: product.name,
        categoryName,
        featuredImage: product.featuredImage,
        images: product.images,
      }) || null,
    images: resolveProductGallery(
      {
        id: product.id,
        name: product.name,
        categoryName,
        featuredImage: product.featuredImage,
        images: product.images,
      },
      4,
    ),
    categoryName,
    stock: Math.max(Number(product.stock ?? 0), 0),
  };
}

function parsePrice(value: string) {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0;
}

function loadInitialCart() {
  if (typeof window === 'undefined') {
    return [] as StoreCartItem[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [] as StoreCartItem[];
    }

    const parsed = JSON.parse(raw) as StoreCartItem[];
    if (!Array.isArray(parsed)) {
      return [] as StoreCartItem[];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        if (!item.productId || !item.product || typeof item.quantity !== 'number') {
          return null;
        }

        const quantity = Math.max(1, Math.floor(item.quantity));
        const normalizedFeaturedImage =
          resolveProductImage({
            id: item.product.id,
            name: item.product.name,
            categoryName: item.product.categoryName,
            featuredImage: item.product.featuredImage,
            images: item.product.images,
          }) || null;

        return {
          productId: item.productId,
          quantity,
          product: {
            ...item.product,
            sku: String(item.product.sku ?? ''),
            featuredImage: normalizedFeaturedImage,
            images: resolveProductGallery(
              {
                id: item.product.id,
                name: item.product.name,
                categoryName: item.product.categoryName,
                featuredImage: item.product.featuredImage,
                images: item.product.images,
              },
              4,
            ),
          },
        } satisfies StoreCartItem;
      })
      .filter((item): item is StoreCartItem => item !== null);
  } catch {
    return [] as StoreCartItem[];
  }
}

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoreCartItem[]>(loadInitialCart);
  const itemsRef = useRef(items);
  const { showToast } = useToast();

  useEffect(() => {
    itemsRef.current = items;

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    const maxStock = Math.max(Number(product.stock ?? 0), 0);
    if (maxStock <= 0) {
      showToast({
        title: 'Bu ürün stokta yok',
        description: 'Stok yenilendiğinde tekrar deneyebilirsiniz.',
        tone: 'warning',
      });
      return;
    }

    const safeQuantity = Math.min(Math.max(1, Math.floor(quantity)), maxStock);
    const snapshot = toProductSnapshot(product);
    const currentItems = itemsRef.current;
    const existingIndex = currentItems.findIndex((item) => item.productId === product.id);

    if (existingIndex < 0) {
      setItems([
        ...currentItems,
        {
          productId: product.id,
          quantity: safeQuantity,
          product: snapshot,
        },
      ]);
      showToast({
        title: 'Sepete eklendi',
        description: `${snapshot.name} sepete eklendi.`,
        tone: 'success',
      });
      return;
    }

    const next = [...currentItems];
    const existing = next[existingIndex];
    const nextQuantity = Math.min(existing.quantity + safeQuantity, snapshot.stock);
    next[existingIndex] = {
      ...existing,
      quantity: nextQuantity,
      product: snapshot,
    };

    setItems(next);
    showToast({
      title: nextQuantity >= snapshot.stock ? 'Sepet stok limitine ulaştı' : 'Sepet güncellendi',
      description:
        nextQuantity >= snapshot.stock
          ? `${snapshot.name} için maksimum stok adedine ulaşıldı.`
          : `${snapshot.name} adedi güncellendi.`,
      tone: nextQuantity >= snapshot.stock ? 'info' : 'success',
    });
  }, [showToast]);

  const removeProduct = useCallback((productId: string) => {
    const currentItems = itemsRef.current;
    const removedItem = currentItems.find((item) => item.productId === productId);
    if (!removedItem) {
      return;
    }

    setItems(currentItems.filter((item) => item.productId !== productId));
    showToast({
      title: 'Sepetten kaldırıldı',
      description: `${removedItem.product.name} sepetten çıkarıldı.`,
      tone: 'info',
    });
  }, [showToast]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const currentItems = itemsRef.current;
    const targetItem = currentItems.find((item) => item.productId === productId);
    if (!targetItem) {
      return;
    }

    const safeQuantity = Math.floor(quantity);
    if (safeQuantity <= 0) {
      setItems(currentItems.filter((item) => item.productId !== productId));
      showToast({
        title: 'Sepetten kaldırıldı',
        description: `${targetItem.product.name} artık sepetinizde değil.`,
        tone: 'info',
      });
      return;
    }

    const maxStock = Math.max(targetItem.product.stock, 0);
    if (maxStock <= 0) {
      setItems(currentItems.filter((item) => item.productId !== productId));
      showToast({
        title: 'Stok tükendi görünüyor',
        description: `${targetItem.product.name} sepette tutulamadı çünkü stok bilgisi güncellendi.`,
        tone: 'warning',
      });
      return;
    }

    const nextQuantity = Math.min(safeQuantity, maxStock);
    const nextItems = currentItems.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: nextQuantity,
          }
        : item,
    );

    setItems(nextItems);

    if (nextQuantity === targetItem.quantity && safeQuantity <= maxStock) {
      return;
    }

    showToast({
      title: nextQuantity >= maxStock ? 'Sepet stok limitine ulaştı' : 'Sepet güncellendi',
      description:
        nextQuantity >= maxStock
          ? `${targetItem.product.name} için en fazla ${maxStock} adet seçilebilir.`
          : `${targetItem.product.name} miktarı ${nextQuantity} olarak güncellendi.`,
      tone: nextQuantity >= maxStock ? 'info' : 'success',
    });
  }, [showToast]);

  const clearCart = useCallback(() => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) {
      return;
    }

    setItems([]);
    showToast({
      title: 'Sepet temizlendi',
      description: 'Tüm ürünler sepetinizden kaldırıldı.',
      tone: 'info',
    });
  }, [showToast]);

  const getQuantity = useCallback(
    (productId: string) => items.find((item) => item.productId === productId)?.quantity ?? 0,
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + parsePrice(item.product.price) * item.quantity, 0),
    [items],
  );

  const value = useMemo<StoreCartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      addProduct,
      removeProduct,
      setQuantity,
      clearCart,
      getQuantity,
    }),
    [items, itemCount, subtotal, addProduct, removeProduct, setQuantity, clearCart, getQuantity],
  );

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>;
}

export function useStoreCart() {
  const context = useContext(StoreCartContext);
  if (!context) {
    throw new Error('useStoreCart must be used inside StoreCartProvider.');
  }

  return context;
}
