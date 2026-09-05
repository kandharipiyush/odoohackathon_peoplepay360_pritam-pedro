import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Employee',
    agreed: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length > 7) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill out all required fields.');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (strength < 2) {
      setError('Password is too weak.');
      return;
    }
    if (!formData.agreed) {
      setError('You must agree to the Terms of Service.');
      return;
    }

    setLoading(true);
    // Map friendly role names to DB enum values expected by the backend
    const roleEnumMap = {
      'Employee': 'Employee',
      'HR Manager': 'HR_Manager',
      'HR Payroll Manager': 'HR_Payroll_Manager',
    };
    const payload = {
      ...formData,
      role: roleEnumMap[formData.role] || 'Employee',
    };
    try {
      await authApi.register(payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-main)' }}>
        <Card style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <CheckCircle size={48} color="var(--color-status-success)" style={{ margin: '0 auto var(--spacing-3)' }} />
          <h2 style={{ marginBottom: '8px' }}>Registration Successful!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Redirecting you to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-4)' 
    }}>
      <Card style={{ width: '100%', maxWidth: '500px', padding: 'var(--spacing-4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Create an Account</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '8px' }}>Join PeoplePay360</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label>Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Requested Role *</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="Employee">Employee</option>
              <option value="HR Manager">HR Manager</option>
              <option value="HR Payroll Manager">HR Payroll Manager</option>
            </select>
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
              Note: Privileged roles must be verified by administrators.
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group" style={{ position: 'relative' }}>
              <label>Password *</label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" value={formData.password} onChange={handleChange} required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', color: 'var(--color-text-secondary)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              
              {formData.password && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength >= 1 ? 'var(--color-status-error)' : '#e5e5e5', borderRadius: '2px' }} />
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength >= 2 ? 'var(--color-status-warning)' : '#e5e5e5', borderRadius: '2px' }} />
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength >= 3 ? '#86EFAC' : '#e5e5e5', borderRadius: '2px' }} />
                  <div style={{ height: '4px', flex: 1, backgroundColor: strength >= 4 ? 'var(--color-status-success)' : '#e5e5e5', borderRadius: '2px' }} />
                </div>
              )}
            </div>
            
            <div className="input-group">
              <label>Confirm Password *</label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required 
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-4)', fontSize: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 400 }}>
              <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange} style={{ marginTop: '4px' }} required />
              <span style={{ color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                I agree to the Terms of Service and acknowledge that my role may require admin approval.
              </span>
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="button" variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/login')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)', fontSize: '14px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
