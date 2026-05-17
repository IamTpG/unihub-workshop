import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkshopStore } from '../../stores/workshopStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { Button } from '../../components/ui/Button';
import {
  DetailPresenterCard,
  DetailDescriptionCard,
  DetailSummaryCard,
  DetailRoomCard,
} from '../../components/workshop/DetailCards';
import { formatDate, formatTime, formatDateTimeRange } from '../../utils/date';

type Stage = 'upcoming' | 'register' | 'full' | 'registered' | 'closed';

const WorkshopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { currentWorkshop: workshop, detailLoading, detailError, fetchWorkshopDetail, fetchWorkshops } =
    useWorkshopStore();
  const { registeredWorkshopIds, registerForWorkshop, pollForRegistration, fetchRegistrations } =
    useRegistrationStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkshopDetail(id);
      fetchRegistrations();
    }
  }, [id, fetchWorkshopDetail, fetchRegistrations]);

  if (detailLoading) {
    return (
      <div style={statusStyle}>
        <div style={spinnerStyle} />
        <p style={{ color: 'var(--text)' }}>Loading workshop details…</p>
      </div>
    );
  }

  if (detailError || !workshop) {
    return (
      <div style={statusStyle}>
        <h3 style={{ color: 'var(--text-h)', marginBottom: '12px' }}>Workshop Not Found</h3>
        <p style={{ color: 'var(--text)', marginBottom: '20px' }}>
          {detailError || 'This workshop may have been removed or does not exist.'}
        </p>
        <Button onClick={() => navigate('/workshops')}>Back to Workshops</Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  const now = new Date();
  const isPaid = Number(workshop.price) > 0;
  const isFull = workshop.availableSlots === 0;
  const regOpen = workshop.registrationOpenAt ? new Date(workshop.registrationOpenAt) : null;
  const regClose = workshop.registrationCloseAt ? new Date(workshop.registrationCloseAt) : null;
  const isRegistered = registeredWorkshopIds.includes(workshop.id);

  const stage: Stage =
    isRegistered ? 'registered' :
    regClose && now > regClose ? 'closed' :
    regOpen && now < regOpen ? 'upcoming' :
    isFull ? 'full' :
    'register';

  const isSameDay =
    new Date(workshop.startTime).toDateString() === new Date(workshop.endTime).toDateString();

  // -------------------------------------------------------------------------
  // Registration handlers
  // -------------------------------------------------------------------------
  async function handleFreeConfirm() {
    setRegistering(true);
    setRegError(null);
    try {
      await registerForWorkshop(workshop!.id);
      fetchWorkshops();
      setShowConfirm(false);
    } catch (err: unknown) {
      setRegError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.',
      );
    } finally {
      setRegistering(false);
    }
  }

  async function handlePaidRegister() {
    setRegistering(true);
    setRegError(null);
    try {
      await registerForWorkshop(workshop!.id);
      const registrationId = await pollForRegistration(workshop!.id);
      fetchWorkshops();
      navigate(
        registrationId
          ? `/my-registrations/${registrationId}/pay`
          : '/my-registrations',
      );
    } catch (err: unknown) {
      setRegError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.',
      );
      setRegistering(false);
    }
  }

  function handleRegisterClick() {
    setRegError(null);
    if (isPaid) handlePaidRegister();
    else setShowConfirm(true);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      <div style={pageContainer}>
        {/* Back button */}
        <button style={backBtnStyle} onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Title */}
        <h1 style={titleStyle}>{workshop.title}</h1>

        {/* Date / time row */}
        <div style={metaRowStyle}>
          {isSameDay ? (
            <>
              <span style={metaChipStyle}>
                <CalendarIcon />
                {formatDate(workshop.startTime)}
              </span>
              <span style={metaChipStyle}>
                <ClockIcon />
                {formatTime(workshop.startTime)} – {formatTime(workshop.endTime)}
              </span>
            </>
          ) : (
            <span style={metaChipStyle}>
              <CalendarIcon />
              {formatDateTimeRange(workshop.startTime, workshop.endTime)}
            </span>
          )}
        </div>

        {/* Badges row: seats + price */}
        <div style={badgesRowStyle}>
          <span style={seatsBadgeStyle(isFull)}>
            <PeopleIcon />
            {isFull
              ? 'Fully Booked'
              : `${workshop.availableSlots} / ${workshop.capacity} seats available`}
          </span>
          <span style={priceBadgeStyle(isPaid)}>
            {isPaid ? `${Number(workshop.price).toLocaleString()} VND` : 'Free'}
          </span>
        </div>

        {/* Content cards */}
        <div style={stackStyle}>
          <DetailPresenterCard speakerName={workshop.speakerName} />
          <DetailDescriptionCard description={workshop.description} />
          <DetailRoomCard
            location={workshop.location}
            capacity={workshop.capacity}
            roomLayoutUrl={workshop.roomLayoutUrl}
          />
          <DetailSummaryCard summary={workshop.aiSummary} hasPdf={workshop.hasPdf} />
        </div>
      </div>

      {/* Sticky register footer */}
      <div style={stickyFooterStyle}>
        {regError && <p style={regErrorStyle}>{regError}</p>}
        <RegisterButton
          stage={stage}
          registering={registering}
          isPaid={isPaid}
          price={workshop.price}
          regOpen={regOpen}
          onClick={handleRegisterClick}
        />
      </div>

      {/* Free-workshop confirm dialog */}
      {showConfirm && (
        <div style={overlayStyle} onClick={() => !registering && setShowConfirm(false)}>
          <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={dialogTitleStyle}>Confirm Registration</h3>
            <p style={dialogBodyStyle}>
              Register for <strong>{workshop.title}</strong>?
            </p>
            <p style={dialogMetaStyle}>
              {formatDate(workshop.startTime)} · {formatTime(workshop.startTime)}
              {workshop.location ? ` · ${workshop.location}` : ''}
            </p>
            {regError && <p style={regErrorStyle}>{regError}</p>}
            <div style={dialogActionsStyle}>
              <button
                style={cancelBtnStyle}
                disabled={registering}
                onClick={() => { setShowConfirm(false); setRegError(null); }}
              >
                Cancel
              </button>
              <button
                style={confirmBtnStyle(registering)}
                disabled={registering}
                onClick={handleFreeConfirm}
              >
                {registering ? 'Confirming…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Register button — 4 stages
// ---------------------------------------------------------------------------
interface RegisterButtonProps {
  stage: Stage;
  registering: boolean;
  isPaid: boolean;
  price: number | string;
  regOpen: Date | null;
  onClick: () => void;
}

const RegisterButton: React.FC<RegisterButtonProps> = ({
  stage, registering, isPaid, price, regOpen, onClick,
}) => {
  const isActive = stage === 'register' && !registering;

  let label: string;
  switch (stage) {
    case 'register':
      label = registering
        ? 'Processing…'
        : isPaid
          ? `Register — ${Number(price).toLocaleString()} VND`
          : 'Register — Free';
      break;
    case 'registered':  label = 'Registered'; break;
    case 'upcoming':
      label = regOpen
        ? `Opens ${regOpen.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : 'Upcoming';
      break;
    case 'full':        label = 'Fully Booked'; break;
    case 'closed':      label = 'Registration Closed'; break;
  }

  return (
    <button
      style={registerBtnStyle(stage, registering)}
      disabled={!isActive}
      onClick={isActive ? onClick : undefined}
    >
      {label}
    </button>
  );
};

function registerBtnStyle(stage: Stage, loading: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '100%',
    maxWidth: '480px',
    padding: '16px',
    borderRadius: '14px',
    border: 'none',
    fontSize: '17px',
    fontWeight: 700,
    cursor: 'default',
    transition: 'opacity 0.15s',
    opacity: loading ? 0.7 : 1,
    fontFamily: 'var(--sans)',
  };
  switch (stage) {
    case 'register':
      return { ...base, backgroundColor: loading ? 'var(--border)' : 'var(--accent)', color: loading ? 'var(--text)' : '#fff', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(170,59,255,0.35)' };
    case 'registered':
      return { ...base, backgroundColor: 'var(--success-bg)', color: 'var(--success)' };
    case 'upcoming':
      return { ...base, backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border, var(--accent))' };
    default:
      return { ...base, backgroundColor: 'var(--border)', color: 'var(--text)' };
  }
}

// ---------------------------------------------------------------------------
// Tiny inline SVG icons
// ---------------------------------------------------------------------------
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const PeopleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const pageContainer: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  paddingTop: '8px',
  paddingBottom: '110px',
};

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-h)',
  cursor: 'pointer',
  padding: 0,
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 800,
  color: 'var(--text-h)',
  margin: '0 0 14px 0',
  lineHeight: 1.2,
  letterSpacing: '-0.4px',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginBottom: '12px',
};

const metaChipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--text)',
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  padding: '4px 12px',
};

const badgesRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginBottom: '28px',
};

const seatsBadgeStyle = (isFull: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '13px',
  fontWeight: 600,
  padding: '5px 12px',
  borderRadius: '999px',
  backgroundColor: isFull ? 'var(--error-bg)' : 'var(--success-bg)',
  color: isFull ? 'var(--error)' : 'var(--success)',
});

const priceBadgeStyle = (isPaid: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '13px',
  fontWeight: 700,
  padding: '5px 14px',
  borderRadius: '999px',
  backgroundColor: isPaid ? 'var(--social-bg, #f3f4f6)' : 'var(--accent-bg)',
  color: isPaid ? 'var(--text-h)' : 'var(--accent)',
  border: `1px solid ${isPaid ? 'var(--border)' : 'var(--accent-border, var(--accent))'}`,
});

const stackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const stickyFooterStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '12px 20px',
  paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
  backgroundColor: 'var(--bg)',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  zIndex: 100,
};

const regErrorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: 'var(--error)',
  textAlign: 'center',
};

const statusStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  textAlign: 'center',
  fontFamily: 'var(--sans)',
  padding: '20px',
};

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '16px',
  padding: '28px',
  maxWidth: '380px',
  width: '90%',
  boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
};

const dialogTitleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--text-h)',
};

const dialogBodyStyle: React.CSSProperties = {
  margin: '0 0 6px',
  fontSize: '15px',
  color: 'var(--text-h)',
  lineHeight: 1.5,
};

const dialogMetaStyle: React.CSSProperties = {
  margin: '0 0 20px',
  fontSize: '13px',
  color: 'var(--text)',
};

const dialogActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '9px 20px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: 'transparent',
  color: 'var(--text)',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
};

const confirmBtnStyle = (loading: boolean): React.CSSProperties => ({
  padding: '9px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'var(--accent)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
  fontFamily: 'var(--sans)',
});

export default WorkshopDetail;
