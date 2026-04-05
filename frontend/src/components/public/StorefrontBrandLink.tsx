import { Link } from 'react-router-dom';
import storefrontLogo from '../../assets/storefront-logo.jpg';

export function StorefrontBrandLink({ brandName }: { brandName: string }) {
  return (
    <Link aria-label={`${brandName} anasayfa`} className="sf-logo" to="/">
      <img alt={brandName} className="sf-logo-image" src={storefrontLogo} />
    </Link>
  );
}
