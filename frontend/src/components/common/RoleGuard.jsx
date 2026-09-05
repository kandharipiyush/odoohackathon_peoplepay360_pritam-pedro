import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const normalizeRole = (r) => (r || '').toString().toLowerCase().replace(/[\s_]+/g, '');

const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = currentUser.role || '';
  const normalizedUser = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  if (normalizedUser === 'admin' || normalizedAllowed.includes('*') || normalizedAllowed.includes(normalizedUser)) {
    return children; // Admin or authorized role allowed
  }

  return <Navigate to="/" replace />;
};

export default RoleGuard;
