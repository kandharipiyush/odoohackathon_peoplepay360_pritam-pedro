import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AppProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
