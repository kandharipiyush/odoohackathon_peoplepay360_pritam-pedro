import React from 'react';

const Card = ({ children, title, className = '', ...props }) => {
  return (
    <div 
      className={`card ${className}`} 
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-3)',
        marginBottom: 'var(--spacing-3)'
      }}
      {...props}
    >
      {title && (
        <h3 style={{ 
          marginBottom: 'var(--spacing-2)', 
          paddingBottom: 'var(--spacing-1)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '16px'
        }}>
          {title}
        </h3>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
