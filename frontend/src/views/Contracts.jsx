import React from 'react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { FileText } from 'lucide-react';

const Contracts = () => {
  return (
    <div>
      <Card title="Contracts">
        <EmptyState 
          icon={FileText}
          title="No Contracts Found"
          description="Contract data will be displayed here once implemented."
        />
      </Card>
    </div>
  );
};

export default Contracts;
