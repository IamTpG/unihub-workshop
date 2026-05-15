import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkshopStore } from '../../stores/workshopStore';
import { Button } from '../../components/ui/Button';

import { formatDate, formatTime } from '../../utils/date';
import { 
  DetailPresenterCard, 
  DetailSummaryCard, 
  DetailRoomCard 
} from '../../components/workshop/DetailCards';

const WorkshopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workshops, fetchWorkshops, isLoading } = useWorkshopStore();

  const workshop = workshops.find((w) => w.id === id);

  useEffect(() => {
    if (!workshop && !isLoading) {
      fetchWorkshops();
    }
  }, [workshop, isLoading, fetchWorkshops]);

  if (isLoading && !workshop) {
    return (
      <div style={statusScreenStyle}>
        <div style={loadingSpinnerStyle} />
        <p style={{ color: 'var(--text)' }}>Loading workshop details...</p>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div style={statusScreenStyle}>
        <h3 style={{ color: 'var(--text-h)', marginBottom: '12px' }}>Workshop Not Found</h3>
        <p style={{ color: 'var(--text)', marginBottom: '20px' }}>This workshop may have been removed or does not exist.</p>
        <Button onClick={() => navigate('/workshops')}>Back to Workshops</Button>
      </div>
    );
  }

  const isFull = workshop.availableSlots === 0;
  const isPaid = Number(workshop.price) > 0;
  const priceDisplay = isPaid ? `$${workshop.price}` : 'Free';
  const seatsRemainingText = `${workshop.capacity - workshop.availableSlots}/${workshop.capacity} seats`;

  return (
    <div style={pageContainer}>
      <button style={backBtnStyle} onClick={() => navigate(-1)}>
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
         </svg>
      </button>

      <h1 style={titleStyle}>{workshop.title}</h1>
      
      <div style={dateTimeRowStyle}>
        <div style={iconTextStyle}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(workshop.startTime)}
        </div>
        <div style={iconTextStyle}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {formatTime(workshop.startTime)} – {formatTime(workshop.endTime)}
        </div>
      </div>

      <div style={badgesRowStyle}>
        <div style={seatsBadgeStyle(isFull)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {seatsRemainingText}
        </div>
      </div>

      <div style={contentStackStyle}>
        <DetailPresenterCard speakerName={workshop.speakerName} />
        <DetailSummaryCard summary={workshop.aiSummary} />
        <DetailRoomCard location={workshop.location} capacity={workshop.capacity} />
      </div>

      <div style={stickyFooterStyle}>
        <button style={registerButtonStyle(isFull)}>
          {isFull ? 'Sold Out' : `Register — ${priceDisplay}`}
        </button>
      </div>
    </div>
  );
};

/* Component Styles */
const pageContainer: React.CSSProperties = {
  textAlign: 'left',
  fontFamily: 'var(--sans)',
  paddingTop: '8px',
  paddingBottom: '100px', // padding for sticky footer
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-h)',
  cursor: 'pointer',
  padding: '0',
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: 'var(--text-h)',
  margin: '0 0 16px 0',
  lineHeight: '1.15',
  letterSpacing: '-0.5px',
};

const dateTimeRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '16px',
};

const iconTextStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '15px',
  color: 'var(--text)',
  fontWeight: 500,
};

const badgesRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '32px',
};

const seatsBadgeStyle = (isFull: boolean): React.CSSProperties => ({
  backgroundColor: isFull ? 'var(--error-bg)' : 'var(--success-bg)',
  color: isFull ? 'var(--error)' : 'var(--success)',
  padding: '6px 14px',
  borderRadius: '999px',
  fontWeight: 600,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

const contentStackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const stickyFooterStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '20px 24px',
  paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
  backgroundColor: 'var(--bg)',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 100,
};

const registerButtonStyle = (isFull: boolean): React.CSSProperties => ({
  backgroundColor: isFull ? 'var(--border)' : 'var(--success)', // uses system green theme
  color: isFull ? 'var(--text)' : '#fff',
  border: 'none',
  borderRadius: '12px',
  padding: '16px',
  fontSize: '18px',
  fontWeight: 700,
  width: '100%',
  maxWidth: '400px',
  cursor: isFull ? 'not-allowed' : 'pointer',
  boxShadow: isFull ? 'none' : '0 4px 14px rgba(82, 196, 26, 0.4)',
});

/* Helper Styles */
const statusScreenStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  textAlign: 'center',
  fontFamily: 'var(--sans)',
  padding: '20px',
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px',
};

export default WorkshopDetail;
