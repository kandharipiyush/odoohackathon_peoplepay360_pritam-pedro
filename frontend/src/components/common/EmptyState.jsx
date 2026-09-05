import React from 'react';
import { FileQuestion } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileQuestion, 
  title = 'No Data Available', 
  description = 'There is no data to display here yet.',
  action 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-5)',
      textAlign: 'center',
      color: 'var(--color-text-secondary)'
    }}>
      <Icon size={48} style={{ marginBottom: 'var(--spacing-2)', opacity: 0.5 }} />
      <h3 style={{ 
        color: 'var(--color-text-primary)', 
        marginBottom: 'var(--spacing-1)',
        fontSize: '16px'
      }}>
        {title}
      </h3>
      <p style={{ marginBottom: 'var(--spacing-3)', fontSize: '14px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
