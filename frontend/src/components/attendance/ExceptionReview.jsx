import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../services/attendanceApi';
import Card from '../common/Card';
import Button from '../common/Button';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import Modal from '../common/Modal';
import { AlertCircle, Check, X, ArrowLeft } from 'lucide-react';

const ExceptionReview = ({ onBack }) => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedException, setSelectedException] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getExceptions();
      setExceptions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleReview = async (status) => {
    if (!selectedException) return;
    try {
      await attendanceApi.reviewException(selectedException.id, {
        status,
        comment: reviewComment
      });
      setSelectedException(null);
      setReviewComment('');
      fetchExceptions();
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--spacing-3)' }}>
        <button onClick={onBack} style={{ background: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Exception Review</h1>
      </div>

      {exceptions.length === 0 ? (
        <Card>
          <EmptyState icon={Check} title="All Caught Up!" description="There are no attendance exceptions to review." />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMP ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DATE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EXCEPTION TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>HOURS LOGGED</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(exc => (
                <tr key={exc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{exc.employeeId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{exc.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-status-error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} /> {exc.exception}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{exc.workedHours || 0} / {exc.expectedHours}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Button variant="secondary" onClick={() => setSelectedException(exc)}>Review</Button>
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
          title="Review Exception"
        >
          <div style={{ marginBottom: 'var(--spacing-3)' }}>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Employee ID:</strong> {selectedException.employeeId}</p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Date:</strong> {selectedException.date}</p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Issue:</strong> <span style={{ color: 'var(--color-status-error)' }}>{selectedException.exception}</span></p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Check In:</strong> {selectedException.checkIn || '--:--'}</p>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Check Out:</strong> {selectedException.checkOut || '--:--'}</p>
          </div>
          
          <div className="input-group">
            <label>Reviewer Comments</label>
            <textarea 
              rows={3} 
              value={reviewComment} 
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Add your notes about how this was resolved..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'var(--spacing-3)' }}>
            <Button variant="secondary" onClick={() => handleReview('REJECTED')} style={{ color: 'var(--color-status-error)', borderColor: 'var(--color-status-error)' }}>
              Reject
            </Button>
            <Button variant="primary" onClick={() => handleReview('RESOLVED')} style={{ backgroundColor: 'var(--color-status-success)', borderColor: 'var(--color-status-success)' }}>
              Resolve & Approve
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExceptionReview;
