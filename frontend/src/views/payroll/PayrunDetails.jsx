import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payrollApi } from '../../services/payrollApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { AlertTriangle, CheckCircle, RefreshCcw, DollarSign, Users, AlertCircle, ArrowLeft } from 'lucide-react';

const PayrunDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payrun, setPayrun] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [prRes, warnRes] = await Promise.all([
        payrollApi.getPayrun(id),
        payrollApi.getPayrunWarnings(id)
      ]);
      setPayrun(prRes.data);
      setWarnings(warnRes.data);
    } catch (err) {
      console.error(err);
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
      // Mock processing delay updates...
      setTimeout(fetchDetails, 3500); 
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !payrun) return <Loader fullScreen />;
  if (!payrun) return <div>Payrun not found</div>;

  const isProcessing = payrun.status === 'Processing' || processing;
  const isCompleted = payrun.status === 'Completed' || payrun.status === 'Validated' || payrun.status === 'Paid';

  const getWarningColor = (severity) => {
    if (severity === 'High') return 'var(--color-status-error)';
    if (severity === 'Medium') return 'var(--color-status-warning)';
    return 'var(--color-text-secondary)';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 'var(--spacing-3)' }}>
        <button onClick={() => navigate('/payroll')} style={{ background: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Payroll
        </button>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Payrun: PR-{payrun.id.toString().padStart(4, '0')}</h1>
        <span style={{ 
          fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: 500,
          backgroundColor: isCompleted ? 'var(--color-status-success)20' : (isProcessing ? 'var(--color-status-warning)20' : 'var(--color-border)'),
          color: isCompleted ? 'var(--color-status-success)' : (isProcessing ? 'var(--color-status-warning)' : 'var(--color-text-primary)')
        }}>
          {payrun.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
        <Card style={{ padding: 'var(--spacing-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <Calendar size={16} /> <span style={{ fontSize: '12px' }}>Pay Period</span>
          </div>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>{payrun.periodStart} to {payrun.periodEnd}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <Users size={16} /> <span style={{ fontSize: '12px' }}>Employees</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 600 }}>{payrun.employeeCount}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <DollarSign size={16} /> <span style={{ fontSize: '12px' }}>Total Net Pay</span>
          </div>
          <p style={{ fontSize: '24px', fontWeight: 600 }}>${payrun.netTotal.toLocaleString()}</p>
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
                  <td style={{ padding: '8px', textAlign: 'right', color: getWarningColor(w.severity), fontWeight: 500 }}>{w.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card title="Processing Actions">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {isProcessing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-status-warning)' }}>
                <RefreshCcw size={20} className="spin" />
                <span>Processing payroll calculations... This may take a moment.</span>
              </div>
            )}
            {isCompleted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-status-success)' }}>
                <CheckCircle size={20} />
                <span>Processing complete. Payslips have been generated.</span>
              </div>
            )}
            {payrun.status === 'Draft' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-secondary)' }}>
                <AlertCircle size={20} />
                <span>Ready for processing. Review warnings before proceeding.</span>
              </div>
            )}
          </div>
          
          <div>
            {payrun.status === 'Draft' && (
              <Button variant="primary" onClick={handleProcess} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Run Payroll Calculations'}
              </Button>
            )}
            {isCompleted && (
              <Button variant="primary" onClick={() => navigate(`/payroll?tab=payslips&payrunId=${id}`)}>
                View Payslips
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
