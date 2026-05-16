import React from 'react';

interface PresenterCardProps {
  speakerName: string;
}
export const DetailPresenterCard: React.FC<PresenterCardProps> = ({ speakerName }) => (
  <div style={cardStyle}>
    <div style={cardHeaderStyle}>PRESENTER</div>
    <div style={cardTitleStyle}>{speakerName}</div>
  </div>
);

interface SummaryCardProps {
  summary?: string | null;
  hasPdf?: boolean;
}
export const DetailSummaryCard: React.FC<SummaryCardProps> = ({ summary, hasPdf }) => {
  if (!summary && !hasPdf) {
    return null;
  }

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>SUMMARY</div>
      <p style={cardParagraphStyle}>
        {summary || 'Summary processing...'}
      </p>
    </div>
  );
};

interface RoomCardProps {
  location: string;
  capacity: number;
}
export const DetailRoomCard: React.FC<RoomCardProps> = ({ location, capacity }) => (
  <div style={cardStyle}>
    <div style={roomHeaderRowStyle}>
      <div>
        <div style={cardHeaderStyle}>ASSIGNED ROOM</div>
        <div style={cardTitleStyle}>{location}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{...cardHeaderStyle, letterSpacing: 'normal', textTransform: 'none'}}>Capacity</div>
        <div style={{...cardTitleStyle, fontSize: '17px'}}>{capacity} seats</div>
      </div>
    </div>
  </div>
);

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow)',
};

const cardHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '8px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-h)',
  marginBottom: '8px',
};

const cardParagraphStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  lineHeight: '1.6',
  margin: 0,
};

const roomHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};
