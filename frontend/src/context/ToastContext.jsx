import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onDismiss }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={18} color="var(--color-status-success)" />;
      case 'error': return <AlertCircle size={18} color="var(--color-status-error)" />;
      case 'warning': return <AlertCircle size={18} color="var(--color-status-warning)" />;
      default: return <Info size={18} color="var(--color-status-info)" />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      padding: '12px 16px',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-md)',
      minWidth: '300px',
      animation: 'slideIn 0.3s ease'
    }}>
      {getIcon()}
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>
        <X size={16} />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
