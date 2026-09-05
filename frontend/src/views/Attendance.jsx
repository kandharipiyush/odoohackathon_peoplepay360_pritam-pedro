import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceApi } from '../services/attendanceApi';
import { intelligenceApi } from '../services/intelligenceApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import CheckInOutWidget from '../components/attendance/CheckInOutWidget';
import ExceptionReview from '../components/attendance/ExceptionReview';
import { CalendarCheck, AlertCircle } from 'lucide-react';

import AttendanceHealthCard from '../components/intelligence/AttendanceHealthCard';
import PayrollImpactCard from '../components/intelligence/PayrollImpactCard';
import MismatchAlerts from '../components/intelligence/MismatchAlerts';

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employeeId');
  const { currentUser } = useAuth();
  
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExceptions, setShowExceptions] = useState(false);
  
  // Intelligence State
  const [impactData, setImpactData] = useState(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);

  const canReview = ['Admin', 'HR Manager'].includes(currentUser?.role);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let res;
      if (currentUser.role === 'Employee' || employeeIdFilter) {
        const targetId = employeeIdFilter || currentUser.id;
        res = await attendanceApi.getEmployeeAttendance(targetId);
      } else {
        res = await attendanceApi.getAttendance();
      }
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntelligence = async () => {
    setLoadingIntelligence(true);
    try {
      const res = await intelligenceApi.getAttendancePayrollImpact(currentUser?.employee_id || currentUser?.id || 1);
      setImpactData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIntelligence(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    if (canReview) {
      fetchIntelligence();
    }
  }, [employeeIdFilter, currentUser]);

  const summary = {
    present: attendance.filter(a => a.status === 'CHECKED_IN' || a.status === 'CHECKED_OUT').length,
    exceptions: attendance.filter(a => a.exception).length,
    totalHours: attendance.reduce((acc, curr) => acc + (curr.workedHours || 0), 0)
  };

  if (showExceptions && canReview) {
    return <ExceptionReview onBack={() => setShowExceptions(false)} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Attendance Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Monitor daily attendance and timesheets</p>
        </div>
        {canReview && (
          <button 
            onClick={() => setShowExceptions(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', 
              backgroundColor: '#FEF2F2', color: 'var(--color-status-error)', border: '1px solid #FCA5A5' 
            }}
          >
            <AlertCircle size={16} /> Review Exceptions ({summary.exceptions})
          </button>
        )}
      </div>

      {/* Intelligence Section for HR */}
      {canReview && !loadingIntelligence && impactData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <AttendanceHealthCard impact={impactData} />
            <MismatchAlerts mismatches={impactData.mismatches} />
          </div>
          <div>
            <PayrollImpactCard impact={impactData} />
          </div>
        </div>
      )}

      {currentUser.role === 'Employee' && (
        <CheckInOutWidget onStatusChange={fetchAttendance} />
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
        <Card style={{ padding: 'var(--spacing-2)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Present (Records)</p>
          <p style={{ fontSize: '24px', fontWeight: 600 }}>{summary.present}</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-2)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total Worked Hours</p>
          <p style={{ fontSize: '24px', fontWeight: 600 }}>{summary.totalHours.toFixed(1)}h</p>
        </Card>
        <Card style={{ padding: 'var(--spacing-2)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Exceptions</p>
          <p style={{ fontSize: '24px', fontWeight: 600, color: summary.exceptions > 0 ? 'var(--color-status-error)' : 'inherit' }}>{summary.exceptions}</p>
        </Card>
      </div>

      {loading ? <Loader fullScreen /> : attendance.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarCheck} title="No Attendance Records" description="There are no attendance records to display for this period." />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                {currentUser.role !== 'Employee' && <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMP ID</th>}
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DATE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>CHECK-IN</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>CHECK-OUT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>HOURS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EXCEPTION</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {currentUser.role !== 'Employee' && <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{a.employeeId}</td>}
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.checkIn || '--:--'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.checkOut || '--:--'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.workedHours ? a.workedHours.toFixed(1) + 'h' : '--'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '12px',
                      backgroundColor: a.status === 'CHECKED_IN' ? 'var(--color-status-success)20' : 'var(--color-border)',
                      color: a.status === 'CHECKED_IN' ? 'var(--color-status-success)' : 'var(--color-text-primary)'
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-status-error)' }}>
                    {a.exception || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
