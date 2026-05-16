import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  backPath?: string;
  onBack?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, backPath, onBack }) => {
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
      <button onClick={handleBack} style={backButtonStyle}>
        ← Back
      </button>
      <h1 style={titleStyle}>{title}</h1>
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '24px',
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
