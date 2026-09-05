import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { AlertCircle, Eye, ShieldAlert } from 'lucide-react';
import RiskAnomalyDetailModal from './RiskAnomalyDetailModal';

const AnomalyAlerts = ({ anomalies, onRefresh }) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSeverityTheme = (severity) => {
    const sev = String(severity || '').toUpperCase();
    if (sev === 'HIGH' || sev === 'CRITICAL') return { color: '#EF4444', bg: '#FEF2F2', border: '#F87171' };
    if (sev === 'MEDIUM') return { color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D' };
    return { color: '#10B981', bg: '#F0FDF4', border: '#86EFAC' };
  };

  const list = Array.isArray(anomalies) ? anomalies : [];

  if (list.length === 0) {
    return (
      <Card title="Live Anomaly Feed">
        <div style={{ textAlign: 'center', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          No anomalies detected. System variance is healthy.
        </div>
      </Card>
    );
  }

  const handleOpenDetails = (a) => {
    setSelectedAnomaly(a);
    setIsModalOpen(true);
  };

  return (
    <div>
      <Card title="Live AI Anomaly Feed">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.slice(0, 5).map((anomaly, idx) => {
            const theme = getSeverityTheme(anomaly.severity);
            const empName = anomaly.employeeName || anomaly.employee_name || `Employee #${anomaly.employeeId || anomaly.employee_id}`;

            return (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', flexDirection: 'column', gap: '6px', 
                  padding: '12px', border: '1px solid var(--color-border)', 
                  borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${theme.color}`,
                  backgroundColor: 'var(--color-bg-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: theme.color }}>{anomaly.type || anomaly.anomaly_type}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{anomaly.date || 'Recent'}</span>
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {anomaly.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {empName}
                  </span>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleOpenDetails(anomaly)}
                    style={{ padding: '2px 8px', height: '24px', fontSize: '11px' }}
                  >
                    <Eye size={12} style={{ marginRight: '3px' }} /> Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <RiskAnomalyDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        anomaly={selectedAnomaly}
        onResolved={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export default AnomalyAlerts;
