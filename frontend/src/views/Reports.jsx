import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, TrendingUp, AlertTriangle, CalendarCheck, Clock, ShieldAlert, Download, Eye } from 'lucide-react';

const ReportCard = ({ title, description, updated, role, icon: Icon, onAction, available = true }) => (
  <Card style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <div style={{ padding: '8px', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
        <Icon size={20} color="var(--color-text-primary)" />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{role}</span>
      </div>
    </div>
    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', flex: 1 }}>{description}</p>
    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '16px', marginBottom: '16px' }}>
      Last updated: {updated}
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
      {available ? (
        <>
          <Button variant="secondary" fullWidth onClick={() => onAction('view')}>
            <Eye size={16} style={{ marginRight: '8px' }} /> View
          </Button>
          <Button variant="secondary" onClick={() => onAction('export')} title="Export">
            <Download size={16} />
          </Button>
        </>
      ) : (
        <div style={{ padding: '8px', fontSize: '13px', backgroundColor: 'var(--color-bg-main)', color: 'var(--color-text-secondary)', textAlign: 'center', width: '100%', borderRadius: 'var(--radius-sm)' }}>
          Data Unavailable
        </div>
      )}
    </div>
  </Card>
);

const Reports = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('payroll');

  const canViewReports = ['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role);

  if (!canViewReports) {
    return (
      <Card>
        <h2>Access Denied</h2>
        <p>You do not have permission to view enterprise reports.</p>
      </Card>
    );
  }

  const handleAction = (type, path) => {
    if (type === 'view' && path) {
      navigate(path);
    } else if (type === 'export') {
      addToast('Export initiated. The report will download shortly.', 'success');
    } else {
      addToast('This report view is currently under construction.', 'warning');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'payroll':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Payroll Summary" description="Overview of gross and net payroll across all departments." updated="Today, 09:00 AM" role="Finance / Admin" icon={FileText} 
              onAction={(type) => handleAction(type, '/reports/payroll')} 
            />
            <ReportCard 
              title="Department Payroll" description="Cost breakdown and comparison by internal departments." updated="Yesterday, 18:30 PM" role="HR Manager" icon={TrendingUp} 
              onAction={(type) => handleAction(type, '/reports/payroll')} 
            />
            <ReportCard 
              title="Salary Breakdown" description="Detailed line items for allowances, bonuses, and deductions." updated="Oct 15, 2024" role="HR Payroll User" icon={FileText} 
              onAction={(type) => handleAction(type, null)} 
            />
            <ReportCard 
              title="Payroll Cost Trend" description="Historical analysis of payroll growth over the last 12 months." updated="Oct 1, 2024" role="Finance / Admin" icon={TrendingUp} 
              onAction={(type) => handleAction(type, '/reports/payroll')} 
            />
          </div>
        );
      case 'attendance':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Attendance Summary" description="Daily attendance aggregated metrics and present days." updated="Today, 10:00 AM" role="HR Manager" icon={CalendarCheck} 
              onAction={(type) => handleAction(type, '/attendance')} 
            />
            <ReportCard 
              title="Overtime Report" description="Analysis of approved and unapproved overtime hours." updated="Yesterday" role="HR Payroll Manager" icon={Clock} 
              onAction={(type) => handleAction(type, null)} available={false}
            />
            <ReportCard 
              title="Attendance Exceptions" description="List of missed check-ins and late arrivals." updated="Today, 08:30 AM" role="HR Manager" icon={AlertTriangle} 
              onAction={(type) => handleAction(type, '/attendance')} 
            />
          </div>
        );
      case 'timeoff':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Leave Summary" description="Total approved, pending, and rejected time off requests." updated="Today" role="HR Manager" icon={CalendarCheck} 
              onAction={(type) => handleAction(type, '/timeoff')} 
            />
            <ReportCard 
              title="Leave Balance" description="Current accrued balances for all active employees." updated="Weekly" role="HR Manager" icon={FileText} 
              onAction={(type) => handleAction(type, null)} available={false}
            />
          </div>
        );
      case 'intelligence':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Payroll Risk Report" description="Aggregated risk scores and high-risk employee profiles." updated="Real-time" role="Auditor / Admin" icon={ShieldAlert} 
              onAction={(type) => handleAction(type, '/payroll')} 
            />
            <ReportCard 
              title="Payroll Anomaly Report" description="Detailed ledger of flagged anomalies like salary spikes." updated="Real-time" role="Auditor / Admin" icon={AlertTriangle} 
              onAction={(type) => handleAction(type, '/payroll')} 
            />
            <ReportCard 
              title="Attendance Payroll Impact" description="Financial cost estimates of unresolved attendance gaps." updated="Real-time" role="Finance" icon={TrendingUp} 
              onAction={(type) => handleAction(type, '/attendance')} 
            />
            <ReportCard 
              title="Explainable Audit Ledger" description="Historical logs of automated compliance checks on payslips." updated="Daily" role="Auditor / Admin" icon={ShieldAlert} 
              onAction={(type) => handleAction(type, null)} available={false}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px', letterSpacing: '-0.5px' }}>Enterprise Reports</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Analytics, exports, and intelligence workspaces</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-4)' }}>
        <button 
          style={{ padding: '12px 0', borderBottom: activeTab === 'payroll' ? '2px solid var(--color-btn-primary)' : '2px solid transparent', color: activeTab === 'payroll' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'payroll' ? 600 : 400, background: 'none' }}
          onClick={() => setActiveTab('payroll')}
        >
          Payroll
        </button>
        <button 
          style={{ padding: '12px 0', borderBottom: activeTab === 'attendance' ? '2px solid var(--color-btn-primary)' : '2px solid transparent', color: activeTab === 'attendance' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'attendance' ? 600 : 400, background: 'none' }}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
        <button 
          style={{ padding: '12px 0', borderBottom: activeTab === 'timeoff' ? '2px solid var(--color-btn-primary)' : '2px solid transparent', color: activeTab === 'timeoff' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'timeoff' ? 600 : 400, background: 'none' }}
          onClick={() => setActiveTab('timeoff')}
        >
          Time Off
        </button>
        <button 
          style={{ padding: '12px 0', borderBottom: activeTab === 'intelligence' ? '2px solid var(--color-btn-primary)' : '2px solid transparent', color: activeTab === 'intelligence' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'intelligence' ? 600 : 400, background: 'none' }}
          onClick={() => setActiveTab('intelligence')}
        >
          Intelligence
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default Reports;
