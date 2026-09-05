import React from 'react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { CalendarCheck } from 'lucide-react';

const Attendance = () => {
  return (
    <div>
      <Card title="Attendance">
        <EmptyState 
          icon={CalendarCheck}
          title="No Attendance Records"
          description="Attendance data will be displayed here once implemented."
        />
      </Card>
    </div>
  );
};

export default Attendance;
