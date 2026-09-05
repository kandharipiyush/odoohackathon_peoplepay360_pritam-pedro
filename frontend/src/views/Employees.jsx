import React from 'react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { Users } from 'lucide-react';

const Employees = () => {
  return (
    <div>
      <Card title="Employees">
        <EmptyState 
          icon={Users}
          title="No Employees Found"
          description="Employee data will be displayed here once implemented."
        />
      </Card>
    </div>
  );
};

export default Employees;
