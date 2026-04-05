import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { resolvePublicCategoryResultsPath } from './public-site';
import type { Category, WebsiteNavItem } from '../types/api';

const FALLBACK_CATEGORY_NAV_ITEMS: WebsiteNavItem[] = [
  { label: 'Zeytinyağı', href: resolvePublicCategoryResultsPath('zeytinyagi') },
  { label: 'Siyah Zeytin', href: resolvePublicCategoryResultsPath('siyah-zeytin') },
  { label: 'Yeşil Zeytin', href: resolvePublicCategoryResultsPath('yesil-zeytin') },
  { label: 'Farklı Tatlar', href: resolvePublicCategoryResultsPath('farkli-tatlar') },
  { label: 'Kozmetik', href: resolvePublicCategoryResultsPath('kozmetik') },
  { label: 'Kurumsal', href: resolvePublicCategoryResultsPath('kurumsal') },
];

function dedupeNavItems(items: WebsiteNavItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.label}|${item.href}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildFeaturedCategoryNavItems(categories: Category[], limit = 6) {
  const featuredItems = dedupeNavItems(
    categories
      .filter((category) => category.isActive)
      .sort((left, right) => {
        if (left.displayOrder !== right.displayOrder) {
          return left.displayOrder - right.displayOrder;
        }

        return left.name.localeCompare(right.name, 'tr');
      })
      .slice(0, limit)
      .map((category) => ({
        label: category.name,
        href: resolvePublicCategoryResultsPath(category.slug),
      })),
  );

  return featuredItems.length > 0 ? featuredItems : [...FALLBACK_CATEGORY_NAV_ITEMS];
}

export function buildStoreHeaderNavItems(categories: Category[], limit = 6) {
  return dedupeNavItems(buildFeaturedCategoryNavItems(categories, limit));
}

export function useStoreHeaderNavItems(limit = 6) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;

    api
      .get<Category[]>('/catalog/public/categories')
      .then((response) => {
        if (!mounted) {
          return;
        }

        setCategories(response.data);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }

        setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(() => buildStoreHeaderNavItems(categories, limit), [categories, limit]);
}
