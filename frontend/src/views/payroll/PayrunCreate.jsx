import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollApi } from '../../services/payrollApi';
import { employeeApi } from '../../services/employeeApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { Users, Calendar, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PayrunCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState('');

  // Default dates to current month
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const defaultStart = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const defaultEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  // Step 1 Data
  const [details, setDetails] = useState({
    name: `Payrun - ${year}-${month}`,
    periodStart: defaultStart,
    periodEnd: defaultEnd,
    paymentDate: defaultEnd,
    salaryStructure: 'Standard',
    department: 'All'
  });

  // Step 2 Data
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await employeeApi.getEmployees();
      const list = res.data || [];
      const activeList = list.filter(e => e.status === 'Active');
      setAllEmployees(activeList);
      setSelectedIds(activeList.map(e => e.id));
    } catch (err) {
      console.error('Failed to load employees for payrun:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError('');

    if (!details.periodStart || !details.periodEnd || !details.paymentDate) {
      setError("Please fill out all required date fields.");
      return;
    }

    if (new Date(details.periodEnd) < new Date(details.periodStart)) {
      setError("Period end date cannot be earlier than period start date.");
      return;
    }

    setStep(2);
  };

  const filteredEmployees = allEmployees.filter(emp => {
    if (details.department === 'All') return true;
    return emp.department === details.department;
  });

  const handleCreate = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: details.name || `Payrun - ${details.periodStart} to ${details.periodEnd}`,
        period_start: details.periodStart,
        period_end: details.periodEnd,
        periodStart: details.periodStart,
        periodEnd: details.periodEnd,
        structure_id: 1,
      };

      const res = await payrollApi.createPayrun(payload);
      const payrunId = res.data?.id;

      if (!payrunId) {
        throw new Error('Payrun created but ID was not returned.');
      }

      // Automatically compute the newly created payrun
      try {
        await payrollApi.processPayrun(payrunId);
      } catch (compErr) {
        console.warn('Payrun created in Draft, calculation will be triggered in details page:', compErr);
      }

      navigate(`/payroll/payruns/${payrunId}`);
    } catch (err) {
      console.error('Payrun create error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to create payrun';
      setError(msg);
      alert(`Error creating payrun: ${msg}`);
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Create Payrun Cycle</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Set up payroll period and compute wages for active staff
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/payroll')}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Cancel
        </Button>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--color-status-error)', 
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-4)', backgroundColor: 'var(--color-bg-card)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? 'var(--color-brand)' : 'var(--color-text-secondary)' }}>
          <div style={{ 
            width: '26px', height: '26px', borderRadius: '50%', 
            backgroundColor: step >= 1 ? 'var(--color-brand)' : 'var(--color-bg-main)', 
            color: step >= 1 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 
          }}>
            1
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Pay Period Details</span>
        </div>
        
        <div style={{ flex: 1, height: '2px', backgroundColor: step >= 2 ? 'var(--color-brand)' : 'var(--color-border)', margin: '0 20px' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? 'var(--color-brand)' : 'var(--color-text-secondary)' }}>
          <div style={{ 
            width: '26px', height: '26px', borderRadius: '50%', 
            backgroundColor: step >= 2 ? 'var(--color-brand)' : 'var(--color-bg-main)', 
            color: step >= 2 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600 
          }}>
            2
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Included Employees</span>
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handleNext}>
          <Card title="Pay Period Configuration">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Payrun Batch Name *</label>
                <input 
                  type="text" 
                  value={details.name} 
                  onChange={e => setDetails({...details, name: e.target.value})} 
                  placeholder="e.g. Regular Monthly Payrun - September 2026"
                  required 
                />
              </div>
              <div className="input-group">
                <label>Period Start Date *</label>
                <input type="date" value={details.periodStart} onChange={e => setDetails({...details, periodStart: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Period End Date *</label>
                <input type="date" value={details.periodEnd} onChange={e => setDetails({...details, periodEnd: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Payment / Disbursement Date *</label>
                <input type="date" value={details.paymentDate} onChange={e => setDetails({...details, paymentDate: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Salary Structure</label>
                <select value={details.salaryStructure} onChange={e => setDetails({...details, salaryStructure: e.target.value})}>
                  <option value="Standard">Standard Corporate Salary Structure</option>
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Target Department Scope</label>
                <select value={details.department} onChange={e => setDetails({...details, department: e.target.value})}>
                  <option value="All">All Departments (Entire Organization)</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Management">Management</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Sales">Sales</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
              <Button type="submit" variant="primary">
                Next: Select Employees ({filteredEmployees.length} Eligible)
              </Button>
            </div>
          </Card>
        </form>
      )}

      {step === 2 && (
        <div>
          <Card style={{ marginBottom: 'var(--spacing-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
              <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--color-brand)" /> Eligible Active Employees
              </h2>
              <span style={{ fontSize: '13px', backgroundColor: 'var(--color-bg-main)', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                {selectedIds.length} of {filteredEmployees.length} Selected
              </span>
            </div>
            
            {loadingEmployees ? (
              <Loader />
            ) : filteredEmployees.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No active employees found in selected department scope.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                    <th style={{ padding: '10px 12px', width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0} 
                        onChange={(e) => setSelectedIds(e.target.checked ? filteredEmployees.map(emp => emp.id) : [])} 
                      />
                    </th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>ID</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>EMPLOYEE NAME</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>POSITION</th>
                    <th style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>DEPARTMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(emp.id)} 
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, emp.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== emp.id));
                          }} 
                        />
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 500 }}>{emp.employeeId || `EMP-${emp.id}`}</td>
                      <td style={{ padding: '10px 12px', fontSize: '14px', fontWeight: 500 }}>{emp.firstName} {emp.lastName}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{emp.position}</td>
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>{emp.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="secondary" onClick={() => setStep(1)} disabled={saving}>
              Back to Details
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreate} 
              disabled={saving || selectedIds.length === 0}
              style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
            >
              {saving ? 'Creating & Computing Payrun...' : `Run Payroll Calculations (${selectedIds.length} Staff)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrunCreate;
