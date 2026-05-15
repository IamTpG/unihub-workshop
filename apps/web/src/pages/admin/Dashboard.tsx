import React from 'react';
import { useAuthStore } from '../../stores/authStore';

const AdminDashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>Welcome back, {user?.fullName || 'Admin'}</h1>
        <p style={{ color: 'var(--text)' }}>Here is what's happening with UniHub Workshops today.</p>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <span style={cardTitleStyle}>Total Workshops</span>
          <span style={cardValueStyle}>12</span>
        </div>
        <div style={cardStyle}>
          <span style={cardTitleStyle}>Total Registrations</span>
          <span style={cardValueStyle}>1,240</span>
        </div>
        <div style={cardStyle}>
          <span style={cardTitleStyle}>Active Checked-in</span>
          <span style={cardValueStyle}>84</span>
        </div>
      </div>
    </div>
  );
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '24px',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg)',
  padding: '24px',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const cardTitleStyle: React.CSSProperties = {
  color: 'var(--text)',
  fontSize: '14px',
  fontWeight: 500,
};

const cardValueStyle: React.CSSProperties = {
  color: 'var(--text-h)',
  fontSize: '36px',
  fontWeight: 700,
};

export default AdminDashboard;
