import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ element, requiredRole }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // No token = not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists but wrong role
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  // Token exists and role matches (or no role required)
  return element;
}
