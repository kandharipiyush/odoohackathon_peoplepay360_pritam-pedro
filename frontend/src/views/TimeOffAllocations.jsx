import React, { useState, useEffect } from 'react';
import { timeOffApi } from '../services/timeOffApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Clock } from 'lucide-react';

const TimeOffAllocations = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await timeOffApi.getAllocations();
      setAllocations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Leave Allocations</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Manage employee leave balances</p>
        </div>
        <Button variant="primary">New Allocation</Button>
      </div>

      {allocations.length === 0 ? (
        <Card>
          <EmptyState icon={Clock} title="No Allocations Found" description="There are no active leave allocations." />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMP ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>ALLOCATED</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>USED</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>REMAINING</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>VALID UNTIL</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{a.employeeId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.leaveType}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.allocatedDays}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.usedDays}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>{a.allocatedDays - a.usedDays}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.validUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default TimeOffAllocations;
