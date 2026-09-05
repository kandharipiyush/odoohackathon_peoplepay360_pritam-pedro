import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { timeOffApi } from '../services/timeOffApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import { Clock, Plus, Check, X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const TimeOff = () => {
  const [searchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employeeId');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [balances, setBalances] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Request leave modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    leaveType: 'Paid Annual Leave',
    startDate: '',
    endDate: '',
    duration: '',
    reason: ''
  });
  const [saving, setSaving] = useState(false);

  // Deny / Reject modal
  const [denyModalOpen, setDenyModalOpen] = useState(false);
  const [denyRequestId, setDenyRequestId] = useState(null);
  const [denyReason, setDenyReason] = useState('Schedule conflict');
  const [denying, setDenying] = useState(false);

  const userRole = (currentUser?.role || '').toLowerCase();
  const canManage = userRole.includes('hr') || userRole.includes('admin') || userRole.includes('payroll') || userRole.includes('auditor');
  const targetId = employeeIdFilter || (canManage ? null : (currentUser?.employee_id || currentUser?.id));

  const fetchData = async () => {
    setLoading(true);
    try {
      const balanceTarget = employeeIdFilter || currentUser?.employee_id || currentUser?.id || 1;
      const requestParams = targetId ? { employee_id: targetId } : {};

      const [balRes, reqRes] = await Promise.all([
        timeOffApi.getBalances(balanceTarget),
        timeOffApi.getRequests(requestParams)
      ]);
      setBalances(balRes.data || {});
      const reqList = Array.isArray(reqRes.data) ? reqRes.data : (reqRes.data?.data || []);
      setRequests(reqList);
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
      const empId = currentUser?.employee_id || currentUser?.id || 1;
      await timeOffApi.createRequest({ ...requestForm, employeeId: empId });
      addToast('Leave request submitted successfully.', 'success');
      setIsRequestModalOpen(false);
      setRequestForm({
        leaveType: 'Paid Annual Leave',
        startDate: '',
        endDate: '',
        duration: '',
        reason: ''
      });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit request';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await timeOffApi.approveRequest(id);
      addToast('Leave request approved successfully.', 'success');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to approve request';
      alert(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDenyModal = (id) => {
    setDenyRequestId(id);
    setDenyReason('Schedule conflict');
    setDenyModalOpen(true);
  };

  const handleDenySubmit = async (e) => {
    e.preventDefault();
    if (!denyRequestId) return;

    setDenying(true);
    try {
      await timeOffApi.rejectRequest(denyRequestId, { reason: denyReason || 'Schedule conflict' });
      addToast('Leave request denied.', 'warning');
      setDenyModalOpen(false);
      setDenyRequestId(null);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to deny request';
      alert(msg);
    } finally {
      setDenying(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return 'var(--color-status-success)';
    if (status === 'Rejected' || status === 'Refused' || status === 'Denied') return 'var(--color-status-error)';
    if (status === 'Pending' || status === 'Submitted') return 'var(--color-status-warning)';
    return 'var(--color-text-secondary)';
  };

  const getStatusLabel = (status) => {
    if (status === 'Approved') return 'Approved';
    if (status === 'Rejected' || status === 'Refused' || status === 'Denied') return 'Denied';
    if (status === 'Pending' || status === 'Submitted') return 'Pending Approval';
    return status;
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return r.status === 'Submitted' || r.status === 'Pending';
    if (statusFilter === 'APPROVED') return r.status === 'Approved';
    if (statusFilter === 'REJECTED') return r.status === 'Rejected' || r.status === 'Refused' || r.status === 'Denied';
    return true;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Time Off</h1>
          {employeeIdFilter ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Viewing Time Off for Employee ID: {employeeIdFilter}</p>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {canManage ? 'Review employee leave requests & manage balances' : 'Manage your balances and requests'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canManage && (
            <Button variant="secondary" onClick={() => navigate('/time-off/allocations')}>
              Manage Allocations
            </Button>
          )}
          <Button variant="primary" onClick={() => setIsRequestModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Request Leave
          </Button>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', margin: 0 }}>
          {canManage ? 'Employee Leave Requests' : 'Request History'} ({filteredRequests.length})
        </h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: statusFilter === filter ? 'var(--color-btn-primary)' : 'var(--color-bg-card)',
                color: statusFilter === filter ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {filter === 'ALL' ? 'All' : filter === 'PENDING' ? 'Pending Approval' : filter === 'APPROVED' ? 'Approved' : 'Denied'}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <EmptyState icon={Clock} title="No Requests Found" description="There are no time off requests matching the selected filter." />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                {canManage && <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMPLOYEE</th>}
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DATES</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DURATION</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>REASON / REMARKS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>SUBMITTED</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>STATUS</th>
                {canManage && <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'right' }}>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(r => {
                const isPending = r.status === 'Submitted' || r.status === 'Pending';
                const isActing = actionLoadingId === r.id;

                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {canManage && (
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>
                        <div>{r.employee_name || r.employeeName || `Employee ${r.employee_id || r.employeeId}`}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{r.department || 'Staff'}</div>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{r.leaveType}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.startDate} to {r.endDate}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.duration} days</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{r.reason || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{r.submittedDate}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 600,
                        backgroundColor: getStatusColor(r.status) + '20', 
                        color: getStatusColor(r.status) 
                      }}>
                        {getStatusLabel(r.status)}
                      </span>
                    </td>
                    {canManage && (
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={isActing}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500
                              }}
                              title="Approve Leave Request"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => openDenyModal(r.id)}
                              disabled={isActing}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: '#EF4444',
                                color: '#FFFFFF',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500
                              }}
                              title="Deny / Refuse Leave Request"
                            >
                              <X size={14} /> Deny
                            </button>
                          </div>
                        ) : (
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 600,
                            color: r.status === 'Approved' ? '#10B981' : '#EF4444' 
                          }}>
                            {r.status === 'Approved' ? '✓ Approved' : '✗ Denied'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Denial Reason Modal */}
      <Modal isOpen={denyModalOpen} onClose={() => setDenyModalOpen(false)} title="Deny Leave Request">
        <form onSubmit={handleDenySubmit}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#991B1B' }}>
              Are you sure you want to refuse this leave request? Please provide an optional reason or explanation for the employee.
            </p>
          </div>

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Reason for Denial / Refusal *</label>
            <textarea 
              rows={3} 
              value={denyReason} 
              onChange={e => setDenyReason(e.target.value)} 
              placeholder="e.g. Schedule conflict with ongoing product sprint"
              required 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setDenyModalOpen(false)} disabled={denying}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
              disabled={denying}
            >
              {denying ? 'Denying...' : 'Confirm Denial'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Leave Modal */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Request Time Off">
        <form onSubmit={handleRequestSubmit}>
          <div className="input-group">
            <label>Leave Type *</label>
            <select 
              value={requestForm.leaveType} 
              onChange={e => setRequestForm({...requestForm, leaveType: e.target.value})}
            >
              <option value="Paid Annual Leave">Paid Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
              <option value="Compensatory Off">Compensatory Off</option>
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
