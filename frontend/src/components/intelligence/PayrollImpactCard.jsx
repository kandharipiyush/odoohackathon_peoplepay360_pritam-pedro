import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { DollarSign } from 'lucide-react';

const PayrollImpactCard = ({ impact }) => {
  if (!impact) return null;

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
        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-status-warning)', lineHeight: 1 }}>
          ₹{impact.estimatedPayrollImpact.toLocaleString()}
        </div>
        <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {impact.unresolvedDays} unresolved day{impact.unresolvedDays !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-3)' }}>
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Status:</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-status-warning)' }}>{impact.status}</span>
      </div>

      <Button variant="secondary" fullWidth>Review Attendance</Button>
    </Card>
  );
};

export default PayrollImpactCard;
