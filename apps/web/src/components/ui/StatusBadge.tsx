import React from 'react';

export type StatusType = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

interface StatusBadgeProps {
  status: StatusType;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    width: 'fit-content',
    ...style,
  };

  const variantMap: Record<StatusType, React.CSSProperties> = {
    PUBLISHED: {
      backgroundColor: 'var(--success-bg)',
      color: 'var(--success)',
      border: '1px solid rgba(52, 199, 89, 0.2)',
    },
    DRAFT: {
      backgroundColor: 'rgba(107, 99, 117, 0.1)',
      color: 'var(--text)',
      border: '1px solid rgba(107, 99, 117, 0.2)',
    },
    CANCELLED: {
      backgroundColor: 'var(--error-bg)',
      color: 'var(--error)',
      border: '1px solid rgba(255, 59, 48, 0.2)',
    },
  };

  const formattedLabel = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <span style={{ ...baseStyle, ...variantMap[status] }}>
      {formattedLabel}
    </span>
  );
};
