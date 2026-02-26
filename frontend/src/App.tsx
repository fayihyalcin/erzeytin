import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useCustomerAuth } from './context/CustomerAuthContext';
import { CategoryFormPage } from './pages/CategoryFormPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoginPage } from './pages/LoginPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { CartPage } from './pages/CartPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductsPage } from './pages/ProductsPage';
import { RepresentativesPage } from './pages/RepresentativesPage';
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
    return <Navigate to="/dashboard/website" replace />;
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontPage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
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
        <Route index element={<Navigate to="website" replace />} />
        <Route path="website" element={<WebsiteContentPage />} />
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
  );
}

export default App;
