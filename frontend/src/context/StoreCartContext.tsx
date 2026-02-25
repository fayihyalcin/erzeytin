import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '../types/api';

const STORAGE_KEY = 'zeytin_store_cart_v1';

interface CartProductSnapshot {
  id: string;
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
  return {
    id: product.id,
    name: product.name,
    price: String(product.price ?? '0'),
    compareAtPrice: product.compareAtPrice ?? null,
    featuredImage: product.featuredImage ?? null,
    images: product.images ?? [],
    categoryName: product.category?.name ?? null,
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
        return {
          productId: item.productId,
          quantity,
          product: item.product,
        } satisfies StoreCartItem;
      })
      .filter((item): item is StoreCartItem => item !== null);
  } catch {
    return [] as StoreCartItem[];
  }
}

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoreCartItem[]>(loadInitialCart);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const snapshot = toProductSnapshot(product);

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === product.id);
      if (existingIndex < 0) {
        return [
          ...current,
          {
            productId: product.id,
            quantity: safeQuantity,
            product: snapshot,
          },
        ];
      }

      const next = [...current];
      const existing = next[existingIndex];
      next[existingIndex] = {
        ...existing,
        quantity: existing.quantity + safeQuantity,
        product: snapshot,
      };
      return next;
    });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const safeQuantity = Math.floor(quantity);
    if (safeQuantity <= 0) {
      setItems((current) => current.filter((item) => item.productId !== productId));
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: safeQuantity }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

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
