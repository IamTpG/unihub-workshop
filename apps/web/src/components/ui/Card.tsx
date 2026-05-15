import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  maxWidth?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, maxWidth = '420px' }) => {
  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: maxWidth,
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: 'var(--shadow)',
    boxSizing: 'border-box',
    ...style,
  };

  return <div style={cardStyle}>{children}</div>;
};
