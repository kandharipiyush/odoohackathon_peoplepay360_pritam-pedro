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

  const lifecycleStages = [
    { name: 'Employee', status: 'Completed', path: '/employees' },
    { name: 'Contract', status: 'Completed', path: '/contracts' },
    { name: 'Attendance', status: 'In Progress', path: '/attendance' },
    { name: 'Time Off', status: 'Pending', path: '/timeoff' },
    { name: 'Payrun', status: 'Attention Required', path: '/payroll' },
    { name: 'Payslip', status: 'Pending', path: '/payroll' },
    { name: 'Payment', status: 'Pending', path: '/payroll' }
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px', letterSpacing: '-0.5px' }}>PeoplePay360 Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Enterprise HR & Payroll Operations</p>
        </div>
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
      </div>

      {['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role) ? (
        <>
          {/* Operational Status Tracker */}
          <Card style={{ marginBottom: 'var(--spacing-4)' }} title="HR to Payroll Lifecycle">
            <Tracker stages={lifecycleStages} />
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
            <Card style={{ padding: 'var(--spacing-3)' }}>
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
      ) : (
        <Card>
          <h2 style={{ fontSize: '18px' }}>Welcome to PeoplePay360, {currentUser?.firstName}</h2>
          <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>
            Select an item from the sidebar to view your information.
          </p>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
