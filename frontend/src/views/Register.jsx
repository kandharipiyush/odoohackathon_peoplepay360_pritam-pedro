import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Eye, EyeOff, AlertCircle, CheckCircle, ShieldAlert, UserCheck, Briefcase, Building2 } from 'lucide-react';

const PREFERRED_POSITIONS = [
  'Software Developer (Full Stack)',
  'Software Developer (Frontend - React / Vue)',
  'Software Developer (Backend - Node / Java / Python)',
  'Software Developer (Mobile - Flutter / React Native)',
  'Software Development Engineer (SDE)',
  'DevOps & Cloud Engineer',
  'QA & Automation Test Engineer',
  'UI/UX Product Designer',
  'Data Analyst / Data Engineer',
  'Product Specialist / Associate PM',
  'Sales & Business Development',
  'Operations Specialist',
];

const DEPARTMENTS = [
  'Engineering',
  'Product & Design',
  'Sales & Marketing',
  'Operations',
  'Customer Support',
  'Finance',
];

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    preferred_position: 'Software Developer (Full Stack)',
    department: 'Engineering',
    agreed: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  
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
      setError('Password is too weak. Must include numbers, uppercase, or special characters.');
      return;
    }
    if (!formData.agreed) {
      setError('You must accept the terms to submit your employee application.');
      return;
    }

    setLoading(true);
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      preferred_position: formData.preferred_position,
      department: formData.department,
      role: 'Employee'
    };

    try {
      await authApi.register(payload);
      setSubmittedData({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        position: formData.preferred_position,
        department: formData.department
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-4)' }}>
        <Card style={{ width: '100%', maxWidth: '480px', textAlign: 'center', padding: 'var(--spacing-5)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-3)' }}>
            <UserCheck size={36} color="var(--color-status-success)" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Registration Submitted to HR!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: 'var(--spacing-4)' }}>
            Thank you, <strong>{submittedData.name}</strong>. Your employee application has been forwarded to the Human Resources team for review.
          </p>

          <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '16px', borderRadius: '8px', textAlign: 'left', marginBottom: 'var(--spacing-4)', border: '1px solid var(--color-border)', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Registered Email:</span>
              <strong>{submittedData.email}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Preferred Role:</span>
              <strong>{submittedData.position}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Department:</span>
              <strong>{submittedData.department}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--color-border)', paddingTop: '8px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Account Status:</span>
              <span style={{ color: '#EAB308', fontWeight: 600 }}>Pending HR Approval</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--color-text-primary)', textAlign: 'left', marginBottom: 'var(--spacing-4)' }}>
            ℹ️ <strong>Note:</strong> HR will review your application, verify details, and assign your official job designation and contract. You will be able to log in immediately once approved.
          </div>

          <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
            Return to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-4)' 
    }}>
      <Card style={{ width: '100%', maxWidth: '520px', padding: 'var(--spacing-5)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Employee Registration</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Apply to join PeoplePay360
          </p>
        </div>

        {/* HR Approval Process Notice */}
        <div style={{ 
          backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', 
          padding: '12px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px',
          display: 'flex', gap: '10px', alignItems: 'flex-start'
        }}>
          <ShieldAlert size={18} color="#6366F1" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#4F46E5', display: 'block', marginBottom: '2px' }}>HR Approval & Role Assignment</strong>
            <span style={{ color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
              Submit your preferred role below. HR will review your request and assign your official job designation and payroll package before account activation.
            </span>
          </div>
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
              <input type="text" name="firstName" placeholder="Jane" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label>Work / Personal Email *</label>
            <input type="email" name="email" placeholder="jane.doe@example.com" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input type="text" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} />
          </div>

          {/* Preferred Role / Specialization */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} color="var(--color-brand)" /> Preferred Role / Specialization *
            </label>
            <select name="preferred_position" value={formData.preferred_position} onChange={handleChange}>
              {PREFERRED_POSITIONS.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
              Select your preferred role. HR will assign the final designation upon approval.
            </small>
          </div>

          {/* Preferred Department */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} color="var(--color-brand)" /> Preferred Department
            </label>
            <select name="department" value={formData.department} onChange={handleChange}>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group" style={{ position: 'relative' }}>
              <label>Password *</label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" value={formData.password} onChange={handleChange} required 
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer' }}
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
                placeholder="••••••••"
              />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-4)', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 400 }}>
              <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange} style={{ marginTop: '3px' }} required />
              <span style={{ color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                I agree to the Terms of Service and acknowledge that my profile and role assignment must be approved by HR before login.
              </span>
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="button" variant="secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/login')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Submitting Request...' : 'Submit Application'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-4)', fontSize: '14px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Already registered or approved? </span>
          <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
