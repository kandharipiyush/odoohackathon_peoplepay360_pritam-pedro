import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attendanceApi } from '../../services/attendanceApi';
import Card from '../common/Card';
import Button from '../common/Button';
import { LogIn, LogOut, Clock, AlertCircle } from 'lucide-react';

const CheckInOutWidget = ({ onStatusChange }) => {
  const { currentUser } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    setLoading(true);
    try {
      const empId = currentUser.employee_id || currentUser.id;
      const res = await attendanceApi.getEmployeeAttendance(empId);
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = res.data.find(r => r.date === today);
      setRecord(todayRecord || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { addToast } = useToast();

  const handleCheckIn = async () => {
    try {
      const empId = currentUser.employee_id || currentUser.id;
      const res = await attendanceApi.checkIn({ employeeId: empId });
      setRecord(res.data);
      if (addToast) addToast('Check-in recorded successfully!', 'success');
      if (onStatusChange) onStatusChange();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to check in';
      if (addToast) {
        addToast(msg, 'error');
      } else {
        alert(msg);
      }
    }
  };

  const handleCheckOut = async () => {
    try {
      const empId = currentUser.employee_id || currentUser.id;
      const res = await attendanceApi.checkOut({ employeeId: empId });
      setRecord(res.data);
      if (addToast) addToast('Check-out recorded successfully!', 'success');
      if (onStatusChange) onStatusChange();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to check out';
      if (addToast) {
        addToast(msg, 'error');
      } else {
        alert(msg);
      }
    }
  };

  if (loading) return <Card>Loading status...</Card>;

  const getStatusDisplay = () => {
    if (!record) return { text: 'NOT CHECKED IN', color: 'var(--color-text-secondary)', canCheckIn: true, canCheckOut: false };
    if (record.status === 'CHECKED_IN') return { text: 'CHECKED IN', color: 'var(--color-status-success)', canCheckIn: false, canCheckOut: true };
    return { text: 'CHECKED OUT (Complete)', color: 'var(--color-text-primary)', canCheckIn: false, canCheckOut: false };
  };

  const statusInfo = getStatusDisplay();

  return (
    <Card title="Today's Attendance">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
        <div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Current Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: statusInfo.color }}></div>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>{statusInfo.text}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}><LogIn size={14} style={{ verticalAlign: 'text-bottom' }}/> Check In</p>
            <p style={{ fontSize: '16px', fontWeight: 500 }}>{record?.checkIn || '--:--'}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}><LogOut size={14} style={{ verticalAlign: 'text-bottom' }}/> Check Out</p>
            <p style={{ fontSize: '16px', fontWeight: 500 }}>{record?.checkOut || '--:--'}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}><Clock size={14} style={{ verticalAlign: 'text-bottom' }}/> Worked / Expected</p>
            <p style={{ fontSize: '16px', fontWeight: 500 }}>{record?.workedHours || '0'}h / {record?.expectedHours || '8'}h</p>
          </div>
        </div>

        <div>
          {statusInfo.canCheckIn && (
            <Button variant="primary" onClick={handleCheckIn}>
              <LogIn size={16} style={{ marginRight: '8px' }} /> Check In
            </Button>
          )}
          {statusInfo.canCheckOut && (
            <Button variant="secondary" onClick={handleCheckOut} style={{ border: '1px solid var(--color-status-error)', color: 'var(--color-status-error)' }}>
              <LogOut size={16} style={{ marginRight: '8px' }} /> Check Out
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CheckInOutWidget;
