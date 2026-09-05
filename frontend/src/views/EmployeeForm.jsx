import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeApi } from '../services/employeeApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employeeId: '',
    joiningDate: '',
    status: 'Active'
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      employeeApi.getEmployee(id).then(res => {
        if (res.data) setFormData(res.data);
        else setError('Employee not found');
        setLoading(false);
      }).catch(() => {
        setError('Failed to load employee data');
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('First name, last name, and email are required.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await employeeApi.updateEmployee(id, formData);
        setSuccess('Employee updated successfully.');
      } else {
        const res = await employeeApi.createEmployee(formData);
        setSuccess('Employee created successfully.');
        setTimeout(() => navigate(`/employees/${res.data.id}`), 1500);
      }
    } catch (err) {
      setError('Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h1 style={{ fontSize: '24px' }}>{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {error && <div style={{ color: 'var(--color-status-error)', padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ color: 'var(--color-status-success)', padding: '12px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '6px', marginBottom: '16px' }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <Card title="Personal Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div className="input-group">
              <label>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>
        </Card>

        <Card title="Employment Details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div className="input-group">
              <label>Employee ID</label>
              <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange}>
                <option value="">Select Department</option>
                <option value="Management">Management</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
            <div className="input-group">
              <label>Job Position</label>
              <input type="text" name="position" value={formData.position} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Joining Date</label>
              <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--spacing-3)' }}>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
