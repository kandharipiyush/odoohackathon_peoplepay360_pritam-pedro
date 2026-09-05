import React from 'react';
import Card from '../common/Card';
import { AlertCircle } from 'lucide-react';

const AnomalyAlerts = ({ anomalies }) => {
  const getSeverityColor = (severity) => {
    return severity === 'HIGH' || severity === 'CRITICAL' ? 'var(--color-status-error)' : 'var(--color-status-warning)';
  };

  if (!anomalies || anomalies.length === 0) {
    return (
      <Card title="Anomaly Alerts">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)' }}>
          No anomalies detected.
        </div>
      </Card>
    );
  }

  return (
    <Card title="Anomaly Alerts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {anomalies.map((anomaly, idx) => (
          <div key={idx} style={{ 
            display: 'flex', alignItems: 'flex-start', gap: '12px', 
            padding: '12px', border: '1px solid var(--color-border)', 
            borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${getSeverityColor(anomaly.severity)}`
          }}>
            <AlertCircle size={20} color={getSeverityColor(anomaly.severity)} style={{ marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{anomaly.type}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{anomaly.date}</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                {anomaly.description}
                {anomaly.employeeId && ` (Emp ID: ${anomaly.employeeId})`}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: `${getSeverityColor(anomaly.severity)}20`, color: getSeverityColor(anomaly.severity), borderRadius: '12px', fontWeight: 500 }}>
                  {anomaly.severity}
                </span>
                <span style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: 'var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '12px', fontWeight: 500 }}>
                  {anomaly.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AnomalyAlerts;
