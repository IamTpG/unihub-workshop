import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backPath?: string;
  onBack?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  backPath,
  onBack,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header style={headerStyle}>
      <div style={titleGroupStyle}>
        <button onClick={handleBack} style={backButtonStyle}>
          &larr; Back
        </button>
        <div>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '24px',
};

const titleGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: 'var(--text-h)',
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  color: 'var(--text)',
  fontSize: '14px',
  margin: '4px 0 0',
};
