import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeApi } from '../services/employeeApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { Shield, Key, Briefcase, Building2, User } from 'lucide-react';

const STANDARD_POSITIONS = [
  'Software Developer',
  'Software Development Engineer (SDE)',
  'Senior Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'QA Automation Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Data Analyst',
  'HR Specialist',
  'Sales Executive',
  'Financial Analyst'
];

const DEPARTMENTS = [
  'Engineering',
  'Product & Design',
  'Sales & Marketing',
  'Human Resources',
  'Finance & Accounting',
  'Operations',
  'Management'
];

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isEdit = Boolean(id);
  const isAdmin = currentUser?.role === 'Admin';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    position: 'Software Developer',
    customPosition: '',
    employeeId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    role: 'Employee',
    password: '',
    wage: 75000
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      employeeApi.getEmployee(id).then(res => {
        if (res.data) {
          const emp = res.data;
          const pos = emp.position || emp.job_position || 'Software Developer';
          const isStandard = STANDARD_POSITIONS.includes(pos);
          const joinDate = emp.joiningDate || emp.joining_date || emp.created_at || new Date().toISOString();
          const cleanDate = typeof joinDate === 'string' ? joinDate.split('T')[0].split(' ')[0] : new Date().toISOString().split('T')[0];

          setFormData({
            firstName: emp.firstName || emp.first_name || '',
            lastName: emp.lastName || emp.last_name || '',
            email: emp.email || '',
            phone: emp.phone || '',
            department: emp.department || 'Engineering',
            position: isStandard ? pos : 'Other',
            customPosition: isStandard ? '' : pos,
            employeeId: emp.employeeId || emp.employee_id || `EMP-${String(emp.id).padStart(3, '0')}`,
            joiningDate: cleanDate,
            status: emp.status || 'Active',
            role: emp.role || 'Employee',
            password: '',
            wage: emp.wage || 75000,
          });
        } else {
          setError('Employee not found');
        }
        setLoading(false);
      }).catch((err) => {
        setError(err.response?.data?.error || err.message || 'Failed to load employee data');
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedFirstName = (formData.firstName || '').trim();
    const trimmedLastName = (formData.lastName || '').trim();
    const trimmedEmail = (formData.email || '').trim();

    if (!trimmedFirstName) {
      setError('First name is required.');
      return;
    }
    if (!trimmedLastName) {
      setError('Last name is required.');
      return;
    }
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email format (e.g. user@example.com).');
      return;
    }

    const finalPosition = formData.position === 'Other' 
      ? (formData.customPosition || '').trim() || 'Staff' 
      : formData.position;

    const payload = {
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      email: trimmedEmail,
      phone: (formData.phone || '').trim(),
      department: formData.department || 'Engineering',
      job_position: finalPosition,
      position: finalPosition,
      status: formData.status || 'Active',
      role: formData.role || 'Employee',
      password: formData.password || undefined,
      wage: parseFloat(formData.wage) || 75000,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await employeeApi.updateEmployee(id, payload);
        setSuccess('Employee record updated successfully.');
        setTimeout(() => navigate('/employees'), 1200);
      } else {
        await employeeApi.createEmployee(payload);
        setSuccess('Employee created successfully.');
        setTimeout(() => navigate('/employees'), 1200);
      }
    } catch (err) {
      const serverErr = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save employee.';
      setError(serverErr);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px' }}>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            {isAdmin ? 'Admin Portal: Direct employee and privileged HR user creation' : 'HR Portal: Create employee master record'}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {error && (
        <div style={{ color: 'var(--color-status-error)', padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ color: '#16A34A', padding: '12px 16px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '6px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Card title="Personal Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div className="input-group">
              <label>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} placeholder="First name" required />
            </div>
            <div className="input-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} placeholder="Last name" required />
            </div>
            <div className="input-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="e.g. employee@company.com" required />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone number" />
            </div>
          </div>
        </Card>

        <Card title="Employment & Position Details" style={{ marginTop: 'var(--spacing-3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div className="input-group">
              <label>Employee ID (Optional auto-gen)</label>
              <input type="text" name="employeeId" value={formData.employeeId || ''} onChange={handleChange} placeholder="e.g. EMP-015" />
            </div>
            <div className="input-group">
              <label>Department</label>
              <select name="department" value={formData.department || 'Engineering'} onChange={handleChange}>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Job Position</label>
              <select name="position" value={formData.position || 'Software Developer'} onChange={handleChange}>
                {STANDARD_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
                <option value="Other">Custom Position...</option>
              </select>
            </div>
            {formData.position === 'Other' && (
              <div className="input-group">
                <label>Specify Custom Job Position *</label>
                <input 
                  type="text" 
                  name="customPosition" 
                  value={formData.customPosition || ''} 
                  onChange={handleChange} 
                  placeholder="e.g. Cloud Security Architect" 
                  required 
                />
              </div>
            )}
            <div className="input-group">
              <label>Joining Date</label>
              <input type="date" name="joiningDate" value={formData.joiningDate || ''} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Status</label>
              <select name="status" value={formData.status || 'Active'} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            {!isEdit && (
              <div className="input-group">
                <label>Starting Annual Wage ($)</label>
                <input type="number" name="wage" value={formData.wage || 75000} onChange={handleChange} />
              </div>
            )}
          </div>
        </Card>

        {/* System Access & Credentials */}
        {!isEdit && (
          <Card title="System Credentials & Role Authorization" style={{ marginTop: 'var(--spacing-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="var(--color-brand)" />
                  System Role Authorization
                </label>
                {isAdmin ? (
                  <select name="role" value={formData.role || 'Employee'} onChange={handleChange}>
                    <option value="Employee">Standard Employee</option>
                    <option value="HR_Manager">HR Manager</option>
                    <option value="HR_Payroll_Manager">HR Payroll Manager</option>
                    <option value="Finance_Auditor">Finance Auditor</option>
                    <option value="Admin">System Administrator</option>
                  </select>
                ) : (
                  <div>
                    <input type="text" value="Employee (HR accounts restricted to Admin)" disabled style={{ backgroundColor: '#f5f5f5' }} />
                  </div>
                )}
                <small style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                  {isAdmin 
                    ? 'Admin privilege: You can authoritatively provision HR and Manager accounts.' 
                    : 'HR Managers can only provision standard Employee accounts.'}
                </small>
              </div>

              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} color="var(--color-brand)" /> Initial Login Password
                </label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Set initial password" 
                  value={formData.password || ''} 
                  onChange={handleChange} 
                />
                <small style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                  Allows the user to log in immediately without waiting for signup.
                </small>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--spacing-4)' }}>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Employee' : 'Create Employee Account')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
