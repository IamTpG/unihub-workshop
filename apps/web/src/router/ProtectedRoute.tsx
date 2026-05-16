import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type Role } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    useNotificationStore.getState().initSSE();
    useNotificationStore.getState().fetchNotifications();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    // Store current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
