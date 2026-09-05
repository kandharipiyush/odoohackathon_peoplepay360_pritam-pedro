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
import Contracts from './views/Contracts';
import Attendance from './views/Attendance';
import TimeOff from './views/TimeOff';
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
        
        <Route 
          path="employees" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <Employees />
            </RoleGuard>
          } 
        />
        
        <Route 
          path="contracts" 
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <Contracts />
            </RoleGuard>
          } 
        />
        
        <Route 
          path="attendance" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <Attendance />
            </RoleGuard>
          } 
        />
        
        <Route 
          path="timeoff" 
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager']}>
              <TimeOff />
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
