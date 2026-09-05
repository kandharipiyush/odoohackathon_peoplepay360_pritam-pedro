import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../services/attendanceApi';
import Card from '../common/Card';
import Button from '../common/Button';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { AlertCircle, Check, X, ArrowLeft, Clock, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

const ExceptionReview = ({ onBack }) => {
  const { addToast } = useToast();
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedException, setSelectedException] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getExceptions();
      setExceptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching exceptions:', err);
      addToast('Failed to load attendance exceptions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleReview = async (actionType) => {
    if (!selectedException) return;
    setActionLoading(true);
    try {
      await attendanceApi.reviewException(selectedException.id, {
        action: actionType,
        status: actionType === 'RESOLVED' ? 'Present' : 'Late',
        comment: reviewComment,
        notes: reviewComment
      });

      addToast(
        actionType === 'RESOLVED' 
          ? 'Exception approved and marked as reconciled.' 
          : 'Exception rejected and penalty recorded.',
        'success'
      );

      setSelectedException(null);
      setReviewComment('');
      await fetchExceptions();
    } catch (err) {
      console.error('Error reviewing exception:', err);
      addToast(err.response?.data?.error || err.message || 'Failed to submit review.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBack} 
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            <ArrowLeft size={16} /> Back to Attendance
          </button>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Attendance Exception Review</h1>
        </div>

        <span style={{ 
          fontSize: '12px', 
          fontWeight: 600, 
          padding: '4px 12px', 
          borderRadius: '12px', 
          backgroundColor: exceptions.length > 0 ? '#FEF2F2' : '#F0FDF4', 
          color: exceptions.length > 0 ? 'var(--color-status-error)' : '#16A34A',
          border: `1px solid ${exceptions.length > 0 ? '#FCA5A5' : '#86EFAC'}`
        }}>
          {exceptions.length} Pending Exceptions
        </span>
      </div>

      {exceptions.length === 0 ? (
        <Card style={{ padding: '40px 20px', textAlign: 'center' }}>
          <EmptyState 
            icon={CheckCircle2} 
            title="All Exceptions Resolved!" 
            description="There are currently no flagged attendance logs requiring manager reconciliation." 
          />
          <div style={{ marginTop: '20px' }}>
            <Button variant="secondary" onClick={onBack}>
              Return to Attendance Records
            </Button>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>EMP ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>DATE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>EXCEPTION TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>CHECK-IN / OUT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>LOGGED HOURS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(exc => (
                <tr key={exc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>{exc.employeeId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{exc.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '3px 10px', borderRadius: '10px',
                      backgroundColor: '#FEF2F2', color: '#DC2626',
                      fontWeight: 600, fontSize: '12px',
                      border: '1px solid #FCA5A5'
                    }}>
                      <AlertCircle size={13} /> {exc.exception || exc.status || 'Late / Absence'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {exc.checkIn || '--:--'} → {exc.checkOut || '--:--'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>
                    {exc.workedHours ? `${exc.workedHours}h` : '0.0h'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Button 
                      variant="secondary" 
                      size="small"
                      onClick={() => setSelectedException(exc)}
                    >
                      Review & Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selectedException && (
        <Modal 
          isOpen={!!selectedException} 
          onClose={() => { setSelectedException(null); setReviewComment(''); }}
          title="Review Attendance Exception"
          maxWidth="560px"
        >
          <div style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            backgroundColor: '#FEF2F2', 
            border: '1px solid #FCA5A5', 
            marginBottom: '16px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
              <AlertCircle size={16} /> Exception Flagged by Attendance Engine
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><strong>Employee ID:</strong> {selectedException.employeeId}</div>
              <div><strong>Date:</strong> {selectedException.date}</div>
              <div><strong>Check-In:</strong> {selectedException.checkIn || '--:--'}</div>
              <div><strong>Check-Out:</strong> {selectedException.checkOut || '--:--'}</div>
              <div><strong>Worked Hours:</strong> {selectedException.workedHours || 0} hrs</div>
              <div><strong>Flagged Issue:</strong> <span style={{ color: '#DC2626', fontWeight: 600 }}>{selectedException.exception || selectedException.status}</span></div>
            </div>
          </div>
          
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Manager Decision Notes & Reason
            </label>
            <textarea 
              rows={3} 
              value={reviewComment} 
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="e.g. Verified valid client on-site visit / Approved late arrival grace period..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-main)',
                fontSize: '13px',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => handleReview('REJECTED')} 
              disabled={actionLoading}
              style={{ color: 'var(--color-status-error)', borderColor: '#FCA5A5' }}
            >
              {actionLoading ? 'Processing...' : 'Reject & Apply Penalty'}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleReview('RESOLVED')} 
              disabled={actionLoading}
              style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
            >
              {actionLoading ? 'Processing...' : 'Resolve & Approve'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExceptionReview;
