import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { StoreCartProvider } from './context/StoreCartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CustomerAuthProvider>
          <StoreCartProvider>
            <App />
          </StoreCartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
