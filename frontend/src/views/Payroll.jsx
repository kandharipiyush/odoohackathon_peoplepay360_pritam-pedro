import React from 'react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { DollarSign } from 'lucide-react';

const Payroll = () => {
  return (
    <div>
      <Card title="Payroll">
        <EmptyState 
          icon={DollarSign}
          title="No Payroll Data"
          description="Payroll data and payslips will be displayed here once implemented."
        />
      </Card>
    </div>
  );
};

export default Payroll;
