import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Briefcase } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    const result = await login(email, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg-main)',
      padding: 'var(--spacing-3)'
    }}>
      <Card style={{
        maxWidth: '400px',
        width: '100%',
        padding: 'var(--spacing-4)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-4)' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'var(--color-btn-primary)',
            color: '#FFFFFF',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-2)'
          }}>
            <Briefcase size={28} />
          </div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>PeoplePay360</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Enterprise HR & Payroll Management
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            color: 'var(--color-status-error)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-3)',
            fontSize: '14px',
            border: '1px solid #FCA5A5'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  color: 'var(--color-text-secondary)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-4)',
            fontSize: '14px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 400 }}>
              <input type="checkbox" style={{ width: 'auto' }} />
              Remember me
            </label>
            <a href="#" style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
              Forgot password?
            </a>
          </div>

          <Button 
            type="submit" 
            fullWidth 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div style={{ 
          marginTop: 'var(--spacing-4)', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: 'var(--color-text-secondary)' 
        }}>
          <p>Mock Credentials:</p>
          <p>Admin: admin@peoplepay360.com / password</p>
          <p>HR: hr@peoplepay360.com / password</p>
          <p>Employee: employee@peoplepay360.com / password</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
