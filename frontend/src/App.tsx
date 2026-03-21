import { Suspense, lazy, useLayoutEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StorefrontWhatsAppButton } from './components/StorefrontWhatsAppButton';
import { useAuth } from './context/AuthContext';
import { useCustomerAuth } from './context/CustomerAuthContext';

const DashboardLayout = lazy(() =>
  import('./layouts/DashboardLayout').then((module) => ({ default: module.DashboardLayout })),
);
const CategoryFormPage = lazy(() =>
  import('./pages/CategoryFormPage').then((module) => ({ default: module.CategoryFormPage })),
);
const DashboardOverviewPage = lazy(() =>
  import('./pages/DashboardOverviewPage').then((module) => ({ default: module.DashboardOverviewPage })),
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const MediaLibraryPage = lazy(() =>
  import('./pages/MediaLibraryPage').then((module) => ({ default: module.MediaLibraryPage })),
);
const OrderDetailPage = lazy(() =>
  import('./pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })),
);
const OrdersPage = lazy(() =>
  import('./pages/OrdersPage').then((module) => ({ default: module.OrdersPage })),
);
const PostsPage = lazy(() =>
  import('./pages/PostsPage').then((module) => ({ default: module.PostsPage })),
);
const CartPage = lazy(() =>
  import('./pages/CartPage').then((module) => ({ default: module.CartPage })),
);
const CustomerDashboardPage = lazy(() =>
  import('./pages/CustomerDashboardPage').then((module) => ({ default: module.CustomerDashboardPage })),
);
const BlogPostPage = lazy(() =>
  import('./pages/BlogPostPage').then((module) => ({ default: module.BlogPostPage })),
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })),
);
const ProductFormPage = lazy(() =>
  import('./pages/ProductFormPage').then((module) => ({ default: module.ProductFormPage })),
);
const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })),
);
const PublicCampaignsPage = lazy(() =>
  import('./pages/PublicCatalogPages').then((module) => ({ default: module.PublicCampaignsPage })),
);
const PublicCategoriesPage = lazy(() =>
  import('./pages/PublicCatalogPages').then((module) => ({ default: module.PublicCategoriesPage })),
);
const PublicProductsPage = lazy(() =>
  import('./pages/PublicCatalogPages').then((module) => ({ default: module.PublicProductsPage })),
);
const RepresentativesPage = lazy(() =>
  import('./pages/RepresentativesPage').then((module) => ({ default: module.RepresentativesPage })),
);
const PaytrReturnPage = lazy(() =>
  import('./pages/PaytrReturnPage').then((module) => ({ default: module.PaytrReturnPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);
const StorefrontPage = lazy(() =>
  import('./pages/StorefrontPage').then((module) => ({ default: module.StorefrontPage })),
);
const CustomerLoginPage = lazy(() =>
  import('./pages/CustomerLoginPage').then((module) => ({ default: module.CustomerLoginPage })),
);
const CustomerRegisterPage = lazy(() =>
  import('./pages/CustomerRegisterPage').then((module) => ({ default: module.CustomerRegisterPage })),
);
const ContactPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.ContactPage })),
);
const KvkkPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.KvkkPage })),
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.PrivacyPolicyPage })),
);
const SalesAgreementPage = lazy(() =>
  import('./pages/LegalPages').then((module) => ({ default: module.SalesAgreementPage })),
);
const WebsiteContentPage = lazy(() =>
  import('./pages/WebsiteContentPage').then((module) => ({ default: module.WebsiteContentPage })),
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="screen-message">Yukleniyor...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function CustomerProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useCustomerAuth();

  if (loading) {
    return <div className="screen-message">Yukleniyor...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/customer/login" replace />;
  }

  return children;
}

function CustomerGuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useCustomerAuth();

  if (isAuthenticated) {
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
}

function ScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }

    const targetId = decodeURIComponent(location.hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [location.hash, location.pathname]);

  return null;
}

function RouteFallback() {
  return <div className="screen-message">Yukleniyor...</div>;
}

function App() {
  const location = useLocation();
  const hideWhatsAppButton =
    location.pathname === '/admin' ||
    location.pathname === '/login' ||
    location.pathname === '/customer/login' ||
    location.pathname === '/customer/register' ||
    location.pathname.startsWith('/dashboard');

  return (
      <>
        <ScrollManager />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<StorefrontPage />} />
          <Route path="/kategoriler" element={<PublicCategoriesPage />} />
          <Route path="/urunler" element={<PublicProductsPage />} />
          <Route path="/kampanyalar" element={<PublicCampaignsPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/urun/:productSlug" element={<ProductDetailPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout/paytr/return" element={<PaytrReturnPage />} />
          <Route
            path="/customer/dashboard"
            element={
              <CustomerProtectedRoute>
                <CustomerDashboardPage />
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="/customer/login"
            element={
              <CustomerGuestRoute>
                <CustomerLoginPage />
              </CustomerGuestRoute>
            }
          />
          <Route
            path="/customer/register"
            element={
              <CustomerGuestRoute>
                <CustomerRegisterPage />
              </CustomerGuestRoute>
            }
          />
          <Route path="/kvkk" element={<KvkkPage />} />
          <Route path="/gizlilik" element={<PrivacyPolicyPage />} />
          <Route path="/satis-sozlesmesi" element={<SalesAgreementPage />} />
          <Route path="/iletisim" element={<ContactPage />} />

          <Route
            path="/admin"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />

          <Route path="/login" element={<Navigate to="/admin" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="website" element={<WebsiteContentPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="media" element={<MediaLibraryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="categories/new" element={<CategoryFormPage />} />
            <Route path="categories/:categoryId/edit" element={<CategoryFormPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:productId/edit" element={<ProductFormPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailPage />} />
            <Route path="representatives" element={<RepresentativesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {hideWhatsAppButton ? null : <StorefrontWhatsAppButton />}
    </>
  );
}

export default App;
