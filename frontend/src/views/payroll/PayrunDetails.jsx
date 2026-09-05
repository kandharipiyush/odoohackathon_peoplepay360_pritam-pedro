import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payrollApi } from '../../services/payrollApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { AlertTriangle, CheckCircle, RefreshCcw, DollarSign, Users, AlertCircle, ArrowLeft, Check, CheckCheck } from 'lucide-react';

const PayrunDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [prRes, warnRes] = await Promise.all([
        payrollApi.getPayrun(id),
        payrollApi.getPayrunWarnings(id).catch(() => ({ data: [] }))
      ]);
      setPayrun(prRes.data);
      setWarnings(warnRes.data || []);
    } catch (err) {
      console.error('Error loading payrun:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await payrollApi.processPayrun(id);
      setPayrun(res.data);
      setActionSuccess('Payroll computed successfully.');
      setTimeout(() => setActionSuccess(''), 3000);
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to compute payrun');
    } finally {
      setProcessing(false);
    }
  };

  const handleValidate = async () => {
    setProcessing(true);
    try {
      const res = await payrollApi.validatePayrun(id);
      setPayrun(res.data);
      setActionSuccess('Payrun batch successfully validated.');
      setTimeout(() => setActionSuccess(''), 3000);
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to validate payrun');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (window.confirm('Mark this payrun as Paid and finalize all employee disbursements?')) {
      setProcessing(true);
      try {
        const res = await payrollApi.markPayrunAsPaid(id);
        setPayrun(res.data);
        setActionSuccess('Payrun marked as Paid.');
        setTimeout(() => setActionSuccess(''), 3000);
        await fetchDetails();
      } catch (err) {
        alert(err.response?.data?.error || err.message || 'Failed to disburse payrun');
      } finally {
        setProcessing(false);
      }
    }
  };

  if (loading && !payrun) return <Loader fullScreen />;
  if (!payrun) return <div style={{ padding: '24px', textAlign: 'center' }}>Payrun not found</div>;

  const isProcessing = payrun.status === 'Processing' || processing;
  const isComputed = payrun.status === 'Computed';
  const isValidated = payrun.status === 'Validated';
  const isPaid = payrun.status === 'Paid';

  const getStatusColor = (status) => {
    if (status === 'Paid') return '#16A34A';
    if (status === 'Validated') return '#2563EB';
    if (status === 'Computed') return '#7C3AED';
    if (status === 'Draft') return '#CA8A04';
    return 'var(--color-text-secondary)';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--spacing-3)' }}>
        <button onClick={() => navigate('/payroll')} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back to Payroll
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Payrun: PR-{payrun.id.toString().padStart(4, '0')}</h1>
        <span style={{ 
          fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: 600,
          backgroundColor: getStatusColor(payrun.status) + '18',
          color: getStatusColor(payrun.status),
          border: `1px solid ${getStatusColor(payrun.status)}40`
        }}>
          {payrun.status}
        </span>
      </div>

      {actionSuccess && (
        <div style={{ 
          backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A', 
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={18} /> {actionSuccess}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <Calendar size={16} /> <span style={{ fontSize: '12px' }}>Pay Period</span>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{payrun.periodStart} to {payrun.periodEnd}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <Users size={16} /> <span style={{ fontSize: '12px' }}>Employees Processed</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-brand)' }}>{payrun.employeeCount || payrun.total_payslips || 0}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <DollarSign size={16} /> <span style={{ fontSize: '12px' }}>Total Gross Wages</span>
          </div>
          <p style={{ fontSize: '22px', fontWeight: 600, margin: 0 }}>${(payrun.grossTotal || payrun.total_gross || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <DollarSign size={16} /> <span style={{ fontSize: '12px' }}>Total Net Disbursement</span>
          </div>
          <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#16A34A' }}>${(payrun.netTotal || payrun.total_net || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </Card>
      </div>

      {warnings.length > 0 && (
        <Card style={{ marginBottom: 'var(--spacing-4)', borderLeft: '4px solid var(--color-status-warning)' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-status-warning)', marginBottom: 'var(--spacing-3)' }}>
            <AlertTriangle size={20} /> Pre-Processing Warnings ({warnings.length})
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '8px' }}>EMPLOYEE</th>
                <th style={{ padding: '8px' }}>ISSUE TYPE</th>
                <th style={{ padding: '8px' }}>DESCRIPTION</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>SEVERITY</th>
              </tr>
            </thead>
            <tbody>
              {warnings.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px', fontWeight: 500 }}>{w.employeeId}</td>
                  <td style={{ padding: '8px' }}>{w.type}</td>
                  <td style={{ padding: '8px', color: 'var(--color-text-secondary)' }}>{w.description}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--color-status-warning)', fontWeight: 500 }}>{w.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card title="Workflow & Disbursement Actions">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            {isProcessing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-status-warning)' }}>
                <RefreshCcw size={20} className="spin" />
                <span>Processing payroll engine... This may take a moment.</span>
              </div>
            )}
            {isPaid && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#16A34A' }}>
                <CheckCheck size={20} />
                <span>Disbursement completed. All payslips finalized and marked as Paid.</span>
              </div>
            )}
            {isValidated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#2563EB' }}>
                <CheckCircle size={20} />
                <span>Payrun is validated and locked for audit. Ready for disbursement.</span>
              </div>
            )}
            {isComputed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#7C3AED' }}>
                <CheckCircle size={20} />
                <span>Payroll computed. Review payslips and validate to finalize.</span>
              </div>
            )}
            {payrun.status === 'Draft' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-secondary)' }}>
                <AlertCircle size={20} />
                <span>Payrun is in Draft. Click below to run payroll calculation engine.</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {payrun.status === 'Draft' && (
              <Button variant="primary" onClick={handleProcess} disabled={isProcessing} style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}>
                {isProcessing ? 'Computing...' : 'Run Payroll Calculations'}
              </Button>
            )}

            {isComputed && (
              <>
                <Button variant="secondary" onClick={handleProcess} disabled={isProcessing}>
                  Recompute
                </Button>
                <Button variant="primary" onClick={handleValidate} disabled={isProcessing} style={{ backgroundColor: '#2563EB', borderColor: '#2563EB' }}>
                  Validate & Audit Payrun
                </Button>
              </>
            )}

            {isValidated && (
              <Button variant="primary" onClick={handleMarkPaid} disabled={isProcessing} style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}>
                Mark as Paid / Disburse
              </Button>
            )}

            {(isComputed || isValidated || isPaid) && (
              <Button variant="secondary" onClick={() => navigate(`/payroll?tab=payslips`)}>
                View All Payslips
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PayrunDetails;

const Calendar = ({ size, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);
