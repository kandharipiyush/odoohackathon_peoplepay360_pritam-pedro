import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollApi } from '../../services/payrollApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CheckCircle, Users, Calendar } from 'lucide-react';

const PayrunCreate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 Data
  const [details, setDetails] = useState({
    periodStart: '',
    periodEnd: '',
    paymentDate: '',
    salaryStructure: 'Standard',
    department: 'All'
  });

  // Step 2 Data
  const [selectedEmployees, setSelectedEmployees] = useState([
    { id: 'EMP001', name: 'Sarah Connor', dept: 'Management' },
    { id: 'EMP002', name: 'John Smith', dept: 'Human Resources' },
    { id: 'EMP003', name: 'Jane Doe', dept: 'Engineering' }
  ]);
  const [selectedIds, setSelectedIds] = useState(['EMP001', 'EMP002', 'EMP003']); // Simulating all selected

  const handleNext = (e) => {
    e.preventDefault();
    if (!details.periodStart || !details.periodEnd || !details.paymentDate) {
      alert("Please fill all required fields");
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await payrollApi.createPayrun({
        ...details,
        employeeIds: selectedIds
      });
      navigate(`/payroll/payruns/${res.data.id}`);
    } catch (err) {
      alert('Failed to create payrun');
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h1 style={{ fontSize: '24px' }}>Create Payrun</h1>
        <Button variant="secondary" onClick={() => navigate('/payroll')}>Cancel</Button>
      </div>

      {/* Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: step >= 1 ? 'var(--color-text-primary)' : 'var(--color-bg-card)', color: step >= 1 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</div>
          <span style={{ fontWeight: 500 }}>Details</span>
        </div>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)', margin: '0 16px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: step >= 2 ? 'var(--color-text-primary)' : 'var(--color-bg-card)', color: step >= 2 ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</div>
          <span style={{ fontWeight: 500 }}>Employees</span>
        </div>
      </div>

      {step === 1 && (
        <form onSubmit={handleNext}>
          <Card title="Pay Period Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div className="input-group">
                <label>Period Start Date *</label>
                <input type="date" value={details.periodStart} onChange={e => setDetails({...details, periodStart: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Period End Date *</label>
                <input type="date" value={details.periodEnd} onChange={e => setDetails({...details, periodEnd: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Payment Date *</label>
                <input type="date" value={details.paymentDate} onChange={e => setDetails({...details, paymentDate: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Salary Structure</label>
                <select value={details.salaryStructure} onChange={e => setDetails({...details, salaryStructure: e.target.value})}>
                  <option value="Standard">Standard (Monthly)</option>
                  <option value="Hourly">Hourly Rate</option>
                  <option value="Contractor">Contractor</option>
                </select>
              </div>
              <div className="input-group">
                <label>Target Department</label>
                <select value={details.department} onChange={e => setDetails({...details, department: e.target.value})}>
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR">Human Resources</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-4)' }}>
              <Button type="submit" variant="primary">Next Step: Employees</Button>
            </div>
          </Card>
        </form>
      )}

      {step === 2 && (
        <div>
          <Card style={{ marginBottom: 'var(--spacing-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
              <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> Select Employees
              </h2>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{selectedIds.length} Selected</span>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '8px', width: '40px' }}>
                    <input type="checkbox" checked={selectedIds.length === selectedEmployees.length} onChange={(e) => setSelectedIds(e.target.checked ? selectedEmployees.map(emp => emp.id) : [])} />
                  </th>
                  <th style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>ID</th>
                  <th style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>NAME</th>
                  <th style={{ padding: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>DEPARTMENT</th>
                </tr>
              </thead>
              <tbody>
                {selectedEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(emp.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, emp.id]);
                          else setSelectedIds(selectedIds.filter(id => id !== emp.id));
                        }} 
                      />
                    </td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{emp.id}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{emp.name}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{emp.dept}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving || selectedIds.length === 0}>
              {saving ? 'Creating...' : 'Create Payrun'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrunCreate;
