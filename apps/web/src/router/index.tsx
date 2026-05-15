import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RootRedirect, PublicRoute } from './guards';
import { AdminShell } from '../layout/AdminShell';
import { MobileShell } from '../layout/MobileShell';

// Lazy loads or placeholders for direct import
import AdminDashboard from '../pages/admin/Dashboard';
import StudentHome from '../pages/student/Home';
import WorkshopDetail from '../pages/student/WorkshopDetail';
import StaffDesk from '../pages/staff/Desk';
import Unauthorized from '../pages/public/Unauthorized';
import Login from '../pages/public/Login';



export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  // Admin Desktop Domain
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'STUDENT']}>
        <AdminShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'workshops',
        element: <div style={{ textAlign: 'left' }}><h1>Manage Workshops</h1><p style={{color:'var(--text)'}}>Workshop configuration panel.</p></div>,
      },
    ],
  },
  // Student Mobile-First Domain
  {
    path: '/workshops',
    element: (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <MobileShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StudentHome />,
      },
      {
        path: ':id',
        element: <WorkshopDetail />,
      },
    ],
  },
  {
    path: '/my-tickets',
    element: (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <MobileShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <div style={{ textAlign: 'left' }}><h1>My Tickets</h1><p style={{color:'var(--text)'}}>Your active registrations appear here.</p></div>,
      },
    ],
  },
  // Staff Mobile-First Domain
  {
    path: '/manage',
    element: (
      <ProtectedRoute allowedRoles={['STAFF']}>
        <MobileShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <StaffDesk />,
      },
      {
        path: 'scan',
        element: <div style={{ textAlign: 'left' }}><h1>Scan QR Code</h1><p style={{color:'var(--text)'}}>Scan attendee ticket to check-in.</p></div>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
