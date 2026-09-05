import React from 'react';
import Card from '../common/Card';
import { AlertCircle } from 'lucide-react';

const MismatchAlerts = ({ mismatches }) => {
  if (!mismatches || mismatches.length === 0) {
    return (
      <Card title="Mismatch Alerts">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>
          No mismatches detected.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Mismatch Alerts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {mismatches.map((m) => (
          <div key={m.id} style={{ 
            display: 'flex', alignItems: 'flex-start', gap: '12px', 
            padding: '12px', border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius-sm)', borderLeft: `4px solid var(--color-status-warning)`
          }}>
            <AlertCircle size={20} color="var(--color-status-warning)" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{m.type}</div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {m.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MismatchAlerts;
