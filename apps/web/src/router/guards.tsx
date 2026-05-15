import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

// A Root guard component to dispatch users to their appropriate dashboard
export const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'STAFF':
      return <Navigate to="/manage" replace />;
    case 'STUDENT':
    default:
      return <Navigate to="/workshops" replace />;
  }
};

// Prevents authenticated users from landing back on the login page
export const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    // Directs logged-in users back to RootRedirect to evaluate role and dispatch
    return <Navigate to="/" replace />;
  }
  return children;
};
