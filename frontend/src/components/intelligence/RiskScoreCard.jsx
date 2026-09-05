import React from 'react';
import Card from '../common/Card';
import { AlertTriangle, Info } from 'lucide-react';

const RiskScoreCard = ({ score, level }) => {
  const getRiskColor = (l) => {
    switch (l) {
      case 'CRITICAL': return 'var(--color-status-error)';
      case 'HIGH': return 'var(--color-status-error)';
      case 'MEDIUM': return 'var(--color-status-warning)';
      case 'LOW': return 'var(--color-status-success)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getRiskPercentage = () => Math.min(Math.max(score, 0), 100);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color={getRiskColor(level)} />
          Payroll Risk Score
        </h3>
        <div title="Indicates how unusual or potentially problematic this payroll record appears based on detected factors." style={{ cursor: 'help' }}>
          <Info size={16} color="var(--color-text-secondary)" />
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-4)' }}>
        <div style={{ fontSize: '48px', fontWeight: 700, color: getRiskColor(level), lineHeight: 1 }}>
          {score}
          <span style={{ fontSize: '16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}> / 100</span>
        </div>
        <div style={{ 
          display: 'inline-block', marginTop: '8px', padding: '4px 12px', borderRadius: '12px', 
          backgroundColor: `${getRiskColor(level)}20`, color: getRiskColor(level), fontSize: '12px', fontWeight: 600 
        }}>
          {level} RISK
        </div>
      </div>

      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: '30%', backgroundColor: 'var(--color-status-success)' }} />
        <div style={{ width: '30%', backgroundColor: 'var(--color-status-warning)' }} />
        <div style={{ width: '20%', backgroundColor: 'var(--color-status-error)' }} />
        <div style={{ width: '20%', backgroundColor: '#991B1B' }} />
      </div>
      
      <div style={{ position: 'relative', width: '100%', height: '16px', marginTop: '4px' }}>
        <div style={{ 
          position: 'absolute', 
          left: `calc(${getRiskPercentage()}% - 6px)`, 
          top: '-12px',
          width: '0', 
          height: '0', 
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `6px solid var(--color-text-primary)`
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        <span>0</span>
        <span>Low</span>
        <span>Med</span>
        <span>High</span>
        <span>100</span>
      </div>
    </Card>
  );
};

export default RiskScoreCard;
