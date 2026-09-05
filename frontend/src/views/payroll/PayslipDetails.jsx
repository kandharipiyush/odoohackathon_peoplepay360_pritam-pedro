import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payrollApi } from '../../services/payrollApi';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { Printer, Download, Mail, ArrowLeft, Building, User, FileText, CheckCircle2 } from 'lucide-react';
import ExplainableAuditor from '../../components/intelligence/ExplainableAuditor';
import { useToast } from '../../context/ToastContext';

const PayslipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const canViewAudit = ['Admin', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor'].includes(currentUser?.role);

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const res = await payrollApi.getPayslip(id);
        setPayslip(res.data);
      } catch (err) {
        console.error('Error fetching payslip:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslip();
  }, [id]);

  const handleDownload = async () => {
    try {
      setActionLoading(true);
      await payrollApi.downloadPayslipPdf(id);
      addToast('Official Payslip PDF downloaded.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || err.message || 'Failed to download PDF', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmail = async () => {
    try {
      setActionLoading(true);
      await payrollApi.emailPayslip(id);
      addToast('Payslip emailed to employee successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || err.message || 'Failed to send email', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!payslip) return <div style={{ padding: '32px', textAlign: 'center' }}>Payslip not found</div>;

  const earnings = Array.isArray(payslip.earnings) ? payslip.earnings : [];
  const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];
  const totalDed = payslip.totalDeductions ?? Math.max(0, (payslip.grossSalary || 0) - (payslip.netSalary || 0));
  const payrunDisplayId = (payslip.payrunId ?? payslip.payrun_id ?? 1).toString().padStart(4, '0');

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer size={16} style={{ marginRight: '6px' }} /> Print
          </Button>
          <Button variant="secondary" onClick={handleDownload} disabled={actionLoading}>
            <Download size={16} style={{ marginRight: '6px' }} /> Download PDF
          </Button>
          <Button variant="primary" onClick={handleEmail} disabled={actionLoading}>
            <Mail size={16} style={{ marginRight: '6px' }} /> Email
          </Button>
        </div>
      </div>

      {canViewAudit && (
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <ExplainableAuditor payslipId={id} />
        </div>
      )}

      <Card id="printable-payslip" style={{ padding: 'var(--spacing-5)', borderTop: '8px solid var(--color-brand)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>PeoplePay360</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>Enterprise HR & Payroll Solutions</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--color-text-secondary)', fontWeight: 600 }}>OFFICIAL PAYSLIP</h2>
            <p style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--color-brand)' }}>{payslip.payslipNumber || `PS-${id}`}</p>
            <span style={{ 
              display: 'inline-block', marginTop: '6px', fontSize: '12px', padding: '3px 10px', borderRadius: '12px', fontWeight: 600,
              backgroundColor: payslip.paymentStatus === 'Paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              color: payslip.paymentStatus === 'Paid' ? 'var(--color-status-success)' : '#CA8A04'
            }}>
              {(payslip.paymentStatus || 'Draft').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
          <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-text-secondary)' }}>
              <User size={16} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>EMPLOYEE DETAILS</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', margin: 0 }}>{payslip.employeeName}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 2px' }}>ID: {payslip.employeeId}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>Department: {payslip.department || 'Engineering'}</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--color-text-secondary)' }}>
              <Building size={16} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>PAYMENT CYCLE</span>
            </div>
            <p style={{ fontSize: '13px', margin: '0 0 4px' }}><span style={{ color: 'var(--color-text-secondary)', display: 'inline-block', width: '100px' }}>Period:</span> <strong>{payslip.periodStart} to {payslip.periodEnd}</strong></p>
            <p style={{ fontSize: '13px', margin: 0 }}><span style={{ color: 'var(--color-text-secondary)', display: 'inline-block', width: '100px' }}>Payrun Ref:</span> PR-{payrunDisplayId}</p>
          </div>
        </div>

        {/* Salary Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
          {/* Earnings */}
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>EARNINGS</h3>
            {earnings.map((e, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>{e.name}</span>
                <span style={{ fontWeight: 500 }}>${(parseFloat(e.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, marginTop: '16px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <span>Gross Wages</span>
              <span style={{ color: 'var(--color-brand)' }}>${(payslip.grossSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Deductions */}
          <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>DEDUCTIONS & TAXES</h3>
            {deductions.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>{d.name}</span>
                <span style={{ fontWeight: 500, color: 'var(--color-status-error)' }}>-${(parseFloat(d.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, marginTop: '16px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <span>Total Deductions</span>
              <span style={{ color: 'var(--color-status-error)' }}>-${totalDed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Net Pay Total */}
        <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--color-border)' }}>
          <div>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', display: 'block' }}>Net Take-Home Salary</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Direct bank transfer on settlement</span>
          </div>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-status-success)' }}>
            ${(payslip.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default PayslipDetails;
