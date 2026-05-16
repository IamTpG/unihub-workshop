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
import StaffScan from '../pages/staff/Scan';
import Unauthorized from '../pages/public/Unauthorized';
import Login from '../pages/public/Login';

// Admin Workshop Components
import { WorkshopList as AdminWorkshopList } from '../pages/admin/workshops/WorkshopList';
import { WorkshopCreate as AdminWorkshopCreate } from '../pages/admin/workshops/WorkshopCreate';
import { WorkshopDetail as AdminWorkshopDetail } from '../pages/admin/workshops/WorkshopDetail';
import { WorkshopEdit as AdminWorkshopEdit } from '../pages/admin/workshops/WorkshopEdit';

import MyRegistrations from '../pages/student/MyRegistrations';
import TicketQR from '../pages/student/TicketQR';
import PaymentDetails from '../pages/student/PaymentDetails';
import MockPaymentGateway from '../pages/student/MockPaymentGateway';
import PaymentResult from '../pages/student/PaymentResult';



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
      <ProtectedRoute allowedRoles={['ADMIN']}>
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
        element: <AdminWorkshopList />,
      },
      {
        path: 'workshops/new',
        element: <AdminWorkshopCreate />,
      },
      {
        path: 'workshops/:id',
        element: <AdminWorkshopDetail />,
      },
      {
        path: 'workshops/:id/edit',
        element: <AdminWorkshopEdit />,
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
    element: <Navigate to="/my-registrations" replace />,
  },
  {
    path: '/my-registrations',
    element: (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <MobileShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <MyRegistrations />,
      },
      {
        path: ':id/qr',
        element: <TicketQR />,
      },
      {
        path: ':id/pay',
        element: <PaymentDetails />,
      },
      {
        path: ':id/mock-pay',
        element: <MockPaymentGateway />,
      },
      {
        path: ':id/result',
        element: <PaymentResult />,
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
        element: <StaffScan />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
