import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    width: '100%',
    gap: '16px',
    ...style,
  };

  const titleContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    margin: 0,
    fontWeight: 700,
    color: 'var(--text-h)',
    letterSpacing: '-0.5px',
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'var(--text)',
    margin: 0,
    fontSize: '16px',
  };

  const actionStyle: React.CSSProperties = {
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={titleContainerStyle}>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {action && <div style={actionStyle}>{action}</div>}
    </div>
  );
};
