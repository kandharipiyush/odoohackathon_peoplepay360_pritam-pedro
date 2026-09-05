import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { intelligenceApi } from '../services/intelligenceApi';
import BudgetPredictionCard from '../components/intelligence/BudgetPredictionCard';
import ForecastChart from '../components/intelligence/ForecastChart';
import PredictionReasons from '../components/intelligence/PredictionReasons';
import AttendanceHealthCard from '../components/intelligence/AttendanceHealthCard';
import PayrollImpactCard from '../components/intelligence/PayrollImpactCard';
import MismatchAlerts from '../components/intelligence/MismatchAlerts';
import RecentAnomaliesTable from '../components/intelligence/RecentAnomaliesTable';
import Loader from '../components/common/Loader';
import Tracker from '../components/common/Tracker';
import { RefreshCw, Users, FileText, Calendar, Clock, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [period, setPeriod] = useState('this_month');
  const [forecastData, setForecastData] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [riskOverview, setRiskOverview] = useState(null);
  const [attendanceImpact, setAttendanceImpact] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (selectedPeriod = period) => {
    setLoading(true);
    try {
      if (['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role)) {
        const [forecastRes, kpiRes, riskRes, impactRes, anomaliesRes] = await Promise.all([
          intelligenceApi.getPayrollForecast({ period: selectedPeriod }),
          intelligenceApi.getDashboardKPIs(selectedPeriod),
          intelligenceApi.getRiskOverview(selectedPeriod),
          intelligenceApi.getAttendancePayrollImpact(currentUser?.employee_id || currentUser?.id || 1, selectedPeriod),
          intelligenceApi.getPayrollAnomalies({ period: selectedPeriod })
        ]);
        setForecastData(forecastRes.data);
        setKpiData(kpiRes.data);
        setRiskOverview(riskRes.data);
        setAttendanceImpact(impactRes.data);
        setAnomalies(anomaliesRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [currentUser]);

  const isPayrollAdmin = ['Admin', 'HR Payroll Manager', 'HR Payroll User'].includes(currentUser?.role);
  const isHRManager = currentUser?.role === 'HR Manager';
  const isEmployee = currentUser?.role === 'Employee';

  const payrollLifecycleStages = [
    { name: 'Employee', status: 'Completed', path: '/employees' },
    { name: 'Contract', status: 'Completed', path: '/contracts' },
    { name: 'Attendance', status: 'In Progress', path: '/attendance' },
    { name: 'Time Off', status: 'Pending', path: '/timeoff' },
    { name: 'Payrun', status: 'Attention Required', path: '/payroll' },
    { name: 'Payslip', status: 'Pending', path: '/payroll' },
    { name: 'Payment', status: 'Pending', path: '/payroll' }
  ];

  const hrLifecycleStages = [
    { name: 'Employees', status: 'Completed', path: '/employees' },
    { name: 'Contracts', status: 'Completed', path: '/contracts' },
    { name: 'Attendance', status: 'In Progress', path: '/attendance' },
    { name: 'Time Off', status: 'Pending Approval', path: '/timeoff' },
    { name: 'Allocations', status: 'Active', path: '/time-off/allocations' },
    { name: 'HR Reports', status: 'Ready', path: '/reports' }
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {isPayrollAdmin ? 'PeoplePay360 Financial & Payroll Dashboard' : isHRManager ? 'PeoplePay360 HR Operations Dashboard' : 'PeoplePay360 Employee Portal'}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            {isPayrollAdmin ? 'Enterprise HR & Payroll Operations' : isHRManager ? 'Workforce, Contracts, Attendance & Leave Management' : 'Personal Profile, Timesheets, Time Off & Payslips'}
          </p>
        </div>
        {!isEmployee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select 
              value={period} 
              onChange={(e) => {
                const newPeriod = e.target.value;
                setPeriod(newPeriod);
                fetchData(newPeriod);
              }}
              style={{ 
                width: 'auto', 
                padding: '8px 12px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--color-border)', 
                backgroundColor: 'var(--color-bg-card)', 
                color: 'var(--color-text-primary)', 
                fontWeight: 500, 
                cursor: 'pointer' 
              }}
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="q3_2026">Q3 2026</option>
              <option value="ytd">Year to Date</option>
            </select>
            <Button variant="secondary" onClick={() => fetchData(period)}>
              <RefreshCw size={16} style={{ marginRight: '8px' }} /> Refresh
            </Button>
          </div>
        )}
      </div>

      {/* 1. PAYROLL ADMIN / FINANCE AUDITOR VIEW */}
      {isPayrollAdmin ? (
        <>
          {/* Operational Status Tracker */}
          <Card style={{ marginBottom: 'var(--spacing-4)' }} title="HR to Payroll Lifecycle">
            <Tracker stages={payrollLifecycleStages} />
          </Card>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/employees')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Users size={16} /> Total Employees
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{kpiData?.totalEmployees.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-status-success)', marginTop: '4px' }}>{kpiData?.totalEmployees.change} from last month</div>
            </Card>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/employees')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Users size={16} /> Active Employees
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{kpiData?.activeEmployees.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-status-success)', marginTop: '4px' }}>{kpiData?.activeEmployees.change} from last month</div>
            </Card>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/payroll')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <DollarSign size={16} /> Total Net Salary
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{kpiData?.totalNetSalary.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-status-warning)', marginTop: '4px' }}>{kpiData?.totalNetSalary.change} vs budget</div>
            </Card>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Activity size={16} /> Attendance Health
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>{kpiData?.attendanceHealth.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{kpiData?.attendanceHealth.status}</div>
            </Card>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/timeoff')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Calendar size={16} /> Pending Time Off
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-warning)' }}>{kpiData?.pendingTimeOff.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{kpiData?.pendingTimeOff.status}</div>
            </Card>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/payroll')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <FileText size={16} /> Payroll Status
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-warning)' }}>{kpiData?.payrollStatus.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Action required</div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
            
            {/* Payroll Risk Overview */}
            <Card title="Payroll Risk Overview" style={{ borderTop: '4px solid var(--color-status-error)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-status-warning)', lineHeight: 1 }}>{riskOverview?.score} <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>/100</span></div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-status-warning)', marginTop: '4px' }}>{riskOverview?.overallRisk} Risk Level</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-status-error)' }}>{riskOverview?.highRiskEmployees}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>High-Risk Employees</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{riskOverview?.counts.low}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>LOW (0-30)</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-status-warning)' }}>{riskOverview?.counts.medium}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-status-warning)' }}>MED (31-60)</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-status-error)' }}>{riskOverview?.counts.high}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-status-error)' }}>HIGH (61-80)</div>
                </div>
                <div style={{ padding: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-status-error)' }}>{riskOverview?.counts.critical}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-status-error)' }}>CRIT (81-100)</div>
                </div>
              </div>
              <Button variant="secondary" fullWidth onClick={() => navigate('/payroll')}>View Anomalies</Button>
            </Card>

            {/* Attendance + Leave Impact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AttendanceHealthCard impact={attendanceImpact} />
              <PayrollImpactCard impact={attendanceImpact} />
            </div>

          </div>

          <h2 style={{ fontSize: '18px', marginBottom: 'var(--spacing-3)' }}>Payroll Cost Prediction</h2>
          {/* Payroll Cost Prediction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-3)', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              <BudgetPredictionCard forecastData={forecastData} />
              <ForecastChart data={forecastData} />
            </div>
            <div>
              <PredictionReasons reasons={forecastData?.reasons} />
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-4)' }}>
            <RecentAnomaliesTable anomalies={anomalies} loading={loading} />
          </div>
        </>
      ) : isHRManager ? (
        /* 2. HR OPERATIONS DASHBOARD (NO PAYROLL LOCKOUTS) */
        <>
          {/* HR Lifecycle Tracker */}
          <Card style={{ marginBottom: 'var(--spacing-4)' }} title="HR Operations & Employee Lifecycle">
            <Tracker stages={hrLifecycleStages} />
          </Card>

          {/* HR KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/employees')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Users size={16} /> Total Headcount
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{kpiData?.totalEmployees.value || 10}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-status-success)', marginTop: '4px' }}>+10% Workforce Growth</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/employees')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Users size={16} /> Active Employees
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{kpiData?.activeEmployees.value || 10}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-status-success)', marginTop: '4px' }}>100% Active Staff</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/contracts')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <FileText size={16} /> Contract Coverage
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>100%</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>All Active Contracts</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Activity size={16} /> Attendance Health
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>{kpiData?.attendanceHealth.value || '98%'}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Healthy • On Track</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/timeoff')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Calendar size={16} /> Pending Time Off
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-warning)' }}>{kpiData?.pendingTimeOff.value || 0}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Requests Awaiting Review</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/reports')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <FileText size={16} /> HR Compliance
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>100%</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Reports Ready for Export</div>
            </Card>
          </div>

          {/* Department Headcount Distribution & Attendance Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
            
            {/* Department Breakdown */}
            <Card title="Department Talent Distribution">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {[
                  { dept: 'Engineering', count: 4, pct: 40, color: '#3B82F6' },
                  { dept: 'Management', count: 2, pct: 20, color: '#8B5CF6' },
                  { dept: 'Finance & Accounts', count: 2, pct: 20, color: '#10B981' },
                  { dept: 'Sales & Marketing', count: 1, pct: 10, color: '#F59E0B' },
                  { dept: 'Human Resources', count: 1, pct: 10, color: '#EC4899' },
                ].map((d) => (
                  <div key={d.dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{d.dept}</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{d.count} employees ({d.pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${d.pct}%`, height: '100%', backgroundColor: d.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" fullWidth onClick={() => navigate('/employees')}>
                Manage Employee Directory
              </Button>
            </Card>

            {/* Attendance & Leave Operations Hub */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AttendanceHealthCard impact={attendanceImpact} />
              <Card title="Leave & Absence Operations">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-warning)' }}>{kpiData?.pendingTimeOff.value || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Pending Requests to Approve</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>20 Days</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Avg Annual Leave Balance</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="primary" fullWidth onClick={() => navigate('/timeoff')}>
                    Review Leave Requests
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => navigate('/time-off/allocations')}>
                    Allocations
                  </Button>
                </div>
              </Card>
            </div>

          </div>

          {/* Quick HR Management Actions Hub */}
          <Card title="Quick HR Management Actions">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-2)' }}>
              <Button variant="secondary" onClick={() => navigate('/employees/new')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <Users size={18} style={{ marginRight: '8px', color: 'var(--color-btn-primary)' }} /> Add New Employee
              </Button>
              <Button variant="secondary" onClick={() => navigate('/contracts/new')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <FileText size={18} style={{ marginRight: '8px', color: 'var(--color-status-info)' }} /> Create New Contract
              </Button>
              <Button variant="secondary" onClick={() => navigate('/attendance')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <Activity size={18} style={{ marginRight: '8px', color: 'var(--color-status-success)' }} /> Review Attendance & Exceptions
              </Button>
              <Button variant="secondary" onClick={() => navigate('/reports')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <FileText size={18} style={{ marginRight: '8px', color: 'var(--color-status-warning)' }} /> Export HR Reports
              </Button>
            </div>
          </Card>
        </>
      ) : (
        /* 3. EMPLOYEE SELF-SERVICE PORTAL */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {/* Employee KPI Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-3)' }}>
            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/attendance')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Activity size={16} /> My Attendance
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>98%</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Healthy • On Track</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/timeoff')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Calendar size={16} /> Available Leave
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-info)' }}>15 Days</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Annual & Sick Balances</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/payroll')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <DollarSign size={16} /> Latest Payslip
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>Paid</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Processed & Available</div>
            </Card>

            <Card style={{ padding: 'var(--spacing-3)', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                <Users size={16} /> Employment Status
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>Active</div>
              <div style={{ fontSize: '12px', color: 'var(--color-status-success)', marginTop: '4px' }}>Full-Time Regular</div>
            </Card>
          </div>

          {/* Quick Actions Hub */}
          <Card title="Quick Actions">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-2)' }}>
              <Button variant="secondary" onClick={() => navigate('/attendance')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <Activity size={18} style={{ marginRight: '8px', color: 'var(--color-status-info)' }} /> Check In / Timesheets
              </Button>
              <Button variant="secondary" onClick={() => navigate('/timeoff')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <Calendar size={18} style={{ marginRight: '8px', color: 'var(--color-status-warning)' }} /> Request Time Off
              </Button>
              <Button variant="secondary" onClick={() => navigate('/payroll')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <DollarSign size={18} style={{ marginRight: '8px', color: 'var(--color-status-success)' }} /> View My Payslips
              </Button>
              <Button variant="secondary" onClick={() => navigate('/profile')} style={{ padding: '14px', justifyContent: 'flex-start' }}>
                <Users size={18} style={{ marginRight: '8px', color: 'var(--color-btn-primary)' }} /> View My Profile
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
