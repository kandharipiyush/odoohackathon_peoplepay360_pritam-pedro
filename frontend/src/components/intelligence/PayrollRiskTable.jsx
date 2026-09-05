import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

const PayrollRiskTable = ({ risks }) => {
  const getRiskColor = (l) => {
    switch (l) {
      case 'CRITICAL': return 'var(--color-status-error)';
      case 'HIGH': return 'var(--color-status-error)';
      case 'MEDIUM': return 'var(--color-status-warning)';
      case 'LOW': return 'var(--color-status-success)';
      default: return 'var(--color-text-secondary)';
    }
  };

  if (!risks || risks.length === 0) {
    return (
      <Card title="Payroll Risk Assessment">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>
          No risk data available.
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 0, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEE</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>RISK SCORE</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>RISK LEVEL</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>MAIN REASON</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {risks.map(r => {
            const mainReason = r.anomalies && r.anomalies.length > 0 ? r.anomalies[0].type : 'None detected';
            return (
              <tr key={r.employeeId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>ID: {r.employeeId}</td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>{r.riskScore}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500,
                    backgroundColor: `${getRiskColor(r.riskLevel)}20`, color: getRiskColor(r.riskLevel) 
                  }}>
                    {r.riskLevel}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{mainReason}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <Button variant="secondary" style={{ padding: '6px 12px', height: 'auto', fontSize: '12px' }}>Review Risk</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};

export default PayrollRiskTable;
