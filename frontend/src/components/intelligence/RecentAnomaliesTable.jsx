import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const RecentAnomaliesTable = ({ anomalies, loading }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');

  const getSeverityColor = (severity) => {
    return severity === 'HIGH' || severity === 'CRITICAL' ? 'var(--color-status-error)' : 'var(--color-status-warning)';
  };

  if (loading) return <Card><Loader /></Card>;
  if (!anomalies || anomalies.length === 0) {
    return (
      <Card>
        <EmptyState icon={ShieldAlert} title="No Anomalies Detected" description="Payroll looks healthy and within normal variance." />
      </Card>
    );
  }

  const filtered = filter === 'All' ? anomalies : anomalies.filter(a => a.severity === filter);

  return (
    <Card style={{ padding: 0, overflowX: 'auto' }} title="Recent Payroll Anomalies">
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '8px' }}>
        <button 
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '16px', border: filter === 'All' ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)', background: filter === 'All' ? 'var(--color-text-primary)' : 'transparent', color: filter === 'All' ? 'var(--color-bg-card)' : 'var(--color-text-secondary)', cursor: 'pointer' }}
          onClick={() => setFilter('All')}
        >
          All
        </button>
        <button 
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '16px', border: filter === 'HIGH' ? '1px solid var(--color-status-error)' : '1px solid var(--color-border)', background: filter === 'HIGH' ? 'var(--color-status-error)' : 'transparent', color: filter === 'HIGH' ? '#FFF' : 'var(--color-text-secondary)', cursor: 'pointer' }}
          onClick={() => setFilter('HIGH')}
        >
          High Severity
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEE ID</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>ISSUE</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>SEVERITY</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>DATE</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>STATUS</th>
            <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((anomaly, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{anomaly.employeeId}</td>
              <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color={getSeverityColor(anomaly.severity)} />
                  {anomaly.type}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{anomaly.description}</div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', backgroundColor: `${getSeverityColor(anomaly.severity)}20`, color: getSeverityColor(anomaly.severity), fontWeight: 500 }}>
                  {anomaly.severity}
                </span>
              </td>
              <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>{anomaly.date}</td>
              <td style={{ padding: '12px 16px', fontSize: '14px' }}>{anomaly.status}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <Button variant="secondary" onClick={() => navigate('/payroll')} style={{ padding: '6px 12px', height: 'auto', fontSize: '12px' }}>Review</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export default RecentAnomaliesTable;
