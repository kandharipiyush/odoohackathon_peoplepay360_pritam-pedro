import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contractApi } from '../services/contractApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const ContractForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'Full-Time',
    startDate: '',
    endDate: '',
    schedule: 'Standard 40h',
    salary: '',
    status: 'ACTIVE'
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      contractApi.getContract(id).then(res => {
        if (res.data) setFormData(res.data);
        else setError('Contract not found');
        setLoading(false);
      }).catch(() => {
        setError('Failed to load contract');
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

    if (!formData.employeeId || !formData.startDate || !formData.salary) {
      setError('Employee ID, Start Date, and Salary are required.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await contractApi.updateContract(id, formData);
      } else {
        await contractApi.createContract(formData);
      }
      navigate('/contracts');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save contract.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h1 style={{ fontSize: '24px' }}>{isEdit ? 'Edit Contract' : 'New Contract'}</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {error && <div style={{ color: 'var(--color-status-error)', padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <Card title="Contract Details">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
            <div className="input-group">
              <label>Employee ID *</label>
              <input type="number" name="employeeId" value={formData.employeeId} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Contract Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contractor">Contractor</option>
              </select>
            </div>
            <div className="input-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Working Schedule</label>
              <input type="text" name="schedule" value={formData.schedule} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Salary (Annual) *</label>
              <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="FUTURE">FUTURE</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--spacing-3)' }}>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Contract'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
