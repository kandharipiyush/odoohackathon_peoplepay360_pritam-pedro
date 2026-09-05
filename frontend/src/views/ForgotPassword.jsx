import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-4)' 
    }}>
      <Card style={{ width: '100%', maxWidth: '400px', padding: 'var(--spacing-4)' }}>
        
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} color="var(--color-status-success)" style={{ margin: '0 auto var(--spacing-3)' }} />
            <h2 style={{ marginBottom: '8px' }}>Check your email</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 'var(--spacing-4)' }}>
              We've sent password reset instructions to {email}
            </p>
            <Link to="/login" style={{ color: 'var(--color-text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Sign in
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-4)' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Reset Password</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {error && (
              <div style={{ 
                backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--color-status-error)', 
                padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>
              
              <Button type="submit" variant="primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)', fontSize: '14px' }}>
              <Link to="/login" style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ArrowLeft size={16} /> Back to Sign in
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
