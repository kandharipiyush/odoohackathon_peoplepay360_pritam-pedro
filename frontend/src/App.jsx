import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout & Protection
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';

// Views
import Login from './views/Login';
import Register from './views/Register';
import ForgotPassword from './views/ForgotPassword';
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
import PayrunCreate from './views/payroll/PayrunCreate';
import PayrunDetails from './views/payroll/PayrunDetails';
import PayslipDetails from './views/payroll/PayslipDetails';
import Reports from './views/Reports';
import PayrollAnalytics from './views/PayrollAnalytics';
import Unauthorized from './views/Unauthorized';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
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

        {/* Profile Module */}
        <Route
          path="profile"
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <EmployeeProfile />
            </RoleGuard>
          }
        />

        {/* Employees Module */}
        <Route
          path="employees"
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
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
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
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
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
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
        {/* Task 6: Add missing /contracts/:id view route — reuse ContractForm in read-only style
            or simply redirect to edit. Using Contracts with employeeId filter as view. */}
        <Route
          path="contracts/:id"
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
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
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <Attendance />
            </RoleGuard>
          }
        />

        {/* Time Off Module */}
        <Route
          path="timeoff"
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <TimeOff />
            </RoleGuard>
          }
        />
        <Route
          path="time-off"
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
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

        {/* Payroll Module */}
        <Route
          path="payroll"
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <Payroll />
            </RoleGuard>
          }
        />
        <Route
          path="payroll/payruns/create"
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Admin']}>
              <PayrunCreate />
            </RoleGuard>
          }
        />
        <Route
          path="payroll/payruns/:id"
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <PayrunDetails />
            </RoleGuard>
          }
        />
        <Route
          path="payroll/payslips/:id"
          element={
            <RoleGuard allowedRoles={['Employee', 'HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <PayslipDetails />
            </RoleGuard>
          }
        />

        <Route
          path="reports"
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <Reports />
            </RoleGuard>
          }
        />
        <Route
          path="reports/payroll"
          element={
            <RoleGuard allowedRoles={['HR Manager', 'HR Payroll Manager', 'Finance Auditor', 'Admin']}>
              <PayrollAnalytics />
            </RoleGuard>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
