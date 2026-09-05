import React from 'react';
import Card from '../components/common/Card';

const Dashboard = () => {
  return (
    <div>
      <Card>
        <h2>Welcome to PeoplePay360</h2>
        <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
          Select an item from the sidebar to view more details.
        </p>
      </Card>
    </div>
  );
};

export default Dashboard;
