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
            Budget: ₹{(data.budget / 100000).toFixed(1)}L
          </span>
        </div>

        {/* Bars */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%', paddingBottom: '24px' }}>
          {data.historical.map((val, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%', justifyContent: 'flex-end', zIndex: 2 }}>
              <div style={{ width: '100%', backgroundColor: 'var(--color-text-sidebar)', height: getBarHeight(val), borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }} title={`₹${(val/100000).toFixed(1)}L`} />
              <div style={{ position: 'absolute', bottom: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>M-{data.historical.length - idx}</div>
            </div>
          ))}
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%', justifyContent: 'flex-end', zIndex: 2 }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: data.forecast > data.budget ? 'var(--color-status-error)' : 'var(--color-status-info)', 
              height: getBarHeight(data.forecast), 
              borderTopLeftRadius: '4px', borderTopRightRadius: '4px' 
            }} title={`₹${(data.forecast/100000).toFixed(1)}L`} />
            <div style={{ position: 'absolute', bottom: 0, fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Next</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-text-sidebar)', borderRadius: '2px' }} /> Historical
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-status-info)', borderRadius: '2px' }} /> Forecast
        </div>
      </div>
    </Card>
  );
};

export default ForecastChart;
