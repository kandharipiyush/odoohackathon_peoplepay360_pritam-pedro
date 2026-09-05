import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { toggleSidebar } = useApp();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  // Simple breadcrumb logic based on pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    
    const segment = path.split('/')[1];
    if (!segment) return 'Dashboard';
    
    // Capitalize first letter
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--color-bg-card)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--spacing-3)',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
        <button 
          onClick={toggleSidebar}
          style={{ 
            background: 'none', 
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}
        >
          <Menu size={20} />
        </button>
        <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 500 }}>
          {getPageTitle()}
        </h2>
      </div>

      <div style={{ position: 'relative' }}>
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-primary)'
          }}>
            <User size={16} />
          </div>
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {currentUser?.name || 'User'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {currentUser?.role || 'Role'}
            </span>
          </div>
          <ChevronDown size={16} color="var(--color-text-secondary)" />
        </button>

        {isProfileOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '200px',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 10
          }}>
            <ul style={{ listStyle: 'none', padding: '8px 0', margin: 0 }}>
              <li>
                <button 
                  onClick={logout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'none',
                    textAlign: 'left',
                    color: 'var(--color-status-error)',
                    fontSize: '14px'
                  }}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
