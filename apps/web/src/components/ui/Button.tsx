import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  loading,
  loadingText = 'Processing...',
  style,
  disabled,
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 12px', fontSize: '13px' },
    md: { padding: '14px', fontSize: '16px' },
    lg: { padding: '18px', fontSize: '18px' },
  };

  const baseStyle: React.CSSProperties = {
    ...sizeStyles[size],
    borderRadius: '8px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
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
