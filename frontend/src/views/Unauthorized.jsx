import React from 'react';
import Card from '../components/common/Card';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const Unauthorized = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: 'var(--spacing-3)'
    }}>
      <Card style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <ShieldAlert size={48} color="var(--color-status-error)" style={{ margin: '0 auto var(--spacing-2)' }} />
        <h2 style={{ fontSize: '20px', marginBottom: 'var(--spacing-1)' }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-3)' }}>
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <Link to="/">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
};

export default Unauthorized;
