import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const AdminShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinkStyle = (path: string) => {
    const isActive = path === '/admin' 
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

    return {
      ...navLinkStyle,
      backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
      color: isActive ? 'var(--accent)' : 'var(--text)',
      fontWeight: isActive ? '600' : '400',
    };
  };

  return (
    <div style={containerStyle}>
      <aside style={sidebarStyle}>
        <div style={logoContainerStyle}>
          <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '24px' }}>UniHub</h2>
          <span style={badgeStyle}>ADMIN</span>
        </div>
        <nav style={navStyle}>
          <Link to="/admin" style={getLinkStyle('/admin')}>Dashboard</Link>
          <Link to="/admin/workshops" style={getLinkStyle('/admin/workshops')}>Manage Workshops</Link>
        </nav>
      </aside>
      <div style={mainAreaStyle}>
        <header style={headerStyle}>
          <div>
            <span style={{ color: 'var(--text)', fontSize: '14px' }}>Overview</span>
          </div>
          <div style={profileStyle}>
            <div style={userInfoStyle}>
              <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{user?.fullName || user?.username}</span>
              <span style={{ fontSize: '12px', color: 'var(--text)' }}>{user?.email}</span>
            </div>
            <button onClick={handleLogout} style={logoutButtonStyle}>
              Logout
            </button>
          </div>
        </header>
        <main style={contentStyle}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  background: 'var(--bg)',
  fontFamily: 'var(--sans)',
};

const sidebarStyle: React.CSSProperties = {
  width: '260px',
  borderRight: '1px solid var(--border)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
  flexShrink: 0,
};

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: '16px',
  borderBottom: '1px solid var(--border)',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '10px',
  background: 'var(--accent-bg)',
  color: 'var(--accent)',
  padding: '2px 8px',
  borderRadius: '999px',
  border: '1px solid var(--accent-border)',
  fontWeight: 600,
  letterSpacing: '0.5px',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const navLinkStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  fontSize: '15px',
};

const mainAreaStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  height: '72px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 32px',
  flexShrink: 0,
};

const profileStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const userInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
};

const logoutButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  background: 'transparent',
  cursor: 'pointer',
  color: 'var(--text-h)',
  fontWeight: 500,
  fontSize: '14px',
  transition: 'all 0.2s ease',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '32px',
  overflowY: 'auto',
};
