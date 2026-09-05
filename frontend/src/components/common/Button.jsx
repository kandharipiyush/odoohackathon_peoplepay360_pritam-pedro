import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  fullWidth = false, 
  disabled = false, 
  onClick, 
  className = '',
  style = {},
  ...props 
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: fullWidth ? '100%' : 'auto',
        ...style
      }}
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
