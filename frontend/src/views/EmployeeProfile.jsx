import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeApi } from '../services/employeeApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { User, Mail, Phone, MapPin, Building, Briefcase, Calendar, Clock, FileText, DollarSign, CalendarCheck } from 'lucide-react';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const effectiveId = id || currentUser?.employee_id || currentUser?.id || 1;
  const isSelfProfile = !id || String(id) === String(currentUser?.employee_id || currentUser?.id);
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canEdit = ['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role) || isSelfProfile;

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await employeeApi.getEmployee(effectiveId);
        if (res.data) {
          setEmployee(res.data);
          setError(null);
        } else if (currentUser) {
          setEmployee({
            id: currentUser.id,
            employeeId: currentUser.employee_id ? `EMP-${String(currentUser.employee_id).padStart(3, '0')}` : `EMP-${String(effectiveId).padStart(3, '0')}`,
            firstName: currentUser.first_name || currentUser.firstName || currentUser.name?.split(' ')[0] || 'Employee',
            lastName: currentUser.last_name || currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '',
            email: currentUser.email || 'employee@company.com',
            department: currentUser.department || 'Operations',
            position: currentUser.role || 'Staff Member',
            status: 'Active',
            joiningDate: currentUser.created_at ? String(currentUser.created_at).split('T')[0] : '2026-01-15',
            phone: '+91 98765 43210',
            address: 'Corporate Headquarters'
          });
          setError(null);
        } else {
          setError('Employee not found.');
        }
      } catch (err) {
        if (currentUser) {
          setEmployee({
            id: currentUser.id,
            employeeId: currentUser.employee_id ? `EMP-${String(currentUser.employee_id).padStart(3, '0')}` : `EMP-${String(effectiveId).padStart(3, '0')}`,
            firstName: currentUser.first_name || currentUser.firstName || currentUser.name?.split(' ')[0] || 'Employee',
            lastName: currentUser.last_name || currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '',
            email: currentUser.email || 'employee@company.com',
            department: currentUser.department || 'Operations',
            position: currentUser.role || 'Staff Member',
            status: 'Active',
            joiningDate: currentUser.created_at ? String(currentUser.created_at).split('T')[0] : '2026-01-15',
            phone: '+91 98765 43210',
            address: 'Corporate Headquarters'
          });
          setError(null);
        } else {
          setError('Failed to fetch employee details.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [effectiveId, currentUser]);

  if (loading) return <Loader fullScreen />;
  if (error || !employee) return <div style={{ padding: 'var(--spacing-3)', color: 'var(--color-status-error)' }}>{error || 'Employee not found'}</div>;

  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employee Profile';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>{isSelfProfile ? 'My Profile' : 'Employee Profile'}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Personal details & employment information</p>
        </div>
        {canEdit && (
          <Button variant="primary" onClick={() => navigate(employee.id ? `/employees/${employee.id}/edit` : `/profile/edit`)}>
            Edit Profile
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--spacing-3)' }}>
        {/* Quick Info & Avatar Card */}
        <div>
          <Card style={{ textAlign: 'center', marginBottom: 'var(--spacing-3)' }}>
            <div style={{ 
              width: '96px', height: '96px', borderRadius: '50%', 
              backgroundColor: 'var(--color-bg-main)', margin: '0 auto var(--spacing-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={48} color="var(--color-text-secondary)" />
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{fullName}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 'var(--spacing-2)' }}>{employee.position}</p>
            <span style={{ 
              fontSize: '12px', padding: '4px 12px', borderRadius: '12px', 
              backgroundColor: employee.status === 'Active' ? 'var(--color-status-success)20' : 'var(--color-text-secondary)20', 
              color: employee.status === 'Active' ? 'var(--color-status-success)' : 'var(--color-text-secondary)',
              fontWeight: 600
            }}>
              {employee.status || 'Active'}
            </span>
          </Card>

          <Card title="Contact Information">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
              <Mail size={16} color="var(--color-text-secondary)" />
              <span>{employee.email || 'Not provided'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
              <Phone size={16} color="var(--color-text-secondary)" />
              <span>{employee.phone || '+91 98765 43210'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
              <MapPin size={16} color="var(--color-text-secondary)" />
              <span>{employee.address || 'Corporate Headquarters'}</span>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <Card title="Employment Details">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-3)' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Employee ID</p>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>{employee.employeeId || `EMP-${employee.id}`}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Department</p>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>{employee.department || 'Operations'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Job Position</p>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>{employee.position || 'Staff'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Reporting Manager</p>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>{employee.manager || 'HR Director'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Joining Date</p>
                <p style={{ fontSize: '15px', fontWeight: 600 }}>{employee.joiningDate || '2026-01-15'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Employment Status</p>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-status-success)' }}>Full-Time Regular</p>
              </div>
            </div>
          </Card>

          <Card title="Quick Access Hub">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-2)' }}>
              <Button variant="secondary" onClick={() => navigate('/attendance')} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                <CalendarCheck size={18} style={{ marginRight: '8px', color: 'var(--color-status-info)' }} /> Attendance
              </Button>
              <Button variant="secondary" onClick={() => navigate('/timeoff')} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                <Clock size={18} style={{ marginRight: '8px', color: 'var(--color-status-warning)' }} /> Time Off
              </Button>
              {['Admin', 'HR Payroll Manager', 'HR Payroll User', 'Employee'].includes(currentUser?.role) && (
                <Button variant="secondary" onClick={() => navigate('/payroll')} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                  <DollarSign size={18} style={{ marginRight: '8px', color: 'var(--color-status-success)' }} /> Payslips
                </Button>
              )}
              {['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role) && (
                <Button variant="secondary" onClick={() => navigate(`/contracts?employeeId=${effectiveId}`)} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                  <FileText size={18} style={{ marginRight: '8px' }} /> Contract Details
                </Button>
              )}
              {currentUser?.role === 'HR Manager' && (
                <Button variant="secondary" onClick={() => navigate('/reports')} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                  <FileText size={18} style={{ marginRight: '8px', color: 'var(--color-status-warning)' }} /> HR Reports
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
