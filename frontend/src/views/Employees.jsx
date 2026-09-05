import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeApi } from '../services/employeeApi';
import { Search, Filter, Plus, List as ListIcon, Grid, User, Trash2, Edit2, Eye } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const Employees = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const canManageEmployees = ['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getEmployees();
      setEmployees(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        await employeeApi.deactivateEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert('Failed to deactivate employee.');
      }
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment ? emp.department === filterDepartment : true;
    return matchesSearch && matchesDept;
  });

  const getStatusColor = (status) => {
    if (status === 'Active') return 'var(--color-status-success)';
    return 'var(--color-text-secondary)';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Employee Hub</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Manage and view employee directory ({filteredEmployees.length} total)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ padding: '8px', background: viewMode === 'list' ? 'var(--color-border)' : 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{ padding: '8px', background: viewMode === 'kanban' ? 'var(--color-border)' : 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}
            >
              <Grid size={18} />
            </button>
          </div>
          {canManageEmployees && (
            <Button variant="primary" onClick={() => navigate('/employees/new')}>
              <Plus size={16} style={{ marginRight: '8px' }} />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">All Departments</option>
              <option value="Management">Management</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Engineering">Engineering</option>
            </select>
          </div>
          {(searchTerm || filterDepartment) && (
            <Button variant="secondary" onClick={() => { setSearchTerm(''); setFilterDepartment(''); }}>
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {error ? (
        <div style={{ color: 'var(--color-status-error)', padding: 'var(--spacing-3)', textAlign: 'center' }}>
          {error}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card>
          <EmptyState title="No Employees Found" description="Try adjusting your filters or add a new employee." />
        </Card>
      ) : viewMode === 'list' ? (
        <Card style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>EMPLOYEE</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DEPARTMENT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{emp.employeeId}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{emp.firstName} {emp.lastName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{emp.position}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>{emp.department}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: getStatusColor(emp.status) + '20', 
                      color: getStatusColor(emp.status) 
                    }}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/employees/${emp.id}`)} style={{ background: 'none', color: 'var(--color-text-secondary)' }}><Eye size={16} /></button>
                      {canManageEmployees && (
                        <>
                          <button onClick={() => navigate(`/employees/${emp.id}/edit`)} style={{ background: 'none', color: 'var(--color-text-secondary)' }}><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(emp.id)} style={{ background: 'none', color: 'var(--color-status-error)' }}><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-3)' }}>
          {filteredEmployees.map(emp => (
            <Card key={emp.id} style={{ cursor: 'pointer', transition: 'box-shadow 0.2s', ':hover': { boxShadow: 'var(--shadow-md)' } }} onClick={() => navigate(`/employees/${emp.id}`)}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={24} color="var(--color-text-secondary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', margin: 0 }}>{emp.firstName} {emp.lastName}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{emp.employeeId}</p>
                </div>
              </div>
              <div style={{ marginBottom: 'var(--spacing-2)', fontSize: '14px' }}>
                <p><strong>Position:</strong> {emp.position}</p>
                <p><strong>Department:</strong> {emp.department}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-2)' }}>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: getStatusColor(emp.status) + '20', color: getStatusColor(emp.status) }}>
                  {emp.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Employees;
