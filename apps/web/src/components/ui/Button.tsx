import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading,
  loadingText = 'Processing...',
  style,
  disabled,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    padding: '14px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    width: '100%',
    opacity: disabled || loading ? 0.7 : 1,
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent)',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: 'var(--text-h)',
      color: 'var(--bg)',
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid var(--border)',
      color: 'var(--text-h)',
    }
  };

  const mergedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...style
  };

  return (
    <button {...props} disabled={disabled || loading} style={mergedStyle}>
      {loading ? loadingText : children}
    </button>
  );
};
