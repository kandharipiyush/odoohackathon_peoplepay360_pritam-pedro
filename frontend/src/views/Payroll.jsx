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
  const canManagePayroll = ['Admin', 'HR Payroll Manager', 'HR Payroll User'].includes(currentUser?.role);
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
      const params = currentUser.role === 'Employee' ? { employeeId: currentUser.id } : {};
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
        intelligenceApi.getPayrollRisk(currentUser?.employee_id || currentUser?.id || 1), // getting current user risk profile
        intelligenceApi.getPayrollAnomalies()
      ]);
      setRiskData([riskRes.data]); // Wrap in array for the table component
      setAnomalies(anomalyRes.data);
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
    
    const filtered = payruns.filter(p => p.periodStart.includes(payrunSearch) || p.status.toLowerCase().includes(payrunSearch.toLowerCase()));

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
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>PR-{p.id.toString().padStart(4, '0')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.periodStart} to {p.periodEnd}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.employeeCount}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>${p.grossTotal.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>${p.netTotal.toLocaleString()}</td>
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
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    );
  };

  const renderPayslips = () => {
    if (loadingPayslips) return <Loader />;
    
    const filtered = payslips.filter(p => p.employeeName?.toLowerCase().includes(payslipSearch.toLowerCase()) || p.payslipNumber.includes(payslipSearch));

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
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.payslipNumber}</td>
                    {canManagePayroll && <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.employeeName} ({p.employeeId})</td>}
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{p.periodStart} to {p.periodEnd}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>${p.grossSalary.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600 }}>${p.netSalary.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', backgroundColor: getStatusColor(p.paymentStatus) + '20', color: getStatusColor(p.paymentStatus) }}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Button variant="secondary" onClick={() => navigate(`/payroll/payslips/${p.id}`)} style={{ padding: '4px 8px' }}>
                        <Eye size={16} />
                      </Button>
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

  const renderRisk = () => {
    if (loadingRisk) return <Loader />;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-3)', alignItems: 'start' }}>
        <div>
          <PayrollRiskTable risks={riskData} />
        </div>
        <div>
          <AnomalyAlerts anomalies={anomalies} />
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
