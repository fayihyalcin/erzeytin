import { useLayoutEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { StorefrontWhatsAppButton } from './components/StorefrontWhatsAppButton';
import { useAuth } from './context/AuthContext';
import { useCustomerAuth } from './context/CustomerAuthContext';
import { CategoryFormPage } from './pages/CategoryFormPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoginPage } from './pages/LoginPage';
import { MediaLibraryPage } from './pages/MediaLibraryPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { PostsPage } from './pages/PostsPage';
import { CartPage } from './pages/CartPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductsPage } from './pages/ProductsPage';
import {
  PublicCampaignsPage,
  PublicCategoriesPage,
  PublicProductsPage,
} from './pages/PublicCatalogPages';
import { RepresentativesPage } from './pages/RepresentativesPage';
import { PaytrReturnPage } from './pages/PaytrReturnPage';
import { SettingsPage } from './pages/SettingsPage';
import { StorefrontPage } from './pages/StorefrontPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { CustomerRegisterPage } from './pages/CustomerRegisterPage';
import {
  ContactPage,
  KvkkPage,
  PrivacyPolicyPage,
  SalesAgreementPage,
} from './pages/LegalPages';
import { WebsiteContentPage } from './pages/WebsiteContentPage';

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

      <Routes>
        <Route path="/" element={<StorefrontPage />} />
        <Route path="/kategoriler" element={<PublicCategoriesPage />} />
        <Route path="/urunler" element={<PublicProductsPage />} />
        <Route path="/kampanyalar" element={<PublicCampaignsPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
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

      {hideWhatsAppButton ? null : <StorefrontWhatsAppButton />}
    </>
  );
}

export default App;
