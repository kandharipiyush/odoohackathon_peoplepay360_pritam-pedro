import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { employeeApi } from '../services/employeeApi';
import { 
  Search, Filter, Plus, List as ListIcon, Grid, User, Trash2, Edit2, 
  Eye, UserCheck, UserX, Clock, ShieldAlert, Check, X, Briefcase, Building2, DollarSign, Calendar
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import EmployeeProfile from './EmployeeProfile';

const STANDARD_POSITIONS = [
  'Software Developer',
  'Software Development Engineer (SDE)',
  'Senior Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'QA Automation Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Data Analyst',
  'HR Specialist',
  'Sales Executive',
  'Financial Analyst'
];

const DEPARTMENTS = [
  'Engineering',
  'Product & Design',
  'Sales & Marketing',
  'Human Resources',
  'Finance & Accounting',
  'Operations',
  'Management'
];

const Employees = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // For regular Employees, show their own profile directly instead of directory
  if (currentUser?.role === 'Employee') {
    return <EmployeeProfile />;
  }

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending'
  const [employees, setEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  // Approval Modal State
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    position: 'Software Developer',
    customPosition: '',
    department: 'Engineering',
    managerId: '',
    role: 'Employee',
    wage: 75000,
    allocatedDays: 20
  });

  const canManageEmployees = ['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role);
  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [activeRes, pendingRes] = await Promise.all([
        employeeApi.getEmployees(),
        employeeApi.getPendingEmployees().catch(() => ({ data: [] }))
      ]);
      setEmployees(activeRes.data || []);
      setPendingEmployees(pendingRes.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load employee directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApprovalModal = (applicant) => {
    setSelectedApplicant(applicant);
    const existingPosition = applicant.preferred_position || applicant.position || 'Software Developer';
    const isStandard = STANDARD_POSITIONS.includes(existingPosition);

    setApprovalForm({
      position: isStandard ? existingPosition : 'Other',
      customPosition: isStandard ? '' : existingPosition,
      department: applicant.department || 'Engineering',
      managerId: '',
      role: 'Employee',
      wage: 75000,
      allocatedDays: 20
    });
    setApprovalModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApplicant) return;

    const finalPosition = approvalForm.position === 'Other' 
      ? approvalForm.customPosition || 'Software Developer' 
      : approvalForm.position;

    try {
      setApproving(true);
      await employeeApi.approveEmployee(selectedApplicant.id, {
        position: finalPosition,
        department: approvalForm.department,
        managerId: approvalForm.managerId || null,
        role: approvalForm.role,
        wage: approvalForm.wage,
        allocatedDays: approvalForm.allocatedDays
      });

      setActionSuccess(`Applicant ${selectedApplicant.firstName} ${selectedApplicant.lastName} approved as ${finalPosition}!`);
      setTimeout(() => setActionSuccess(''), 4000);
      setApprovalModalOpen(false);
      setSelectedApplicant(null);
      await loadAllData();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to approve employee.');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectApplicant = async (applicant) => {
    if (window.confirm(`Decline registration request for ${applicant.firstName} ${applicant.lastName}?`)) {
      try {
        await employeeApi.rejectEmployee(applicant.id);
        setActionSuccess(`Registration request for ${applicant.firstName} was declined.`);
        setTimeout(() => setActionSuccess(''), 4000);
        await loadAllData();
      } catch (err) {
        alert('Failed to decline registration.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        await employeeApi.deactivateEmployee(id);
        loadAllData();
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

  const filteredPending = pendingEmployees.filter(emp => {
    const matchesSearch = (emp.firstName + ' ' + emp.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = filterDepartment ? emp.department === filterDepartment : true;
    return matchesSearch && matchesDept;
  });

  const getStatusColor = (status) => {
    if (status === 'Active') return 'var(--color-status-success)';
    if (status === 'Pending Approval') return '#EAB308';
    return 'var(--color-text-secondary)';
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Employee Management Hub</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Manage employee directory and review incoming applicant registrations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {activeTab === 'active' && (
            <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <button 
                onClick={() => setViewMode('list')}
                style={{ padding: '8px', background: viewMode === 'list' ? 'var(--color-border)' : 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: 'none', cursor: 'pointer' }}
                title="List View"
              >
                <ListIcon size={18} />
              </button>
              <button 
                onClick={() => setViewMode('kanban')}
                style={{ padding: '8px', background: viewMode === 'kanban' ? 'var(--color-border)' : 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: 'none', cursor: 'pointer' }}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
            </div>
          )}
          {canManageEmployees && (
            <Button variant="primary" onClick={() => navigate('/employees/new')}>
              <Plus size={16} style={{ marginRight: '8px' }} />
              Add Employee Direct
            </Button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div style={{ 
          backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: 'var(--color-status-success)', 
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={18} /> {actionSuccess}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-3)' }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '2px solid var(--color-brand)' : '2px solid transparent',
            color: activeTab === 'active' ? 'var(--color-brand)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'active' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Active Employees Directory</span>
          <span style={{ 
            backgroundColor: activeTab === 'active' ? 'var(--color-brand)' : 'var(--color-bg-main)', 
            color: activeTab === 'active' ? '#fff' : 'var(--color-text-secondary)', 
            fontSize: '11px', 
            padding: '2px 7px', 
            borderRadius: '10px' 
          }}>
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #EAB308' : '2px solid transparent',
            color: activeTab === 'pending' ? '#CA8A04' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'pending' ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={15} />
          <span>Pending HR Approvals</span>
          {pendingEmployees.length > 0 && (
            <span style={{ 
              backgroundColor: '#FEF08A', 
              color: '#854D0E', 
              fontSize: '11px', 
              fontWeight: 700,
              padding: '2px 8px', 
              borderRadius: '10px' 
            }}>
              {pendingEmployees.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter bar */}
      <Card style={{ marginBottom: 'var(--spacing-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" 
              placeholder={activeTab === 'active' ? "Search by name or ID..." : "Search applicant name or email..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <div style={{ minWidth: '160px' }}>
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
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
      ) : activeTab === 'pending' ? (
        /* PENDING HR APPROVALS VIEW */
        <div>
          {filteredPending.length === 0 ? (
            <Card>
              <EmptyState 
                title="No Pending Registrations" 
                description="All applicant requests have been reviewed and approved." 
              />
            </Card>
          ) : (
            <Card style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>APPLICANT</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>REQUESTED ROLE</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>DEPARTMENT</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>STATUS</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'right' }}>HR ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map(applicant => (
                    <tr key={applicant.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CA8A04' }}>
                            <User size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{applicant.firstName} {applicant.lastName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{applicant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                        <span style={{ fontWeight: 500, color: 'var(--color-brand)' }}>
                          {applicant.preferred_position || applicant.position || 'Software Developer'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px' }}>{applicant.department || 'Engineering'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          backgroundColor: '#FEF08A', 
                          color: '#854D0E',
                          fontWeight: 600
                        }}>
                          Pending HR Approval
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Button 
                            variant="primary" 
                            size="small"
                            style={{ backgroundColor: '#16A34A', borderColor: '#16A34A', fontSize: '12px', padding: '6px 12px' }}
                            onClick={() => handleOpenApprovalModal(applicant)}
                          >
                            <UserCheck size={14} style={{ marginRight: '4px' }} />
                            Review & Assign Role
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="small"
                            style={{ color: 'var(--color-status-error)', borderColor: '#FCA5A5', fontSize: '12px', padding: '6px 10px' }}
                            onClick={() => handleRejectApplicant(applicant)}
                          >
                            <UserX size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      ) : (
        /* ACTIVE EMPLOYEES DIRECTORY */
        filteredEmployees.length === 0 ? (
          <Card>
            <EmptyState title="No Active Employees Found" description="Try adjusting your search criteria or add a new employee." />
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
                        color: getStatusColor(emp.status),
                        fontWeight: 500
                      }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => navigate(`/employees/${emp.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title="View Profile"><Eye size={16} /></button>
                        {canManageEmployees && (
                          <>
                            <button onClick={() => navigate(`/employees/${emp.id}/edit`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(emp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-error)' }} title="Deactivate"><Trash2 size={16} /></button>
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
              <Card key={emp.id} style={{ cursor: 'pointer', transition: 'box-shadow 0.2s' }} onClick={() => navigate(`/employees/${emp.id}`)}>
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
        )
      )}

      {/* HR ROLE ASSIGNMENT & APPROVAL MODAL */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => { setApprovalModalOpen(false); setSelectedApplicant(null); }}
        title="Review Applicant & Assign Official Role"
      >
        {selectedApplicant && (
          <form onSubmit={handleApproveSubmit}>
            {/* Applicant Summary */}
            <div style={{ backgroundColor: 'var(--color-bg-main)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ fontSize: '15px' }}>{selectedApplicant.firstName} {selectedApplicant.lastName}</strong>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{selectedApplicant.email}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Requested Preference: <strong style={{ color: 'var(--color-brand)' }}>{selectedApplicant.preferred_position || selectedApplicant.position}</strong>
              </div>
            </div>

            {/* Official Position Assignment */}
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Briefcase size={14} color="var(--color-brand)" />
                Official Assigned Job Position *
              </label>
              <select 
                value={approvalForm.position} 
                onChange={(e) => setApprovalForm({ ...approvalForm, position: e.target.value })}
                required
              >
                {STANDARD_POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
                <option value="Other">Custom / Other Position...</option>
              </select>
            </div>

            {approvalForm.position === 'Other' && (
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <label>Specify Custom Job Position *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior Cloud Architect" 
                  value={approvalForm.customPosition}
                  onChange={(e) => setApprovalForm({ ...approvalForm, customPosition: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Department */}
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} color="var(--color-brand)" />
                Assigned Department *
              </label>
              <select 
                value={approvalForm.department} 
                onChange={(e) => setApprovalForm({ ...approvalForm, department: e.target.value })}
                required
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Reporting Manager */}
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label>Reporting Manager (Optional)</label>
              <select 
                value={approvalForm.managerId} 
                onChange={(e) => setApprovalForm({ ...approvalForm, managerId: e.target.value })}
              >
                <option value="">No Direct Manager Assigned</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.position} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Starting Wage & Leave */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={14} color="var(--color-brand)" /> Starting Annual Wage
                </label>
                <input 
                  type="number" 
                  value={approvalForm.wage} 
                  onChange={(e) => setApprovalForm({ ...approvalForm, wage: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="var(--color-brand)" /> Paid Time Off Days
                </label>
                <input 
                  type="number" 
                  value={approvalForm.allocatedDays} 
                  onChange={(e) => setApprovalForm({ ...approvalForm, allocatedDays: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Admin only: can assign elevated HR or Admin system role */}
            {isAdmin && (
              <div className="input-group" style={{ marginBottom: '16px', backgroundColor: 'rgba(99, 102, 241, 0.05)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <label style={{ color: '#4F46E5', fontWeight: 600 }}>
                  System Access Role (Admin Only)
                </label>
                <select 
                  value={approvalForm.role} 
                  onChange={(e) => setApprovalForm({ ...approvalForm, role: e.target.value })}
                >
                  <option value="Employee">Standard Employee</option>
                  <option value="HR_Manager">HR Manager</option>
                  <option value="HR_Payroll_Manager">HR Payroll Manager</option>
                  <option value="Finance_Auditor">Finance Auditor</option>
                  <option value="Admin">System Administrator</option>
                </select>
                <small style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                  HR accounts can only be authorized by an Administrator.
                </small>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => { setApprovalModalOpen(false); setSelectedApplicant(null); }}
                disabled={approving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                style={{ backgroundColor: '#16A34A', borderColor: '#16A34A' }}
                disabled={approving}
              >
                {approving ? 'Activating Account...' : 'Approve & Activate Account'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Employees;
