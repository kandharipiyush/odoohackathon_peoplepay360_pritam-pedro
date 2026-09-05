import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  fullWidth = false, 
  disabled = false, 
  onClick, 
  className = '',
  ...props 
}) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-btn-primary)',
      color: 'var(--color-btn-primary-text)',
      border: '1px solid var(--color-btn-primary)',
    },
    secondary: {
      backgroundColor: 'var(--color-btn-secondary)',
      color: 'var(--color-btn-secondary-text)',
      border: '1px solid var(--color-border)',
    },
    danger: {
      backgroundColor: 'var(--color-status-error)',
      color: '#FFFFFF',
      border: '1px solid var(--color-status-error)',
    }
  };

  // Quick inline styles for hover would be messy without a CSS-in-JS solution or classes, 
  // so we rely on simple standard styles, but in a real app tailwind/css modules are better.
  // Using inline styles for simplicity as requested "Vanilla CSS" without tailwind required.

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...baseStyle, ...variants[variant] }}
      className={`btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
