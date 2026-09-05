import React from 'react';
import Card from '../common/Card';

const ForecastChart = ({ data }) => {
  if (!data || !data.historical) return null;

  // Combine historical and forecast for the chart
  const allValues = [...data.historical, data.forecast];
  const maxValue = Math.max(...allValues, data.budget) * 1.1; // 10% headroom

  const getBarHeight = (val) => `${(val / maxValue) * 100}%`;
  const budgetLineHeight = `${(data.budget / maxValue) * 100}%`;

  return (
    <Card title="Payroll Cost Trend">
      <div style={{ position: 'relative', height: '200px', marginTop: 'var(--spacing-4)', paddingTop: '20px' }}>
        
        {/* Budget Line */}
        <div style={{ 
          position: 'absolute', bottom: budgetLineHeight, left: 0, right: 0, 
          borderBottom: '2px dashed var(--color-status-error)', zIndex: 1 
        }}>
          <span style={{ 
            position: 'absolute', right: '0', top: '-20px', fontSize: '11px', 
            fontWeight: 600, color: 'var(--color-status-error)', backgroundColor: 'var(--color-bg-card)', padding: '0 4px'
          }}>
            Budget: ${Math.round(data.budget).toLocaleString()}
          </span>
        </div>

        {/* Bars */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', paddingBottom: '24px' }}>
          {data.historical.map((val, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%', justifyContent: 'flex-end', zIndex: 2 }}>
              <div 
                style={{ width: '100%', backgroundColor: 'var(--color-text-sidebar, #3B82F6)', height: getBarHeight(val), borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }} 
                title={`$${Math.round(val).toLocaleString()}`} 
              />
              <div style={{ position: 'absolute', bottom: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>M-{data.historical.length - idx}</div>
            </div>
          ))}
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%', justifyContent: 'flex-end', zIndex: 2 }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: data.forecast > data.budget ? 'var(--color-status-error)' : '#2563EB', 
              height: getBarHeight(data.forecast), 
              borderTopLeftRadius: '4px', borderTopRightRadius: '4px' 
            }} title={`$${Math.round(data.forecast).toLocaleString()}`} />
            <div style={{ position: 'absolute', bottom: 0, fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Next</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-text-sidebar, #3B82F6)', borderRadius: '2px' }} /> Historical Spend
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#2563EB', borderRadius: '2px' }} /> Projected Forecast
        </div>
      </div>
    </Card>
  );
};

export default ForecastChart;
