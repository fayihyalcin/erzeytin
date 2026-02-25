import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { StoreCartProvider } from './context/StoreCartContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreCartProvider>
          <App />
        </StoreCartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
