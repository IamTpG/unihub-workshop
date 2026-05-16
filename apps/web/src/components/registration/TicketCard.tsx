import React from 'react';
import { RegStatus, type RegistrationResponse } from '@unihub/shared';
import { formatDate, formatTime } from '../../utils/date';

interface TicketCardProps {
  registration: RegistrationResponse;
  onClick: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ registration, onClick }) => {
  const { workshop, status } = registration;
  
  const getStatusConfig = (s: RegStatus) => {
    switch (s) {
      case RegStatus.PAID:
        return { label: 'Confirmed', color: 'var(--success)', bg: 'var(--success-bg)' };
      case RegStatus.HOLDING:
        return { label: 'Awaiting Payment', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case RegStatus.PENDING:
        return { label: 'Processing', color: 'var(--accent)', bg: 'var(--accent-bg)' };
      case RegStatus.FAILED:
        return { label: 'Failed', color: 'var(--error)', bg: 'var(--error-bg)' };
      case RegStatus.EXPIRED:
        return { label: 'Expired', color: 'var(--text)', bg: 'var(--border)' };
      default:
        return { label: s, color: 'var(--text)', bg: 'var(--bg)' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div style={cardStyle} onClick={onClick}>
      <div style={cardTopStyle}>
        <span style={dateStyle}>{formatDate(workshop.startTime)} • {formatTime(workshop.startTime)}</span>
        <div style={{ ...statusBadgeStyle, color: config.color, backgroundColor: config.bg }}>
          {config.label}
        </div>
      </div>
      <h3 style={cardTitleStyle}>{workshop.title}</h3>
      <div style={cardBottomStyle}>
        {status === RegStatus.HOLDING && (
          <span style={priceStyle}>Due: ${workshop.price}</span>
        )}
        <span style={actionLinkStyle}>
          {status === RegStatus.PAID ? 'View Ticket →' : 'View Details →'}
        </span>
      </div>
    </div>
  );
};

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '16px',
  padding: '20px',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  transition: 'transform 0.1s ease',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const cardTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const dateStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text)',
  fontWeight: 500,
};

const statusBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-h)',
  margin: '0 0 16px 0',
  lineHeight: '1.4',
};

const cardBottomStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const priceStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: 'var(--text-h)',
};

const actionLinkStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--accent)',
};

export default TicketCard;
