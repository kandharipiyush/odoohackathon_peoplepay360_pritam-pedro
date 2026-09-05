import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { timeOffApi } from '../services/timeOffApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { Clock, Plus } from 'lucide-react';

const TimeOff = () => {
  const [searchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employeeId');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [balances, setBalances] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    leaveType: 'Annual Leave',
    startDate: '',
    endDate: '',
    duration: '',
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  const targetId = employeeIdFilter || currentUser.id;
  const canManage = ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'].includes(currentUser?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, reqRes] = await Promise.all([
        timeOffApi.getBalances(targetId),
        timeOffApi.getRequests({ employeeId: targetId })
      ]);
      setBalances(balRes.data);
      setRequests(reqRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetId]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.startDate || !requestForm.endDate || !requestForm.duration) {
      alert("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await timeOffApi.createRequest({ ...requestForm, employeeId: currentUser.id });
      setIsRequestModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return 'var(--color-status-success)';
    if (status === 'Rejected') return 'var(--color-status-error)';
    if (status === 'Pending') return 'var(--color-status-warning)';
    return 'var(--color-text-secondary)';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Time Off</h1>
          {employeeIdFilter ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Viewing Time Off for Employee ID: {employeeIdFilter}</p>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Manage your balances and requests</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canManage && (
            <Button variant="secondary" onClick={() => navigate('/time-off/allocations')}>
              Manage Allocations
            </Button>
          )}
          {(!employeeIdFilter || employeeIdFilter == currentUser.id) && (
            <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
              <Plus size={16} style={{ marginRight: '8px' }} /> Request Leave
            </Button>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: 'var(--spacing-2)' }}>Balances</h2>
      <div style={{ display: 'flex', gap: 'var(--spacing-3)', overflowX: 'auto', marginBottom: 'var(--spacing-4)', paddingBottom: '8px' }}>
        {Object.entries(balances).length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No leave balances allocated yet.</p>
        ) : (
          Object.entries(balances).map(([type, data]) => (
            <Card key={type} style={{ minWidth: '200px', flex: '0 0 auto', marginBottom: 0 }}>
              <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>{type}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <span style={{ fontSize: '24px', fontWeight: 600 }}>{data.remaining}</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '4px' }}>days left</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  <p>Used: {data.used}</p>
                  <p>Allocated: {data.allocated}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: 'var(--spacing-2)' }}>Request History</h2>
      {requests.length === 0 ? (
        <Card>
          <EmptyState icon={Clock} title="No Requests Found" description="You haven't made any time off requests yet." />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DATES</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DURATION</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>SUBMITTED</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{r.leaveType}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.startDate} to {r.endDate}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.duration} days</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.submittedDate}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500,
                      backgroundColor: getStatusColor(r.status) + '20', 
                      color: getStatusColor(r.status) 
                    }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Request Leave Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Request Time Off">
        <form onSubmit={handleRequestSubmit}>
          <div className="input-group">
            <label>Leave Type *</label>
            <select 
              value={requestForm.leaveType} 
              onChange={e => setRequestForm({...requestForm, leaveType: e.target.value})}
            >
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>Start Date *</label>
              <input type="date" value={requestForm.startDate} onChange={e => setRequestForm({...requestForm, startDate: e.target.value})} required />
            </div>
            <div className="input-group">
              <label>End Date *</label>
              <input type="date" value={requestForm.endDate} onChange={e => setRequestForm({...requestForm, endDate: e.target.value})} required />
            </div>
          </div>
          <div className="input-group">
            <label>Duration (Days) *</label>
            <input type="number" step="0.5" value={requestForm.duration} onChange={e => setRequestForm({...requestForm, duration: e.target.value})} required />
          </div>
          <div className="input-group">
            <label>Reason / Comments</label>
            <textarea rows={3} value={requestForm.reason} onChange={e => setRequestForm({...requestForm, reason: e.target.value})} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--spacing-3)' }}>
            <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimeOff;
