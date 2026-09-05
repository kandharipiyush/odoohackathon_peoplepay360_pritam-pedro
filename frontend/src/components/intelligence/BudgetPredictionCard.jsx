import React from 'react';
import Card from '../common/Card';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const BudgetPredictionCard = ({ forecastData }) => {
  if (!forecastData) return null;

  const isOverBudget = forecastData.forecast > forecastData.budget;
  const statusColor = isOverBudget ? 'var(--color-status-error)' : 'var(--color-status-success)';
  const StatusIcon = isOverBudget ? AlertTriangle : CheckCircle;

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '$0';
    return `$${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--color-brand)" />
            Next Month Prediction
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Based on active employee contracts & payrun trends</p>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '4px 12px', 
          borderRadius: '12px', fontWeight: 600, backgroundColor: `${statusColor}20`, color: statusColor
        }}>
          <StatusIcon size={14} />
          {forecastData.status}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: 'var(--spacing-4)' }}>
        <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Current Payroll Spend</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(forecastData.currentPayroll)}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-md)', border: `1px solid ${statusColor}` }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Forecast Payroll</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: statusColor }}>{formatCurrency(forecastData.forecast)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Assigned Budget Target</div>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(forecastData.budget)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Expected Overrun</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: statusColor }}>{isOverBudget ? formatCurrency(forecastData.overrun) : 'None'}</div>
        </div>
      </div>
    </Card>
  );
};

export default BudgetPredictionCard;
