import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  headerRight?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, headerRight, style, ...props }, ref) => {
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

    const selectStyle: React.CSSProperties = {
      padding: '12px 16px',
      borderRadius: '8px',
      border: `1px solid ${error ? '#fca5a5' : 'var(--border)'}`,
      fontSize: '15px',
      backgroundColor: 'var(--bg)',
      color: 'var(--text-h)',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
      WebkitAppearance: 'none',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 16px center',
      backgroundSize: '1em',
      cursor: 'pointer',
    };

    return (
      <div style={containerStyle}>
        {(label || headerRight) && (
          <div style={headerStyle}>
            {label && <label style={labelStyle}>{label}</label>}
            {headerRight}
          </div>
        )}
        <select ref={ref} {...props} style={{ ...selectStyle, ...style }}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';

