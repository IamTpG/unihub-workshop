import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  style,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '24px',
    width: '100%',
    ...style,
  };

  const infoStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--text)',
    fontWeight: 500,
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  };

  const btnOverrideStyle: React.CSSProperties = {
    width: 'auto',
    padding: '10px 18px',
    fontSize: '14px',
  };

  return (
    <div style={containerStyle}>
      <div style={infoStyle}>
        Page <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{page}</span> of{' '}
        <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{Math.max(totalPages, 1)}</span>
      </div>
      <div style={actionsStyle}>
        <Button
          variant="outline"
          style={btnOverrideStyle}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          &larr; Previous
        </Button>
        <Button
          variant="outline"
          style={btnOverrideStyle}
          disabled={page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
        >
          Next &rarr;
        </Button>
      </div>
    </div>
  );
};
