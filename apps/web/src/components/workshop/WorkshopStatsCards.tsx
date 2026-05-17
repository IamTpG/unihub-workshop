import React from 'react';
import { Card } from '../ui/Card';

interface WorkshopStatsCardsProps {
  totalRegistrations: number;
  capacity: number;
  availableSlots: number;
  registrationCounts: Record<string, number>;
  checkedInCount?: number;
}

const getStatusColor = (status: string): string => {
  const lower = status.toLowerCase();
  if (lower.includes('success') || lower.includes('paid') || lower.includes('checked')) return 'var(--success)';
  if (lower.includes('fail') || lower.includes('cancel')) return 'var(--error)';
  if (lower.includes('pend') || lower.includes('hold')) return '#f59e0b'; // amber/orange
  return 'var(--text-h)';
};

export const WorkshopStatsCards: React.FC<WorkshopStatsCardsProps> = ({
  totalRegistrations,
  capacity,
  availableSlots,
  registrationCounts,
  checkedInCount,
}) => {
  return (
    <div style={statsGridStyle}>
      <Card maxWidth="100%" style={statCardStyle}>
        <div style={statLabelStyle}>Total Registrations</div>
        <div style={statValueStyle}>{totalRegistrations}</div>
      </Card>

      <Card maxWidth="100%" style={statCardStyle}>
        <div style={statLabelStyle}>Seats Filled</div>
        <div style={statValueStyle}>
          {capacity - availableSlots} / {capacity}
        </div>
      </Card>

      {checkedInCount !== undefined && (
        <Card maxWidth="100%" style={statCardStyle}>
          <div style={statLabelStyle}>Checked In</div>
          <div style={{ ...statValueStyle, color: 'var(--success)' }}>{checkedInCount}</div>
        </Card>
      )}

      {Object.entries(registrationCounts).map(([status, count]) => (
        <Card key={status} maxWidth="100%" style={statCardStyle}>
          <div style={statLabelStyle}>{status}</div>
          <div style={{ ...statValueStyle, color: getStatusColor(status) }}>{count}</div>
        </Card>
      ))}
    </div>
  );
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '20px',
  marginBottom: '32px',
};

const statCardStyle: React.CSSProperties = {
  padding: '20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  borderRadius: '12px',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: 'var(--text-h)',
};
