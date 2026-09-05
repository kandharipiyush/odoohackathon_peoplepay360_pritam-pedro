import React, { useState, useEffect } from 'react';
import { timeOffApi } from '../services/timeOffApi';
import { employeeApi } from '../services/employeeApi';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { Clock, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TimeOffAllocations = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [allocations, setAllocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'Paid Annual Leave',
    allocatedDays: 20,
    validityStart: '2026-01-01',
    validityEnd: '2026-12-31'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, empRes] = await Promise.all([
        timeOffApi.getAllocations(),
        employeeApi.getEmployees()
      ]);
      const rawAlloc = allocRes.data?.data || allocRes.data || [];
      const rawEmp = empRes.data?.data || empRes.data || [];
      setAllocations(Array.isArray(rawAlloc) ? rawAlloc : []);
      const empList = Array.isArray(rawEmp) ? rawEmp : [];
      setEmployees(empList);
      if (empList.length > 0 && !formData.employeeId) {
        setFormData(prev => ({ ...prev, employeeId: empList[0].id }));
      }
    } catch (err) {
      console.error('Error loading allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.allocatedDays) {
      addToast('Please fill all required fields', 'warning');
      return;
    }
    setSaving(true);
    try {
      const leaveTypeId = formData.leaveType.includes('Sick') ? 2 : (formData.leaveType.includes('Compensatory') ? 4 : 1);
      await timeOffApi.createAllocation({
        employeeId: formData.employeeId,
        leave_type_id: leaveTypeId,
        allocatedDays: parseFloat(formData.allocatedDays),
        validity_start: formData.validityStart,
        validity_end: formData.validityEnd
      });
      addToast('Leave allocation created successfully.', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to create allocation';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-3)' }}>
        <button onClick={() => navigate('/timeoff')} style={{ background: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}>
          <ArrowLeft size={16} /> Back to Time Off
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Leave Allocations</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Manage employee leave balances & allowances</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} style={{ marginRight: '8px' }} /> New Allocation
        </Button>
      </div>

      {allocations.length === 0 ? (
        <Card>
          <EmptyState icon={Clock} title="No Allocations Found" description="There are no active leave allocations." />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMP ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMPLOYEE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>ALLOCATED</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>USED</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>REMAINING</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>VALID UNTIL</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a, idx) => (
                <tr key={a.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{a.employeeId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.employeeName}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.leaveType}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.allocatedDays} days</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.usedDays} days</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: 'var(--color-status-success)' }}>{a.remainingDays} days</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.validUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* New Allocation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Leave Allocation">
        <form onSubmit={handleCreateAllocation}>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Select Employee *</label>
            <select 
              value={formData.employeeId} 
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || `${emp.firstName || emp.first_name} ${emp.lastName || emp.last_name}`} ({emp.department || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Leave Type *</label>
            <select 
              value={formData.leaveType} 
              onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
            >
              <option value="Paid Annual Leave">Paid Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Compensatory Off">Compensatory Off</option>
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Allocated Days *</label>
            <input 
              type="number" 
              step="1" 
              min="1" 
              max="90" 
              value={formData.allocatedDays} 
              onChange={e => setFormData({ ...formData, allocatedDays: e.target.value })} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label>Validity Start</label>
              <input 
                type="date" 
                value={formData.validityStart} 
                onChange={e => setFormData({ ...formData, validityStart: e.target.value })} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Validity End</label>
              <input 
                type="date" 
                value={formData.validityEnd} 
                onChange={e => setFormData({ ...formData, validityEnd: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--spacing-3)' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Allocating...' : 'Save Allocation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimeOffAllocations;
