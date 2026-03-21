import { Link } from 'react-router-dom';
import { isInternalRoute } from '../../lib/public-site';
import './PublicBreadcrumbs.css';

export interface PublicBreadcrumbItem {
  label: string;
  href?: string;
}

export function PublicBreadcrumbs({ items }: { items: PublicBreadcrumbItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Sayfa yolu" className="public-breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1 || !item.href;

          return (
            <li key={`${item.label}-${item.href ?? 'current'}`}>
              {isCurrent ? (
                <span aria-current="page">{item.label}</span>
              ) : item.href && isInternalRoute(item.href) ? (
                <Link to={item.href}>{item.label}</Link>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
