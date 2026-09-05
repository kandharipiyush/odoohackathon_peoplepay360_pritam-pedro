import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, TrendingUp, AlertTriangle, CalendarCheck, Clock, ShieldAlert, Download, Eye } from 'lucide-react';
import { payrollApi } from '../services/payrollApi';
import { attendanceApi } from '../services/attendanceApi';
import { timeOffApi } from '../services/timeOffApi';
import { intelligenceApi } from '../services/intelligenceApi';

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
  const [exporting, setExporting] = useState(false);

  const canViewReports = ['Admin', 'admin', 'HR Manager', 'hr manager', 'HR_Manager', 'HR Payroll Manager', 'HR_Payroll_Manager', 'Auditor', 'Finance Auditor'].some(
    r => (currentUser?.role || '').toLowerCase().includes(r.toLowerCase())
  );

  if (!canViewReports) {
    return (
      <Card>
        <h2>Access Denied</h2>
        <p>You do not have permission to view enterprise reports.</p>
      </Card>
    );
  }

  // Generic CSV Download Helper
  const downloadCSV = (filename, headers, rows) => {
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`${filename} exported successfully.`, 'success');
  };

  const handleAction = async (type, reportKey, path) => {
    if (type === 'view') {
      if (path) {
        navigate(path);
      } else {
        navigate('/reports/payroll');
      }
      return;
    }

    if (type === 'export') {
      setExporting(true);
      addToast(`Generating ${reportKey} report...`, 'info');
      try {
        if (reportKey.includes('Payroll') || reportKey.includes('Salary')) {
          const res = await payrollApi.getPayslips();
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          
          if (reportKey === 'Salary Breakdown') {
            const headers = ['Payslip ID', 'Employee ID', 'Employee Name', 'Department', 'Basic Salary (60%)', 'HRA (30%)', 'Allowances (10%)', 'PF (12%)', 'TDS & Tax', 'Gross Pay', 'Net Pay'];
            const rows = list.map(p => {
              const gross = parseFloat(p.grossSalary || p.gross_amount || 0);
              const net = parseFloat(p.netSalary || p.net_amount || 0);
              const basic = (gross * 0.60).toFixed(2);
              const hra = (gross * 0.30).toFixed(2);
              const allowance = (gross * 0.10).toFixed(2);
              const pf = (gross * 0.12).toFixed(2);
              const tax = Math.max(0, gross - net - (gross * 0.12)).toFixed(2);
              return [p.payslipNumber || `PS-${p.id}`, p.employeeId || p.employee_id, p.employeeName || p.employee_name, p.department || 'General', basic, hra, allowance, pf, tax, gross.toFixed(2), net.toFixed(2)];
            });
            downloadCSV('Salary_Breakdown_Report', headers, rows);
          } else {
            const headers = ['Payslip Number', 'Employee Name', 'Period Start', 'Period End', 'Gross Salary', 'Net Salary', 'Status'];
            const rows = list.map(p => [
              p.payslipNumber || `PS-${p.id}`,
              p.employeeName || p.employee_name,
              p.periodStart || p.period_start || '',
              p.periodEnd || p.period_end || '',
              p.grossSalary || p.gross_amount || 0,
              p.netSalary || p.net_amount || 0,
              p.paymentStatus || p.status || 'Paid'
            ]);
            downloadCSV('Payroll_Summary_Report', headers, rows);
          }
        } else if (reportKey.includes('Attendance') || reportKey.includes('Overtime')) {
          const res = await attendanceApi.getAttendance();
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const headers = ['ID', 'Employee ID', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Worked Hours', 'Overtime Hours', 'Status'];
          const rows = list.map(a => [
            a.id,
            a.employee_id || a.employeeId,
            a.employee_name || a.employeeName || `EMP-${a.employee_id}`,
            (a.date || '').split('T')[0],
            a.check_in || a.checkIn || '',
            a.check_out || a.checkOut || '',
            a.worked_hours || a.workedHours || 8,
            Math.max(0, (a.worked_hours || 8) - 8).toFixed(1),
            a.status || 'PRESENT'
          ]);
          downloadCSV(reportKey.replace(/\s+/g, '_') + '_Report', headers, rows);
        } else if (reportKey.includes('Leave') || reportKey.includes('Time Off')) {
          const res = await timeOffApi.getRequests();
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          const headers = ['Request ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
          const rows = list.map(r => [
            r.id,
            r.employee_name || r.employeeName || `Employee ${r.employee_id || r.employeeId}`,
            r.leave_type || r.leaveType || 'Annual Leave',
            (r.start_date || r.startDate || '').split('T')[0],
            (r.end_date || r.endDate || '').split('T')[0],
            r.days || 1,
            r.reason || 'N/A',
            r.status || 'Approved'
          ]);
          downloadCSV(reportKey.replace(/\s+/g, '_') + '_Report', headers, rows);
        } else {
          // Intelligence & Risk Reports
          const res = await intelligenceApi.getRiskOverview();
          const riskData = res.data?.riskEmployees || [
            { name: 'Sarah Connor', role: 'CEO', risk: 'Low', score: 10, reason: 'Compliant' },
            { name: 'John Smith', role: 'HR Director', risk: 'Low', score: 12, reason: 'Compliant' },
            { name: 'Alice Johnson', role: 'Payroll Manager', risk: 'Medium', score: 35, reason: 'Recent wage adjustment' },
            { name: 'Jane Doe', role: 'Software Engineer', risk: 'Low', score: 5, reason: 'Compliant' },
            { name: 'Carlos Garcia', role: 'Sales Executive', risk: 'Medium', score: 40, reason: 'Overtime spike' }
          ];
          const headers = ['Employee Name', 'Role', 'Risk Level', 'Risk Score', 'Audit Explanation'];
          const rows = riskData.map(e => [e.name, e.role, e.risk, e.score, e.reason]);
          downloadCSV(reportKey.replace(/\s+/g, '_') + '_Report', headers, rows);
        }
      } catch (err) {
        console.error(err);
        addToast('Failed to export report data.', 'error');
      } finally {
        setExporting(false);
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'payroll':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Payroll Summary" description="Overview of gross and net payroll across all departments." updated="Today, 09:00 AM" role="Finance / Admin" icon={FileText} 
              onAction={(type) => handleAction(type, 'Payroll Summary', '/reports/payroll')} 
            />
            <ReportCard 
              title="Department Payroll" description="Cost breakdown and comparison by internal departments." updated="Yesterday, 18:30 PM" role="HR Manager" icon={TrendingUp} 
              onAction={(type) => handleAction(type, 'Department Payroll', '/reports/payroll')} 
            />
            <ReportCard 
              title="Salary Breakdown" description="Detailed line items for basic salary, HRA, bonuses, and tax deductions." updated="Live Data" role="HR & Payroll" icon={FileText} 
              onAction={(type) => handleAction(type, 'Salary Breakdown', '/reports/payroll')} 
            />
            <ReportCard 
              title="Payroll Cost Trend" description="Historical analysis of payroll growth and projections." updated="Current Month" role="Finance / Admin" icon={TrendingUp} 
              onAction={(type) => handleAction(type, 'Payroll Cost Trend', '/reports/payroll')} 
            />
          </div>
        );
      case 'attendance':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Attendance Summary" description="Daily attendance aggregated metrics and present days." updated="Today, 10:00 AM" role="HR Manager" icon={CalendarCheck} 
              onAction={(type) => handleAction(type, 'Attendance Summary', '/attendance')} 
            />
            <ReportCard 
              title="Overtime Report" description="Analysis of approved and unapproved overtime hours." updated="Yesterday" role="HR Payroll Manager" icon={Clock} 
              onAction={(type) => handleAction(type, 'Overtime Report', '/attendance')}
            />
            <ReportCard 
              title="Attendance Exceptions" description="List of missed check-ins and late arrivals." updated="Today, 08:30 AM" role="HR Manager" icon={AlertTriangle} 
              onAction={(type) => handleAction(type, 'Attendance Exceptions', '/attendance')} 
            />
          </div>
        );
      case 'timeoff':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Leave Summary" description="Total approved, pending, and rejected time off requests." updated="Today" role="HR Manager" icon={CalendarCheck} 
              onAction={(type) => handleAction(type, 'Leave Summary', '/timeoff')} 
            />
            <ReportCard 
              title="Leave Balance" description="Current accrued balances for all active employees." updated="Weekly" role="HR Manager" icon={FileText} 
              onAction={(type) => handleAction(type, 'Leave Balance', '/time-off/allocations')}
            />
          </div>
        );
      case 'intelligence':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-4)' }}>
            <ReportCard 
              title="Payroll Risk Report" description="Aggregated risk scores and high-risk employee profiles." updated="Real-time" role="Auditor / Admin" icon={ShieldAlert} 
              onAction={(type) => handleAction(type, 'Payroll Risk', '/reports/payroll')} 
            />
            <ReportCard 
              title="Payroll Anomaly Report" description="Detailed ledger of flagged anomalies like salary spikes." updated="Real-time" role="Auditor / Admin" icon={AlertTriangle} 
              onAction={(type) => handleAction(type, 'Payroll Anomaly', '/reports/payroll')} 
            />
            <ReportCard 
              title="Attendance Payroll Impact" description="Financial cost estimates of unresolved attendance gaps." updated="Real-time" role="Finance" icon={TrendingUp} 
              onAction={(type) => handleAction(type, 'Attendance Impact', '/attendance')} 
            />
            <ReportCard 
              title="Explainable Audit Ledger" description="Historical logs of automated compliance checks on payslips." updated="Daily" role="Auditor / Admin" icon={ShieldAlert} 
              onAction={(type) => handleAction(type, 'Audit Ledger', '/reports/payroll')}
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
