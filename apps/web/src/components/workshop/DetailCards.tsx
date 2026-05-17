import React, { useState } from 'react';

interface PresenterCardProps {
  speakerName?: string | null;
}
export const DetailPresenterCard: React.FC<PresenterCardProps> = ({ speakerName }) => {
  if (!speakerName) return null;
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>PRESENTER</div>
      <div style={cardTitleStyle}>{speakerName}</div>
    </div>
  );
};

interface DescriptionCardProps {
  description?: string | null;
}
export const DetailDescriptionCard: React.FC<DescriptionCardProps> = ({ description }) => {
  if (!description) return null;
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>ABOUT THIS WORKSHOP</div>
      <p style={cardParagraphStyle}>{description}</p>
    </div>
  );
};

interface SummaryCardProps {
  summary?: string | null;
  hasPdf?: boolean;
}
export const DetailSummaryCard: React.FC<SummaryCardProps> = ({ summary, hasPdf }) => {
  if (!summary && !hasPdf) return null;
  return (
    <div style={{ ...cardStyle, background: 'var(--accent-bg, #f5f0ff)' }}>
      <div style={{ ...cardHeaderStyle, color: 'var(--accent)' }}>AI SUMMARY</div>
      <p style={cardParagraphStyle}>{summary || 'Summary processing…'}</p>
    </div>
  );
};

interface RoomCardProps {
  location?: string | null;
  capacity: number;
  roomLayoutUrl?: string | null;
}
export const DetailRoomCard: React.FC<RoomCardProps> = ({ location, capacity, roomLayoutUrl }) => {
  const [imgExpanded, setImgExpanded] = useState(false);

  return (
    <div style={cardStyle}>
      <div style={roomHeaderRowStyle}>
        <div>
          <div style={cardHeaderStyle}>ROOM</div>
          <div style={cardTitleStyle}>{location || '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ ...cardHeaderStyle, textTransform: 'none', letterSpacing: 'normal' }}>Capacity</div>
          <div style={{ ...cardTitleStyle, fontSize: '17px' }}>{capacity} seats</div>
        </div>
      </div>

      {roomLayoutUrl && (
        <>
          <div style={dividerStyle} />
          <div style={cardHeaderStyle}>ROOM LAYOUT</div>
          <img
            src={roomLayoutUrl}
            alt="Room layout"
            style={roomLayoutImgStyle(imgExpanded)}
            onClick={() => setImgExpanded((v) => !v)}
            title={imgExpanded ? 'Click to collapse' : 'Click to expand'}
          />
          {!imgExpanded && (
            <p style={imgHintStyle}>Click image to expand</p>
          )}
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '16px',
  padding: '20px',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow)',
};

const cardHeaderStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '6px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--text-h)',
};

const cardParagraphStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  lineHeight: '1.65',
  margin: 0,
};

const roomHeaderRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--border)',
  margin: '16px 0',
};

const roomLayoutImgStyle = (expanded: boolean): React.CSSProperties => ({
  width: '100%',
  maxHeight: expanded ? 'none' : '160px',
  objectFit: expanded ? 'contain' : 'cover',
  borderRadius: '10px',
  cursor: 'pointer',
  display: 'block',
  border: '1px solid var(--border)',
});

const imgHintStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: '11px',
  color: 'var(--text)',
  textAlign: 'center',
};
