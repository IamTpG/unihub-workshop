import React from 'react';

const dateSelectorStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '16px',
  padding: '18px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'var(--text-h)',
  fontWeight: 600,
  fontSize: '17px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow)',
  marginBottom: '32px',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-h)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  opacity: 0.8,
};

interface DateRangeSelectorProps {
  label?: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  label = "Currently Showing All",
  onPrev,
  onNext 
}) => {
  return (
    <div style={dateSelectorStyle}>
      <button style={iconBtnStyle} onClick={onPrev}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>{label}</span>
      </div>
      <button style={iconBtnStyle} onClick={onNext}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};
