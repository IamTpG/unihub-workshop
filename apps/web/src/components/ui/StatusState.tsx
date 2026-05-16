import React, { useEffect } from 'react';
import { Button } from './Button';

interface StatusStateProps {
  type: 'loading' | 'error';
  message?: string;
  onRetry?: () => void;
}

export const StatusState: React.FC<StatusStateProps> = ({ type, message, onRetry }) => {
  // Inject spinner styles once
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('spinner-styles-global')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles-global';
      style.innerHTML = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (type === 'loading') {
    return (
      <div style={centerStyle}>
        <div style={spinnerStyle} />
        <p>{message || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div style={centerStyle}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <p style={{ color: 'var(--error)', marginBottom: '16px', fontWeight: 500 }}>
        {message || 'Something went wrong'}
      </p>
      {onRetry && <Button onClick={onRetry}>Try Again</Button>}
    </div>
  );
};

const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: '20px',
  textAlign: 'center',
  color: 'var(--text)',
};

const spinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '3px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px',
};
