import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { payrollApi } from '../../services/payrollApi';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { Printer, Download, Mail, ArrowLeft, Building, User } from 'lucide-react';
import ExplainableAuditor from '../../components/intelligence/ExplainableAuditor';

const PayslipDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const canViewAudit = ['Admin', 'HR Payroll Manager', 'HR Payroll User'].includes(currentUser?.role);

  useEffect(() => {
    const fetchPayslip = async () => {
      try {
        const res = await payrollApi.getPayslip(id);
        setPayslip(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayslip();
  }, [id]);

  const handleDownload = async () => {
    setActionLoading(true);
    await payrollApi.downloadPayslipPdf(id);
    alert('PDF downloaded (Mock action)');
    setActionLoading(false);
  };

  const handleEmail = async () => {
    setActionLoading(true);
    await payrollApi.emailPayslip(id);
    alert('Payslip emailed successfully');
    setActionLoading(false);
  };

  if (loading) return <Loader fullScreen />;
  if (!payslip) return <div>Payslip not found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => window.print()}><Printer size={16} style={{ marginRight: '8px' }} /> Print</Button>
          <Button variant="secondary" onClick={handleDownload} disabled={actionLoading}><Download size={16} style={{ marginRight: '8px' }} /> PDF</Button>
          <Button variant="primary" onClick={handleEmail} disabled={actionLoading}><Mail size={16} style={{ marginRight: '8px' }} /> Email</Button>
        </div>
      </div>

      {canViewAudit && (
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <ExplainableAuditor payslipId={id} />
        </div>
      )}

      <Card id="printable-payslip" style={{ padding: 'var(--spacing-5)', borderTop: '8px solid var(--color-btn-primary)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>PeoplePay360</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>Enterprise HR & Payroll Solutions</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--color-text-secondary)' }}>PAYSLIP</h2>
            <p style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{payslip.payslipNumber}</p>
            <span style={{ 
              display: 'inline-block', marginTop: '8px', fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: 500,
              backgroundColor: payslip.paymentStatus === 'Paid' ? 'var(--color-status-success)20' : 'var(--color-status-warning)20',
              color: payslip.paymentStatus === 'Paid' ? 'var(--color-status-success)' : 'var(--color-status-warning)'
            }}>
              {payslip.paymentStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
          <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
              <User size={16} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>EMPLOYEE DETAILS</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{payslip.employeeName}</p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>ID: {payslip.employeeId}</p>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Dept: {payslip.department}</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-text-secondary)' }}>
              <Building size={16} /> <span style={{ fontSize: '12px', fontWeight: 600 }}>PAYMENT DETAILS</span>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '4px' }}><span style={{ color: 'var(--color-text-secondary)', display: 'inline-block', width: '100px' }}>Period:</span> {payslip.periodStart} to {payslip.periodEnd}</p>
            <p style={{ fontSize: '14px', marginBottom: '4px' }}><span style={{ color: 'var(--color-text-secondary)', display: 'inline-block', width: '100px' }}>Payrun ID:</span> PR-{payslip.payrunId.toString().padStart(4, '0')}</p>
          </div>
        </div>

        {/* Salary Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' }}>
          {/* Earnings */}
          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>EARNINGS</h3>
            {payslip.earnings.map((e, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>{e.name}</span>
                <span>${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, marginTop: '16px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <span>Gross Earnings</span>
              <span>${payslip.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px' }}>DEDUCTIONS</h3>
            {payslip.deductions.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>{d.name}</span>
                <span>${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, marginTop: '16px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
              <span>Total Deductions</span>
              <span>${payslip.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Net Pay Total */}
        <div style={{ backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 500 }}>Net Salary Payable</span>
          <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-btn-primary)' }}>${payslip.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </Card>
    </div>
  );
};

export default PayslipDetails;
