import { Link } from 'react-router-dom';
import {
  isActiveStoreHref,
  isInternalRoute,
  resolveStoreNavItemHref,
} from '../../lib/public-site';
import type { WebsiteNavItem } from '../../types/api';

export function StorefrontMobileCategoryStrip({
  items,
  activePath,
  onNavigate,
}: {
  items: WebsiteNavItem[];
  activePath: string;
  onNavigate?: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="sf-mobile-category-strip" aria-label="Hizli kategori secimi">
      {items.map((item) => {
        const href = resolveStoreNavItemHref(item);
        const className = isActiveStoreHref(activePath, href) ? 'active' : undefined;

        if (isInternalRoute(href)) {
          return (
            <Link className={className} key={`${item.label}-${href}`} onClick={onNavigate} to={href}>
              {item.label}
            </Link>
          );
        }

        return (
          <a className={className} href={href} key={`${item.label}-${href}`} onClick={onNavigate}>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
