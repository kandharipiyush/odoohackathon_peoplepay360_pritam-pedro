import React from 'react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { BarChart2 } from 'lucide-react';

const Reports = () => {
  return (
    <div>
      <Card title="Reports">
        <EmptyState 
          icon={BarChart2}
          title="No Reports Generated"
          description="Reporting tools and dashboards will be available here."
        />
      </Card>
    </div>
  );
};

export default Reports;
