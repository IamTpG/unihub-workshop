import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { NotificationCenter } from '../components/notifications/NotificationCenter';

export const MobileShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStudent = user?.role === 'STUDENT';

  const getTabStyle = (path: string) => ({
    ...tabStyle,
    color: location.pathname === path ? 'var(--accent)' : 'var(--text)',
    fontWeight: location.pathname === path ? '600' : '400',
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <Link to={isStudent ? "/workshops" : "/manage"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--accent)', fontWeight: 800, letterSpacing: '-0.5px' }}>UniHub</h2>
        </Link>
        <div style={headerRightStyle}>
          <NotificationCenter />
          {isStudent && (
            <Link
              to="/my-registrations"
              style={{
                ...ticketLinkStyle,
                color: location.pathname.startsWith('/my-registrations') ? 'var(--accent)' : 'var(--text)',
              }}
              title="My Registrations"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
            </Link>
          )}
          {!isStudent && <span style={badgeStyle}>{user?.role}</span>}
          <button onClick={() => setShowLogoutConfirm(true)} style={logoutBtnStyle} title="Logout">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>
      <main 
        style={{
          ...contentStyle,
          paddingBottom: isStudent ? '24px' : '72px',
        }}
      >
        {/* Restrict content width to prevent awkward stretching on iPads/Desktop views */}
        <div style={innerContentStyle}>
          <Outlet />
        </div>
      </main>
      
      {/* Render bottom nav ONLY for staff users */}
      {!isStudent && (
        <nav style={bottomNavStyle}>
          <Link to="/manage" style={getTabStyle('/manage')}>
            <span style={tabTextStyle}>Desk</span>
          </Link>
          <Link to="/manage/scan" style={getTabStyle('/manage/scan')}>
            <span style={tabTextStyle}>Scan QR</span>
          </Link>
        </nav>
      )}

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        description="Are you sure you want to log out of your UniHub session?"
        confirmText="Log Out"
        variant="danger"
      />
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: 'var(--bg)',
  fontFamily: 'var(--sans)',
};

const headerStyle: React.CSSProperties = {
  height: '60px',
  borderBottom: '1px solid var(--border)',
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'sticky',
  top: 0,
  backgroundColor: 'var(--bg)',
  zIndex: 10,
};

const headerRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '10px',
  background: 'var(--social-bg)',
  padding: '2px 6px',
  borderRadius: '4px',
  color: 'var(--text-h)',
  fontWeight: 600,
};

const logoutBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '6px',
  color: 'var(--text)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const ticketLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px',
  marginRight: '4px',
  cursor: 'pointer',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  paddingBottom: '72px', // Account for fixed bottom nav
  overflowY: 'auto',
};

const innerContentStyle: React.CSSProperties = {
  maxWidth: '600px', // Keep central content focus
  margin: '0 auto',
  padding: '20px 16px',
};

const bottomNavStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  height: '64px',
  backgroundColor: 'var(--bg)',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  boxShadow: 'var(--shadow)',
  zIndex: 10,
};

const tabStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textDecoration: 'none',
  gap: '4px',
  flex: 1,
  justifyContent: 'center',
  height: '100%',
};

const tabTextStyle: React.CSSProperties = {
  fontSize: '12px',
};
