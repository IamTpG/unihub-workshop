import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  headerRight?: React.ReactNode;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, headerRight, style, ...props }, ref) => {
    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%',
      textAlign: 'left',
      boxSizing: 'border-box',
    };

    const headerStyle: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    };

    const labelStyle: React.CSSProperties = {
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--text-h)',
    };

    const textareaStyle: React.CSSProperties = {
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${error ? '#fca5a5' : 'var(--border)'}`,
      fontSize: '15px',
      backgroundColor: 'var(--bg)',
      color: 'var(--text-h)',
      outline: 'none',
      width: '100%',
      minHeight: '100px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
      resize: 'vertical',
      fontFamily: 'inherit',
      lineHeight: '1.5',
    };

    return (
      <div style={containerStyle}>
        {(label || headerRight) && (
          <div style={headerStyle}>
            {label && <label style={labelStyle}>{label}</label>}
            {headerRight}
          </div>
        )}
        <textarea ref={ref} {...props} style={{ ...textareaStyle, ...style }} />
        {error && <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

