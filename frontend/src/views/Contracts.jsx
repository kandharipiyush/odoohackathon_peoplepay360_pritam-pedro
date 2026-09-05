import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { contractApi } from '../services/contractApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { Plus, Search, FileText, Eye, Edit2 } from 'lucide-react';

const Contracts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdFilter = searchParams.get('employeeId');
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const canManage = ['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        let res;
        if (employeeIdFilter) {
          res = await contractApi.getEmployeeContracts(employeeIdFilter);
        } else {
          res = await contractApi.getContracts();
        }
        setContracts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [employeeIdFilter]);

  const clearEmployeeFilter = () => {
    searchParams.delete('employeeId');
    setSearchParams(searchParams);
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    if (status === 'ACTIVE') return 'var(--color-status-success)';
    if (status === 'FUTURE') return 'var(--color-status-warning)';
    if (status === 'EXPIRED') return 'var(--color-status-error)';
    return 'var(--color-text-secondary)';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Contracts</h1>
          {employeeIdFilter ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Filtered by Employee ID: {employeeIdFilter}</p>
              <button onClick={clearEmployeeFilter} style={{ fontSize: '12px', color: 'var(--color-status-error)', background: 'none' }}>Clear Filter</button>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Manage employee contracts ({filteredContracts.length})</p>
          )}
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => navigate('/contracts/new')}>
            <Plus size={16} style={{ marginRight: '8px' }} /> Add Contract
          </Button>
        )}
      </div>

      <Card style={{ marginBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          <div style={{ flex: '1', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search contract type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="FUTURE">Future</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </Card>

      {filteredContracts.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No Contracts Found" description="Try adjusting filters or create a new contract." />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMP ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>TYPE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DATES</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>SALARY</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{c.employeeId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{c.type} <br/><span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{c.schedule}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{c.startDate} to {c.endDate || 'Present'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>${c.salary.toLocaleString()} / yr</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 500,
                      backgroundColor: getStatusColor(c.status) + '20', 
                      color: getStatusColor(c.status) 
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/contracts/${c.id}`)} style={{ background: 'none', color: 'var(--color-text-secondary)' }}><Eye size={16} /></button>
                      {canManage && (
                        <button onClick={() => navigate(`/contracts/${c.id}/edit`)} style={{ background: 'none', color: 'var(--color-text-secondary)' }}><Edit2 size={16} /></button>
                      )}
                    </div>
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

export default Contracts;
