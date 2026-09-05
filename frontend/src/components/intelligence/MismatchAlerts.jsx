import React from 'react';
import Card from '../common/Card';
import { AlertCircle, AlertTriangle, Clock, CalendarX, ShieldAlert } from 'lucide-react';

const MismatchAlerts = ({ mismatches }) => {
  const list = Array.isArray(mismatches) ? mismatches : [];

  if (list.length === 0) {
    return (
      <Card title="Attendance & Leave Mismatch Alerts">
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          ✓ Zero attendance or leave mismatches detected for this cycle. All timesheets reconciled.
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Attendance & Leave Mismatches (${list.length})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
        {list.map((m, idx) => {
          const isHigh = m.severity === 'HIGH' || m.type?.toLowerCase().includes('absence');
          const isLate = m.type?.toLowerCase().includes('tardiness') || m.type?.toLowerCase().includes('late');
          const borderClr = isHigh ? '#FCA5A5' : isLate ? '#FDE68A' : 'var(--color-border)';
          const bgClr = isHigh ? 'rgba(254, 242, 242, 0.6)' : isLate ? 'rgba(255, 251, 235, 0.6)' : 'var(--color-bg-main)';
          const iconColor = isHigh ? '#DC2626' : isLate ? '#D97706' : 'var(--color-brand)';

          return (
            <div 
              key={m.id || idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                padding: '12px 14px', 
                border: `1px solid ${borderClr}`, 
                borderRadius: '8px', 
                backgroundColor: bgClr,
                borderLeft: `4px solid ${iconColor}`
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {isHigh ? <CalendarX size={18} color={iconColor} /> : isLate ? <Clock size={18} color={iconColor} /> : <AlertTriangle size={18} color={iconColor} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                    {m.type || 'Attendance Discrepancy'}
                    {m.employeeName && (
                      <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
                        • {m.employeeName} {m.department ? `(${m.department})` : ''}
                      </span>
                    )}
                  </div>
                  {m.severity && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      backgroundColor: isHigh ? '#FEE2E2' : '#FEF3C7',
                      color: isHigh ? '#DC2626' : '#92400E',
                      textTransform: 'uppercase'
                    }}>
                      {m.severity}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {m.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default MismatchAlerts;
