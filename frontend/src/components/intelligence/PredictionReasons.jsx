import React from 'react';
import Card from '../common/Card';
import { ArrowUpRight } from 'lucide-react';

const PredictionReasons = ({ reasons }) => {
  if (!reasons || reasons.length === 0) return null;

  return (
    <Card title="Forecast Drivers">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reasons.map((reason, idx) => (
          <div key={idx} style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{reason.type}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{reason.description}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-status-error)', fontWeight: 600, fontSize: '14px' }}>
              <ArrowUpRight size={16} />
              {reason.impact}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PredictionReasons;
