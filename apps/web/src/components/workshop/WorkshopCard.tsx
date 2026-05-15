import React from 'react';
import type { ApiWorkshop } from '../../stores/workshopStore';

interface WorkshopCardProps {
  workshop: ApiWorkshop;
  onClick?: () => void;
}

import { formatTime } from '../../utils/date';

export const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, onClick }) => {
  const isFull = workshop.availableSlots === 0;
  const isPaid = Number(workshop.price) > 0;
  const seatsRemainingText = `${workshop.capacity - workshop.availableSlots}/${workshop.capacity} seats`;

  return (
    <div 
      style={{
        ...cardStyle,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      {/* Card Top Row */}
      <div style={cardTopRowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{formatTime(workshop.startTime)}</span>
        </div>
        
        <div style={seatsBadgeStyle(isFull)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>{seatsRemainingText}</span>
        </div>
      </div>

      {/* Card Middle Title */}
      <h3 style={cardTitleStyle}>{workshop.title}</h3>

      {/* Card Bottom Row */}
      <div style={cardBottomRowStyle}>
        <span>Presenter: <span style={{ color: 'var(--text-h)' }}>{workshop.speakerName}</span></span>
        <div style={typeBadgeStyle(isPaid)}>
          {isPaid ? `$${workshop.price}` : 'Free'}
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '18px',
  padding: '20px 22px',
  border: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  boxShadow: 'var(--shadow)',
  transition: 'transform 0.1s ease-in-out',
};

const cardTopRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
  color: 'var(--text)',
  fontWeight: 500,
};

const seatsBadgeStyle = (isFull: boolean): React.CSSProperties => ({
  backgroundColor: isFull ? 'var(--error-bg)' : 'var(--success-bg)',
  color: isFull ? 'var(--error)' : 'var(--success)',
  padding: '5px 12px',
  borderRadius: '999px',
  fontWeight: 600,
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

const cardTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text-h)',
  margin: 0,
  lineHeight: '1.3',
  letterSpacing: '-0.4px',
};

const cardBottomRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '14px',
  color: 'var(--text)',
  fontWeight: 500,
};

const typeBadgeStyle = (isPaid: boolean): React.CSSProperties => ({
  backgroundColor: !isPaid ? 'var(--accent-bg)' : 'var(--social-bg)',
  color: !isPaid ? 'var(--accent)' : 'var(--text-h)',
  padding: '5px 14px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  border: `1px solid ${!isPaid ? 'var(--accent-border)' : 'var(--border)'}`,
});
