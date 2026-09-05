import React from 'react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { Clock } from 'lucide-react';

const TimeOff = () => {
  return (
    <div>
      <Card title="Time Off">
        <EmptyState 
          icon={Clock}
          title="No Time Off Requests"
          description="Time off data will be displayed here once implemented."
        />
      </Card>
    </div>
  );
};

export default TimeOff;
