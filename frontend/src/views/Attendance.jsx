import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceApi } from '../services/attendanceApi';
import { intelligenceApi } from '../services/intelligenceApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import CheckInOutWidget from '../components/attendance/CheckInOutWidget';
import ExceptionReview from '../components/attendance/ExceptionReview';
import { CalendarCheck, AlertCircle, Search, Filter, Clock, CheckCircle2, AlertTriangle, User, RefreshCw } from 'lucide-react';

import AttendanceHealthCard from '../components/intelligence/AttendanceHealthCard';
import PayrollImpactCard from '../components/intelligence/PayrollImpactCard';
import MismatchAlerts from '../components/intelligence/MismatchAlerts';

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employeeId');
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExceptions, setShowExceptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Intelligence State
  const [impactData, setImpactData] = useState(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);

  const canReview = ['Admin', 'admin', 'HR Manager', 'hr manager', 'HR Payroll Manager'].some(
    r => (currentUser?.role || '').toLowerCase().includes(r.toLowerCase())
  );

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let res;
      if (currentUser.role === 'Employee' || employeeIdFilter) {
        const targetId = employeeIdFilter || currentUser.employee_id || currentUser.id;
        res = await attendanceApi.getEmployeeAttendance(targetId);
      } else {
        res = await attendanceApi.getAttendance();
      }
      setAttendance(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      addToast('Failed to load attendance records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntelligence = async () => {
    setLoadingIntelligence(true);
    try {
      const targetId = canReview ? 'company' : (currentUser?.employee_id || currentUser?.id || 1);
      const res = await intelligenceApi.getAttendancePayrollImpact(targetId);
      setImpactData(res?.data?.data || res?.data || null);
    } catch (err) {
      console.error('Error fetching intelligence:', err);
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

  const summary = useMemo(() => {
    const totalPresent = attendance.filter(a => a.status === 'Present' || a.status === 'CHECKED_IN' || a.status === 'CHECKED_OUT').length;
    const totalLate = attendance.filter(a => a.status === 'Late' || a.exception).length;
    const totalOvertime = attendance.filter(a => a.status === 'Overtime' || (parseFloat(a.workedHours || 0) > 8)).length;
    const totalHours = attendance.reduce((acc, curr) => acc + parseFloat(curr.workedHours || 0), 0);

    return {
      present: totalPresent,
      exceptions: totalLate,
      overtime: totalOvertime,
      totalHours: parseFloat(totalHours.toFixed(1))
    };
  }, [attendance]);

  // Filtered records based on search and status pills
  const filteredAttendance = useMemo(() => {
    return attendance.filter(item => {
      // Status filter
      if (statusFilter === 'PRESENT' && !(item.status === 'Present' || item.status === 'CHECKED_IN' || item.status === 'CHECKED_OUT')) return false;
      if (statusFilter === 'EXCEPTIONS' && !(item.exception || item.status === 'Late' || item.status === 'Half_Day')) return false;
      if (statusFilter === 'OVERTIME' && !(item.status === 'Overtime' || parseFloat(item.workedHours || 0) > 8)) return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const empId = String(item.employeeId || '').toLowerCase();
        const empName = String(item.employee_name || item.employeeName || '').toLowerCase();
        const date = String(item.date || '').toLowerCase();
        const status = String(item.status || '').toLowerCase();
        return empId.includes(q) || empName.includes(q) || date.includes(q) || status.includes(q);
      }

      return true;
    });
  }, [attendance, statusFilter, searchTerm]);

  if (showExceptions && canReview) {
    return (
      <ExceptionReview 
        onBack={() => {
          setShowExceptions(false);
          fetchAttendance();
          fetchIntelligence();
        }} 
      />
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px', letterSpacing: '-0.5px' }}>Attendance & Timesheets</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Real-time clock logs, automated overtime tracking, and leave-to-payroll hooks
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant="secondary" onClick={fetchAttendance} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </Button>

          {canReview && (
            <button 
              onClick={() => setShowExceptions(true)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '8px 16px', borderRadius: 'var(--radius-sm)', 
                backgroundColor: summary.exceptions > 0 ? '#FEF2F2' : '#F0FDF4', 
                color: summary.exceptions > 0 ? '#DC2626' : '#16A34A', 
                border: `1px solid ${summary.exceptions > 0 ? '#FCA5A5' : '#86EFAC'}`,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              <AlertCircle size={16} /> 
              Review Exceptions ({summary.exceptions})
            </button>
          )}
        </div>
      </div>

      {/* Intelligence Section for HR Managers */}
      {canReview && !loadingIntelligence && impactData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <AttendanceHealthCard impact={impactData} />
            <MismatchAlerts mismatches={impactData.mismatches} />
          </div>
          <div>
            <PayrollImpactCard impact={impactData} />
          </div>
        </div>
      )}

      {/* Employee Quick Clock-In Widget */}
      {currentUser.role === 'Employee' && (
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <CheckInOutWidget onStatusChange={fetchAttendance} />
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Present Records
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#16A34A' }}>{summary.present}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Active Shifts</div>
        </Card>

        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Total Worked Hours
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800 }}>{summary.totalHours}h</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Logged Cumulative</div>
        </Card>

        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Overtime Sessions
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB' }}>{summary.overtime}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>&gt; 8 Hours Shift</div>
        </Card>

        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
            Flagged Exceptions
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: summary.exceptions > 0 ? '#DC2626' : '#16A34A' }}>
            {summary.exceptions}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Late / Incomplete</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: 'var(--spacing-4)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'All Records' },
              { key: 'PRESENT', label: 'Present' },
              { key: 'EXCEPTIONS', label: 'Exceptions & Late' },
              { key: 'OVERTIME', label: 'Overtime' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setStatusFilter(p.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: statusFilter === p.key ? '1px solid var(--color-btn-primary)' : '1px solid var(--color-border)',
                  backgroundColor: statusFilter === p.key ? 'var(--color-btn-primary)' : 'var(--color-bg-main)',
                  color: statusFilter === p.key ? '#ffffff' : 'var(--color-text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input
              type="text"
              placeholder="Search employee, ID, date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-main)',
                fontSize: '13px',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      {loading ? (
        <Loader fullScreen />
      ) : filteredAttendance.length === 0 ? (
        <Card>
          <EmptyState 
            icon={CalendarCheck} 
            title="No Attendance Records Found" 
            description="There are no records matching your selected filter or search criteria." 
          />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                {currentUser.role !== 'Employee' && <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>EMPLOYEE</th>}
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>DATE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>CHECK-IN</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>CHECK-OUT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>WORKED HOURS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>ATTENDANCE DETAILS / REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map(a => {
                const isLate = a.status === 'Late' || a.exception;
                const isOvertime = a.status === 'Overtime' || parseFloat(a.workedHours || 0) > 8;

                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {currentUser.role !== 'Employee' && (
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>
                        <div>{a.employee_name || a.employeeName || a.employeeId}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{a.employeeId}</div>
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{a.date}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {a.checkIn || '--:--'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-text-primary)' }}>
                      {a.checkOut || '--:--'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 700 }}>
                      {a.workedHours ? `${a.workedHours}h` : '--'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                      <span style={{ 
                        padding: '3px 10px', borderRadius: '12px', fontWeight: 600,
                        backgroundColor: isLate ? '#FEF2F2' : isOvertime ? 'rgba(37, 99, 235, 0.12)' : '#F0FDF4',
                        color: isLate ? '#DC2626' : isOvertime ? '#2563EB' : '#16A34A',
                        border: `1px solid ${isLate ? '#FCA5A5' : isOvertime ? 'rgba(37, 99, 235, 0.3)' : '#86EFAC'}`
                      }}>
                        {a.status || 'Present'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>
                      {(() => {
                        const hours = parseFloat(a.workedHours || 0);
                        if (a.exception || a.status === 'Late') {
                          return (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              color: '#DC2626', backgroundColor: '#FEF2F2', padding: '3px 8px', borderRadius: '8px', border: '1px solid #FCA5A5', fontWeight: 600 
                            }}>
                              <AlertCircle size={13} /> {a.exception || 'Late Arrival (Grace Exceeded)'}
                            </span>
                          );
                        }
                        if (a.status === 'Overtime' || hours > 8.0) {
                          const otDiff = hours > 8.0 ? (hours - 8.0).toFixed(1) : '1.0';
                          return (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              color: '#2563EB', backgroundColor: '#EFF6FF', padding: '3px 8px', borderRadius: '8px', border: '1px solid #BFDBFE', fontWeight: 600 
                            }}>
                              ⚡ Overtime (+{otDiff}h) • Approved
                            </span>
                          );
                        }
                        if (a.status === 'Half_Day' || (hours > 0 && hours < 4.5)) {
                          return (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              color: '#D97706', backgroundColor: '#FFFBEB', padding: '3px 8px', borderRadius: '8px', border: '1px solid #FDE68A', fontWeight: 600 
                            }}>
                              🕒 Half Day Logged ({hours}h)
                            </span>
                          );
                        }
                        if (a.status === 'Absent') {
                          return (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              color: '#DC2626', backgroundColor: '#FEF2F2', padding: '3px 8px', borderRadius: '8px', border: '1px solid #FCA5A5', fontWeight: 600 
                            }}>
                              ❌ Unapproved Absence
                            </span>
                          );
                        }
                        if (a.checkIn && !a.checkOut) {
                          return (
                            <span style={{ 
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              color: '#7C3AED', backgroundColor: '#F5F3FF', padding: '3px 8px', borderRadius: '8px', border: '1px solid #DDD6FE', fontWeight: 600 
                            }}>
                              💼 Active Shift • In Progress
                            </span>
                          );
                        }
                        return (
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            color: '#16A34A', backgroundColor: '#F0FDF4', padding: '3px 8px', borderRadius: '8px', border: '1px solid #86EFAC', fontWeight: 600 
                          }}>
                            ✓ Work Done • On Time & Full Shift
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default Attendance;
