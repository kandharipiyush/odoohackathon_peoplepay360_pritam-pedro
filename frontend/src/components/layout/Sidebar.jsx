import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CalendarCheck, 
  Clock, 
  DollarSign, 
  BarChart2,
  Briefcase
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser } = useAuth();
  const { isSidebarOpen } = useApp();

  const getNavItems = (role) => {
    const baseItems = [
      { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    ];

    switch (role) {
      case 'Employee':
        return [
          ...baseItems,
          { name: 'My Profile', path: '/employees', icon: <Users size={20} /> },
          { name: 'My Attendance', path: '/attendance', icon: <CalendarCheck size={20} /> },
          { name: 'My Time Off', path: '/timeoff', icon: <Clock size={20} /> },
          { name: 'My Payslips', path: '/payroll', icon: <DollarSign size={20} /> },
        ];
      case 'HR Manager':
        return [
          ...baseItems,
          { name: 'Employees', path: '/employees', icon: <Users size={20} /> },
          { name: 'Contracts', path: '/contracts', icon: <FileText size={20} /> },
          { name: 'Attendance', path: '/attendance', icon: <CalendarCheck size={20} /> },
          { name: 'Time Off', path: '/timeoff', icon: <Clock size={20} /> },
          { name: 'Reports', path: '/reports', icon: <BarChart2 size={20} /> },
        ];
      case 'HR Payroll User':
      case 'HR Payroll Manager':
      case 'Admin':
        return [
          ...baseItems,
          { name: 'Employees', path: '/employees', icon: <Users size={20} /> },
          { name: 'Contracts', path: '/contracts', icon: <FileText size={20} /> },
          { name: 'Attendance', path: '/attendance', icon: <CalendarCheck size={20} /> },
          { name: 'Time Off', path: '/timeoff', icon: <Clock size={20} /> },
          { name: 'Payroll', path: '/payroll', icon: <DollarSign size={20} /> },
          { name: 'Reports', path: '/reports', icon: <BarChart2 size={20} /> },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems(currentUser?.role);

  if (!isSidebarOpen) return null;

  return (
    <aside style={{
      width: '250px',
      backgroundColor: 'var(--color-bg-sidebar)',
      color: 'var(--color-text-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      transition: 'width 0.3s ease',
      flexShrink: 0
    }}>
      <div style={{
        padding: 'var(--spacing-3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--color-border-dark)',
        height: '64px'
      }}>
        <Briefcase size={24} color="#FFFFFF" />
        <h1 style={{ 
          color: '#FFFFFF', 
          fontSize: '18px', 
          margin: 0,
          fontWeight: 600,
          letterSpacing: '-0.5px'
        }}>
          PeoplePay360
        </h1>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-2) 0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px var(--spacing-3)',
                  gap: '12px',
                  color: isActive ? 'var(--color-text-sidebar-active)' : 'var(--color-text-sidebar)',
                  backgroundColor: isActive ? 'var(--color-border-dark)' : 'transparent',
                  borderLeft: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
                  transition: 'background-color 0.2s',
                  fontSize: '14px',
                  fontWeight: isActive ? '500' : '400'
                })}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div style={{
        padding: 'var(--spacing-3)',
        borderTop: '1px solid var(--color-border-dark)',
        fontSize: '12px',
        color: 'var(--color-text-secondary)'
      }}>
        © 2026 PeoplePay360
      </div>
    </aside>
  );
};

export default Sidebar;
