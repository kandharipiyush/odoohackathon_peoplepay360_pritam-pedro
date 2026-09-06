import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollApi } from '../services/payrollApi';
import { intelligenceApi } from '../services/intelligenceApi';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { FileText, Plus, Eye, Search, Play, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import PayrollRiskTable from '../components/intelligence/PayrollRiskTable';
import AnomalyAlerts from '../components/intelligence/AnomalyAlerts';

const Payroll = () => {
  const { currentUser } = useAuth();
  const normRole = (currentUser?.role || '').toString().toLowerCase().replace(/[\s_]+/g, '');
  const canManagePayroll = ['admin', 'hrmanager', 'hrpayrollmanager', 'hrpayrolluser'].includes(normRole);
  const isEmployee = normRole === 'employee';
  const [activeTab, setActiveTab] = useState(canManagePayroll ? 'payruns' : 'payslips'); // 'payruns', 'payslips', 'risk'
  
  // Payrun State
  const [payruns, setPayruns] = useState([]);
  const [loadingPayruns, setLoadingPayruns] = useState(false);
  const [payrunSearch, setPayrunSearch] = useState('');
  const navigate = useNavigate();

  // Payslip State
  const [payslips, setPayslips] = useState([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [payslipSearch, setPayslipSearch] = useState('');

  // Risk State
  const [riskData, setRiskData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loadingRisk, setLoadingRisk] = useState(false);

  useEffect(() => {
    if (activeTab === 'payruns' && canManagePayroll) {
      fetchPayruns();
    } else if (activeTab === 'payslips') {
      fetchPayslips();
    } else if (activeTab === 'risk' && canManagePayroll) {
      fetchRiskData();
    }
  }, [activeTab, canManagePayroll]);

  const fetchPayruns = async () => {
    setLoadingPayruns(true);
    try {
      const res = await payrollApi.getPayruns();
      setPayruns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayruns(false);
    }
  };

  const fetchPayslips = async () => {
    setLoadingPayslips(true);
    try {
      const params = isEmployee ? { employee_id: currentUser?.employee_id || currentUser?.id } : {};
      const res = await payrollApi.getPayslips(params);
      setPayslips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayslips(false);
    }
  };

  const fetchRiskData = async () => {
    setLoadingRisk(true);
    try {
      const [riskRes, anomalyRes] = await Promise.all([
        intelligenceApi.getAllPayrollRisks(),
        intelligenceApi.getPayrollAnomalies()
      ]);
      setRiskData(riskRes.data || []);
      setAnomalies(anomalyRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const { addToast } = useToast();

  const handleBulkEmail = async () => {
    const selected = payslips.map(p => p.id); 
    if (window.confirm(`Are you sure you want to email ${selected.length} payslips?`)) {
      await payrollApi.bulkEmailPayslips(selected);
      addToast('Payslips emailed successfully.', 'success');
    }
  };

  const getStatusColor = (status) => {
    if (['Completed', 'Paid', 'Validated'].includes(status)) return 'var(--color-status-success)';
    if (['Failed', 'High'].includes(status)) return 'var(--color-status-error)';
    if (['Draft', 'Pending', 'Processing'].includes(status)) return 'var(--color-status-warning)';
    return 'var(--color-text-secondary)';
  };

  const renderPayruns = () => {
    if (loadingPayruns) return <Loader />;
    
    const term = (payrunSearch || '').toLowerCase().trim();
    const filtered = (payruns || []).filter(p => {
      if (!term) return true;
      const start = (p.periodStart || p.period_start || '').toLowerCase();
      const end = (p.periodEnd || p.period_end || '').toLowerCase();
      const status = (p.status || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const idStr = String(p.id || '');
      return start.includes(term) || end.includes(term) || status.includes(term) || name.includes(term) || idStr.includes(term);
    });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input type="text" placeholder="Search by date or status..." value={payrunSearch} onChange={(e) => setPayrunSearch(e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
          </div>
          {canManagePayroll && (
            <Button variant="primary" onClick={() => navigate('/payroll/payruns/create')}>
              <Plus size={16} style={{ marginRight: '8px' }} /> Create Payrun
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <Card><EmptyState icon={FileText} title="No Payruns Found" /></Card>
        ) : (
          <Card style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>PERIOD</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEES</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>GROSS</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>NET</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const gross = parseFloat(p.grossTotal ?? p.total_gross ?? 0);
                  const net = parseFloat(p.netTotal ?? p.total_net ?? 0);
                  const start = p.periodStart || p.period_start || '2026-09-01';
                  const end = p.periodEnd || p.period_end || '2026-09-30';
                  const empCount = p.employeeCount ?? p.total_payslips ?? 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>PR-{String(p.id || 1).padStart(4, '0')}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{start} to {end}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{empCount}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>${gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', backgroundColor: getStatusColor(p.status) + '20', color: getStatusColor(p.status) }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button variant="secondary" onClick={() => navigate(`/payroll/payruns/${p.id}`)} style={{ padding: '4px 8px' }}>
                          <Eye size={16} />
                        </Button>
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

  const renderPayslips = () => {
    if (loadingPayslips) return <Loader />;
    
    const term = (payslipSearch || '').toLowerCase().trim();
    const filtered = (payslips || []).filter(p => {
      if (!term) return true;
      const empName = (p.employeeName || p.employee_name || '').toLowerCase();
      const num = (p.payslipNumber || `PS-${p.id}` || '').toLowerCase();
      return empName.includes(term) || num.includes(term);
    });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input type="text" placeholder="Search by name or number..." value={payslipSearch} onChange={(e) => setPayslipSearch(e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
          </div>
          {canManagePayroll && filtered.length > 0 && (
            <Button variant="secondary" onClick={handleBulkEmail}>Email All</Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <Card><EmptyState icon={FileText} title="No Payslips Found" /></Card>
        ) : (
          <Card style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>NUMBER</th>
                  {canManagePayroll && <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEE</th>}
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>PERIOD</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>GROSS</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>NET</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const gross = parseFloat(p.grossSalary ?? p.gross_amount ?? 0);
                  const net = parseFloat(p.netSalary ?? p.net_amount ?? 0);
                  const start = p.periodStart || p.period_start || '2026-09-01';
                  const end = p.periodEnd || p.period_end || '2026-09-30';
                  const status = p.paymentStatus || p.status || 'Draft';
                  const pNum = p.payslipNumber || `PS-${String(p.id).padStart(5, '0')}`;
                  const empName = p.employeeName || p.employee_name || 'Employee';
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{pNum}</td>
                      {canManagePayroll && <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{empName}</td>}
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>{start} to {end}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>${gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', backgroundColor: getStatusColor(status) + '20', color: getStatusColor(status) }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button variant="secondary" onClick={() => navigate(`/payroll/payslips/${p.id}`)} style={{ padding: '4px 8px' }}>
                          <Eye size={16} />
                        </Button>
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

  const renderRisk = () => {
    if (loadingRisk) return <Loader />;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--spacing-3)', alignItems: 'start' }}>
        <div>
          <PayrollRiskTable risks={riskData} onRefresh={fetchRiskData} />
        </div>
        <div>
          <AnomalyAlerts anomalies={anomalies} onRefresh={fetchRiskData} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: 'var(--spacing-3)' }}>
        {canManagePayroll ? 'Payroll Management' : 'My Payslips'}
      </h1>
      
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-3)' }}>
        {canManagePayroll && (
          <button 
            style={{ padding: '12px 24px', background: 'none', borderBottom: activeTab === 'payruns' ? '2px solid var(--color-btn-primary)' : '2px solid transparent', color: activeTab === 'payruns' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'payruns' ? 600 : 400 }}
            onClick={() => setActiveTab('payruns')}
          >
            Payruns
          </button>
        )}
        <button 
          style={{ padding: '12px 24px', background: 'none', borderBottom: activeTab === 'payslips' ? '2px solid var(--color-btn-primary)' : '2px solid transparent', color: activeTab === 'payslips' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'payslips' ? 600 : 400 }}
          onClick={() => setActiveTab('payslips')}
        >
          Payslips
        </button>
        {canManagePayroll && (
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'none', borderBottom: activeTab === 'risk' ? '2px solid var(--color-btn-primary)' : '2px solid transparent', color: activeTab === 'risk' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: activeTab === 'risk' ? 600 : 400 }}
            onClick={() => setActiveTab('risk')}
          >
            <ShieldAlert size={16} /> Risk & Anomalies
          </button>
        )}
      </div>

      {activeTab === 'payruns' && renderPayruns()}
      {activeTab === 'payslips' && renderPayslips()}
      {activeTab === 'risk' && renderRisk()}
    </div>
  );
};

export default Payroll;
