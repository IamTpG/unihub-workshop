import React from 'react';

interface AlertProps {
  message: string;
  variant?: 'error' | 'info' | 'success';
}

export const Alert: React.FC<AlertProps> = ({ message, variant = 'info' }) => {
  const baseStyle: React.CSSProperties = {
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 500,
    boxSizing: 'border-box',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    error: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fca5a5',
      color: '#dc2626',
    },
    info: {
      backgroundColor: 'var(--accent-bg)',
      border: '1px solid var(--accent-border)',
      color: 'var(--accent)',
    },
    success: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #86efac',
      color: '#16a34a',
    }
  };

  return (
    <div style={{ ...baseStyle, ...variantStyles[variant] }}>
      {message}
    </div>
  );
};
