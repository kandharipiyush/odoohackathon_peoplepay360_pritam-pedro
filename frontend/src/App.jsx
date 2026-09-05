import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout & Protection
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';

// Views
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import EmployeeProfile from './views/EmployeeProfile';
import EmployeeForm from './views/EmployeeForm';
import Contracts from './views/Contracts';
import ContractForm from './views/ContractForm';
import Attendance from './views/Attendance';
import TimeOff from './views/TimeOff';
import TimeOffAllocations from './views/TimeOffAllocations';
import Payroll from './views/Payroll';
import Reports from './views/Reports';
import Unauthorized from './views/Unauthorized';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Employees Module */}
        <Route 
          path="employees" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <Employees />
            </RoleGuard>
          } 
        />
        <Route 
          path="employees/new" 
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
              <EmployeeForm />
            </RoleGuard>
          } 
        />
        <Route 
          path="employees/:id" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <EmployeeProfile />
            </RoleGuard>
          } 
        />
        <Route 
          path="employees/:id/edit" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Admin']}>
              <EmployeeForm />
            </RoleGuard>
          } 
        />
        
        {/* Contracts Module */}
        <Route 
          path="contracts" 
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <Contracts />
            </RoleGuard>
          } 
        />
        <Route 
          path="contracts/new" 
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
              <ContractForm />
            </RoleGuard>
          } 
        />
        <Route 
          path="contracts/:id/edit" 
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
              <ContractForm />
            </RoleGuard>
          } 
        />
        
        {/* Attendance Module */}
        <Route 
          path="attendance" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <Attendance />
            </RoleGuard>
          } 
        />
        
        {/* Time Off Module */}
        <Route 
          path="timeoff" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <TimeOff />
            </RoleGuard>
          } 
        />
        <Route 
          path="time-off" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <TimeOff />
            </RoleGuard>
          } 
        />
        <Route 
          path="time-off/allocations" 
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
              <TimeOffAllocations />
            </RoleGuard>
          } 
        />
        
        <Route 
          path="payroll" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Payroll User', 'HR Payroll Manager']}>
              <Payroll />
            </RoleGuard>
          } 
        />
        
        <Route 
          path="reports" 
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <Reports />
            </RoleGuard>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
