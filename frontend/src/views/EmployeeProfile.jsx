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
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canEdit = ['Admin', 'HR Manager', 'HR Payroll Manager'].includes(currentUser?.role) || currentUser?.id === parseInt(id);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await employeeApi.getEmployee(id);
        if (res.data) setEmployee(res.data);
        else setError('Employee not found.');
      } catch (err) {
        setError('Failed to fetch employee details.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) return <Loader fullScreen />;
  if (error || !employee) return <div style={{ padding: 'var(--spacing-3)', color: 'var(--color-status-error)' }}>{error || 'Employee not found'}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
        <h1 style={{ fontSize: '24px' }}>Employee Profile</h1>
        {canEdit && (
          <Button variant="primary" onClick={() => navigate(`/employees/${id}/edit`)}>Edit Profile</Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
        {/* Sidebar / Quick Info */}
        <div style={{ flex: '1', minWidth: '300px', maxWidth: '350px' }}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '96px', height: '96px', borderRadius: '50%', 
              backgroundColor: 'var(--color-bg-main)', margin: '0 auto var(--spacing-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={48} color="var(--color-text-secondary)" />
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>{employee.firstName} {employee.lastName}</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 'var(--spacing-2)' }}>{employee.position}</p>
            <span style={{ 
              fontSize: '12px', padding: '4px 12px', borderRadius: '12px', 
              backgroundColor: employee.status === 'Active' ? 'var(--color-status-success)20' : 'var(--color-text-secondary)20', 
              color: employee.status === 'Active' ? 'var(--color-status-success)' : 'var(--color-text-secondary)' 
            }}>
              {employee.status}
            </span>
          </Card>

          <Card title="Contact Info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
              <Mail size={16} color="var(--color-text-secondary)" />
              <span>{employee.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px' }}>
              <Phone size={16} color="var(--color-text-secondary)" />
              <span>{employee.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
              <MapPin size={16} color="var(--color-text-secondary)" />
              <span>{employee.address || 'Address not provided'}</span>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div style={{ flex: '2', minWidth: '400px' }}>
          <Card title="Smart Links">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-2)' }}>
              <Button variant="secondary" onClick={() => navigate(`/contracts?employeeId=${id}`)} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                <FileText size={18} style={{ marginRight: '8px' }} /> Contracts
              </Button>
              <Button variant="secondary" onClick={() => navigate(`/attendance?employeeId=${id}`)} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                <CalendarCheck size={18} style={{ marginRight: '8px' }} /> Attendance
              </Button>
              <Button variant="secondary" onClick={() => navigate(`/time-off?employeeId=${id}`)} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                <Clock size={18} style={{ marginRight: '8px' }} /> Time Off
              </Button>
              <Button variant="secondary" onClick={() => navigate(`/payroll?employeeId=${id}`)} style={{ justifyContent: 'flex-start', padding: '12px' }}>
                <DollarSign size={18} style={{ marginRight: '8px' }} /> Payslips
              </Button>
            </div>
          </Card>

          <Card title="Employment Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Employee ID</p>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>{employee.employeeId}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Department</p>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>{employee.department}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Manager</p>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>{employee.manager || 'None'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Joining Date</p>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>{employee.joiningDate}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
