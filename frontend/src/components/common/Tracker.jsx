import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Tracker = ({ stages }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'var(--color-status-success)';
      case 'In Progress': return 'var(--color-status-info)';
      case 'Pending': return 'var(--color-status-warning)';
      case 'Attention Required': return 'var(--color-status-error)';
      default: return 'var(--color-text-secondary)';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', overflowX: 'auto' }}>
      {stages.map((stage, idx) => (
        <React.Fragment key={idx}>
          <div 
            onClick={() => navigate(stage.path)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
              minWidth: '100px'
            }}
            title={stage.status}
          >
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              backgroundColor: getStatusColor(stage.status),
              marginBottom: '8px',
              border: '2px solid var(--color-bg-card)',
              boxShadow: `0 0 0 2px ${getStatusColor(stage.status)}40`
            }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
              {stage.name}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px', whiteSpace: 'nowrap' }}>
              {stage.status}
            </span>
          </div>
          {idx < stages.length - 1 && (
            <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--color-border)', margin: '0 8px', marginBottom: '16px' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Tracker;
