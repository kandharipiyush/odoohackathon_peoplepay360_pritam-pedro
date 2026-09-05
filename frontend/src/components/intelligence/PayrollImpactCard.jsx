import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import { DollarSign } from 'lucide-react';

const PayrollImpactCard = ({ impact }) => {
  const navigate = useNavigate();
  if (!impact) return null;

  const impactVal = parseFloat(impact.estimatedPayrollImpact || 0);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} color="var(--color-status-warning)" />
          Attendance Payroll Impact
        </h3>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-3)' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Estimated Impact</p>
        <div style={{ fontSize: '32px', fontWeight: 700, color: impactVal > 0 ? 'var(--color-status-warning)' : 'var(--color-status-success)', lineHeight: 1 }}>
          ${impactVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </div>
        <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {impact.unresolvedDays || 0} unresolved day{impact.unresolvedDays !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-3)' }}>
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Status:</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: impact.status === 'All Clear' ? 'var(--color-status-success)' : 'var(--color-status-warning)' }}>{impact.status || 'All Clear'}</span>
      </div>

      <Button variant="secondary" fullWidth onClick={() => navigate('/attendance')}>Review Attendance</Button>
    </Card>
  );
};

export default PayrollImpactCard;
