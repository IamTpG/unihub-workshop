import React from 'react';

export interface ColumnDef<T> {
  header: string;
  key: string;
  render?: (row: T) => React.ReactNode;
  style?: React.CSSProperties;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  style?: React.CSSProperties;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data available.',
  style,
}: DataTableProps<T>) {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow)',
    backgroundColor: 'var(--bg)',
    ...style,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '15px',
  };

  const thStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    fontWeight: 600,
    color: 'var(--text)',
    backgroundColor: 'var(--code-bg)',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const tdStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-h)',
    verticalAlign: 'middle',
  };

  const emptyRowStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--text)',
  };

  const loadingContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px 24px',
    color: 'var(--accent)',
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={loadingContainerStyle}>
          <span>Loading data...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...thStyle, ...col.style }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={emptyRowStyle}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="data-row">
                {columns.map((col) => (
                  <td key={col.key} style={{ ...tdStyle, ...col.style }}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {/* Micro-animation for row hover */}
      <style>{`
        tr.data-row:last-child td {
          border-bottom: none;
        }
        tr.data-row {
          transition: background-color 0.15s ease;
        }
        tr.data-row:hover {
          background-color: var(--code-bg);
        }
      `}</style>
    </div>
  );
}
