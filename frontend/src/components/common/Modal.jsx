import React from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, maxWidth = '500px', children, style = {} }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--spacing-2)'
    }}>
      <div style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: maxWidth,
        boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.2))',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        border: '1px solid var(--color-border)',
        ...style
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--spacing-3)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{ background: 'none', color: 'var(--color-text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{
          padding: 'var(--spacing-3)',
          overflowY: 'auto'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
