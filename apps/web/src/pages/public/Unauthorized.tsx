import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={wrapperStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#ef4444', margin: 0, fontSize: '48px' }}>403</h1>
        <h2 style={{ margin: '8px 0 16px 0' }}>Access Denied</h2>
        <p style={{ color: 'var(--text)', marginBottom: '24px' }}>You do not have permission to view this page.</p>
        <button onClick={() => navigate('/')} style={btnStyle}>Back to Home</button>
      </div>
    </div>
  );
};

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  backgroundColor: 'var(--bg)',
};

const cardStyle: React.CSSProperties = {
  maxWidth: '400px',
  textAlign: 'center',
  padding: '40px 24px',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow)',
  backgroundColor: 'var(--bg)',
};

const btnStyle: React.CSSProperties = {
  backgroundColor: 'var(--accent)',
  color: '#fff',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
};

export default Unauthorized;
