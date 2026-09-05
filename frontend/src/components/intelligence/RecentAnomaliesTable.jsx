import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import { ShieldAlert, AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import RiskAnomalyDetailModal from './RiskAnomalyDetailModal';

const RecentAnomaliesTable = ({ anomalies, loading, onRefresh }) => {
  const [filter, setFilter] = useState('All');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSeverityTheme = (severity) => {
    const sev = String(severity || '').toUpperCase();
    if (sev === 'HIGH' || sev === 'CRITICAL') return { color: 'var(--color-status-error)', bg: '#FEF2F2', border: '#F87171' };
    if (sev === 'MEDIUM') return { color: 'var(--color-status-warning)', bg: '#FFFBEB', border: '#FCD34D' };
    return { color: 'var(--color-status-success)', bg: '#F0FDF4', border: '#86EFAC' };
  };

  if (loading) return <Card><Loader /></Card>;
  
  const list = Array.isArray(anomalies) ? anomalies : [];

  if (list.length === 0) {
    return (
      <Card>
        <EmptyState icon={ShieldAlert} title="No Anomalies Detected" description="All payroll numbers are healthy and within standard variance." />
      </Card>
    );
  }

  const filtered = filter === 'All' 
    ? list 
    : list.filter(a => String(a.severity || '').toUpperCase() === filter.toUpperCase());

  const handleOpenDetails = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setIsModalOpen(true);
  };

  return (
    <div>
      <Card style={{ padding: 0, overflowX: 'auto' }} title="Recent AI Payroll Anomalies">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '8px' }}>
          <button 
            style={{ 
              padding: '4px 12px', fontSize: '12px', borderRadius: '16px', 
              border: filter === 'All' ? '1px solid var(--color-text-primary)' : '1px solid var(--color-border)', 
              background: filter === 'All' ? 'var(--color-text-primary)' : 'transparent', 
              color: filter === 'All' ? 'var(--color-bg-card)' : 'var(--color-text-secondary)', 
              cursor: 'pointer', fontWeight: 600
            }}
            onClick={() => setFilter('All')}
          >
            All ({list.length})
          </button>
          <button 
            style={{ 
              padding: '4px 12px', fontSize: '12px', borderRadius: '16px', 
              border: filter === 'HIGH' ? '1px solid var(--color-status-error)' : '1px solid var(--color-border)', 
              background: filter === 'HIGH' ? 'var(--color-status-error)' : 'transparent', 
              color: filter === 'HIGH' ? '#FFF' : 'var(--color-text-secondary)', 
              cursor: 'pointer', fontWeight: 600
            }}
            onClick={() => setFilter('HIGH')}
          >
            High Severity ({list.filter(a => String(a.severity).toUpperCase() === 'HIGH').length})
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEE</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>ANOMALY ISSUE</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>SEVERITY</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>STATUS</th>
              <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((anomaly, idx) => {
              const theme = getSeverityTheme(anomaly.severity);
              const empName = anomaly.employeeName || anomaly.employee_name || `Employee #${anomaly.employeeId || anomaly.employee_id}`;
              const empId = anomaly.employeeId || anomaly.employee_id;

              return (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 600 }}>{empName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>EMP-{String(empId).padStart(3, '0')} • {anomaly.department || 'General'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: theme.color }}>
                      <AlertTriangle size={14} color={theme.color} />
                      {anomaly.type || anomaly.anomaly_type}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {anomaly.description}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '11px', padding: '3px 8px', borderRadius: '12px', 
                      backgroundColor: theme.bg, color: theme.color, border: `1px solid ${theme.border}`, fontWeight: 700 
                    }}>
                      {anomaly.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <span style={{ 
                      fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                      backgroundColor: anomaly.status === 'Resolved' ? '#F0FDF4' : 'var(--color-bg-main)',
                      color: anomaly.status === 'Resolved' ? '#16A34A' : 'var(--color-text-secondary)',
                      fontWeight: 600
                    }}>
                      {anomaly.status || 'Flagged'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleOpenDetails(anomaly)} 
                      style={{ padding: '4px 10px', height: 'auto', fontSize: '12px', gap: '4px' }}
                    >
                      <Eye size={13} style={{ marginRight: '4px' }} /> View Details
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default RecentAnomaliesTable;
