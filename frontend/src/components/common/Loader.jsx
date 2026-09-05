import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ fullScreen = false, size = 24 }) => {
  const containerStyle = fullScreen ? {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--color-bg-main)'
  } : {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 'var(--spacing-3)'
  };

  return (
    <div style={containerStyle}>
      <Loader2 
        size={size} 
        color="var(--color-text-secondary)" 
        style={{ animation: 'spin 1s linear infinite' }} 
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
