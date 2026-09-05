import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { ArrowLeft, TrendingUp, DollarSign, Activity, Clock, Gift, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { intelligenceApi } from '../services/intelligenceApi';
import ForecastChart from '../components/intelligence/ForecastChart';
import BudgetPredictionCard from '../components/intelligence/BudgetPredictionCard';

const PayrollAnalytics = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [forecastRes, riskRes] = await Promise.all([
          intelligenceApi.getPayrollForecast(),
          intelligenceApi.getRiskOverview()
        ]);
        setData({
          forecast: forecastRes.data,
          risk: riskRes.data,
          grossSalary: '₹48,20,000',
          totalDeductions: '₹5,70,000',
          totalNetSalary: '₹42,50,000',
          totalOvertime: '₹1,85,000',
          totalBonuses: '₹3,40,000',
          departments: [
            { name: 'Engineering', employees: 45, cost: '₹22,10,000', health: '98%', highRisk: 3 },
            { name: 'Sales', employees: 30, cost: '₹12,40,000', health: '95%', highRisk: 2 },
            { name: 'Marketing', employees: 20, cost: '₹5,00,000', health: '100%', highRisk: 0 },
            { name: 'HR & Admin', employees: 10, cost: '₹3,00,000', health: '99%', highRisk: 1 },
            { name: 'Finance', employees: 15, cost: '₹4,20,000', health: '97%', highRisk: 1 },
            { name: 'Operations', employees: 22, cost: '₹3,50,000', health: '94%', highRisk: 0 }
          ]
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Loader fullScreen />;
  if (!data) return <div>Failed to load analytics</div>;

  const maxCost = Math.max(...data.departments.map(d => parseInt(d.cost.replace(/[₹,]/g, ''))));

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-3)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back to Reports
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px', letterSpacing: '-0.5px' }}>Payroll Analytics</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Deep dive into payroll costs, overtime, bonuses, and departmental trends</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>Marketing</option>
            <option>HR & Admin</option>
            <option>Finance</option>
            <option>Operations</option>
          </select>
          <select style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <option>This Quarter</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Gross Salary</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{data.grossSalary}</div>
        </Card>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Total Deductions</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-error)' }}>{data.totalDeductions}</div>
        </Card>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Net Salary</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-success)' }}>{data.totalNetSalary}</div>
        </Card>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            <Clock size={14} /> Overtime
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-warning)' }}>{data.totalOvertime}</div>
        </Card>
        <Card style={{ padding: 'var(--spacing-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            <Gift size={14} /> Bonuses
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-status-info)' }}>{data.totalBonuses}</div>
        </Card>
      </div>

      {/* Payroll Risk Summary */}
      <Card title="Payroll Risk Summary" style={{ marginBottom: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={32} color="var(--color-status-warning)" />
            <div>
              <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{data.risk?.score}<span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>/100</span></div>
              <div style={{ fontSize: '13px', color: 'var(--color-status-warning)', fontWeight: 600 }}>{data.risk?.overallRisk} Risk</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{data.risk?.counts.low}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Low</div>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-status-warning)' }}>{data.risk?.counts.medium}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-status-warning)' }}>Medium</div>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-status-error)' }}>{data.risk?.counts.high}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-status-error)' }}>High</div>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-status-error)' }}>{data.risk?.counts.critical}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-status-error)' }}>Critical</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Row: Budget vs Forecast + Department Payroll Cost Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
        <ForecastChart data={data.forecast} />
        <Card title="Department Payroll Cost">
          <div style={{ marginTop: '16px' }}>
            {data.departments.map((dept, idx) => {
              const costNum = parseInt(dept.cost.replace(/[₹,]/g, ''));
              const widthPct = maxCost > 0 ? (costNum / maxCost) * 100 : 0;
              return (
                <div key={idx} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{dept.name}</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{dept.cost}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--color-bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${widthPct}%`, backgroundColor: 'var(--color-btn-primary)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Department Breakdown Table */}
      <Card title="Department Breakdown" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '16px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>DEPARTMENT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEES</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>PAYROLL COST</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>ATTENDANCE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>HIGH-RISK</th>
              </tr>
            </thead>
            <tbody>
              {data.departments.map((dept, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{dept.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{dept.employees}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>{dept.cost}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--color-status-success)' }}>{dept.health}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {dept.highRisk > 0 ? (
                      <span style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '12px', backgroundColor: '#FEF2F2', color: 'var(--color-status-error)', fontWeight: 500 }}>
                        {dept.highRisk}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PayrollAnalytics;
