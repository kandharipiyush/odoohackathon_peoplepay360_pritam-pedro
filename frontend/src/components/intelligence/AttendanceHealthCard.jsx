import React from 'react';
import Card from '../common/Card';
import { Activity } from 'lucide-react';

const AttendanceHealthCard = ({ impact }) => {
  if (!impact) return null;

  const getHealthStatus = () => {
    if (impact.unresolvedDays > 2) return { text: 'Poor', color: 'var(--color-status-error)' };
    if (impact.unresolvedDays > 0) return { text: 'Needs Attention', color: 'var(--color-status-warning)' };
    return { text: 'Healthy', color: 'var(--color-status-success)' };
  };

  const status = getHealthStatus();

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--color-status-info)" />
          Attendance Health
        </h3>
        <span style={{ 
          fontSize: '12px', padding: '4px 12px', borderRadius: '12px', fontWeight: 600,
          backgroundColor: `${status.color}20`, color: status.color
        }}>
          {status.text}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Expected Days</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{impact.expectedDays}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Actual Attendance</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-status-success)' }}>{impact.attendanceDays}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Approved Leave</div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{impact.approvedLeaveDays}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Unresolved Days</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: impact.unresolvedDays > 0 ? 'var(--color-status-error)' : 'var(--color-text-primary)' }}>
            {impact.unresolvedDays}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceHealthCard;
