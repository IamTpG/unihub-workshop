import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiWorkshop } from '../../stores/workshopStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useWorkshopStore } from '../../stores/workshopStore';
import { formatTime } from '../../utils/date';

interface WorkshopCardProps {
  workshop: ApiWorkshop;
}

type Stage = 'upcoming' | 'register' | 'full' | 'registered' | 'closed';

function getStage(
  workshop: ApiWorkshop,
  isRegistered: boolean,
): Stage {
  if (isRegistered) return 'registered';

  const now = new Date();
  const regOpen = workshop.registrationOpenAt ? new Date(workshop.registrationOpenAt) : null;
  const regClose = workshop.registrationCloseAt ? new Date(workshop.registrationCloseAt) : null;

  // Closed = past end of registration window
  if (regClose && now > regClose) return 'closed';
  // Upcoming = before window opens
  if (regOpen && now < regOpen) return 'upcoming';
  // During registration window
  if (workshop.availableSlots === 0) return 'full';
  return 'register';
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop }) => {
  const navigate = useNavigate();
  const { registerForWorkshop, pollForRegistration, registeredWorkshopIds } = useRegistrationStore();
  const { fetchWorkshops } = useWorkshopStore();

  const [titleHovered, setTitleHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const isRegistered = registeredWorkshopIds.includes(workshop.id);
  const stage = getStage(workshop, isRegistered);
  const isPaid = Number(workshop.price) > 0;

  const date = new Date(workshop.startTime);
  const dayAbbrev = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = date.getDate();
  const monthAbbrev = date.toLocaleDateString('en-US', { month: 'short' });

  async function handleFreeConfirm() {
    setRegistering(true);
    setRegError(null);
    try {
      await registerForWorkshop(workshop.id);
      fetchWorkshops();
      setShowConfirm(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      setRegError(msg);
      setRegistering(false);
    }
    // On success we stay mounted (no navigation), so clear loading state
    setRegistering(false);
  }

  async function handlePaidRegister() {
    setRegistering(true);
    setRegError(null);
    try {
      await registerForWorkshop(workshop.id);
      // Slot decremented in Redis; now wait for the worker to create the
      // HOLDING registration so we have the ID to navigate to the pay page.
      const registrationId = await pollForRegistration(workshop.id);
      fetchWorkshops();
      navigate(
        registrationId
          ? `/my-registrations/${registrationId}/pay`
          : '/my-registrations',
      );
      // Don't clear registering — we're navigating away
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      setRegError(msg);
      setRegistering(false);
    }
  }

  function handleRegisterClick() {
    setRegError(null);
    if (isPaid) {
      handlePaidRegister();
    } else {
      setShowConfirm(true);
    }
  }

  return (
    <>
      <div style={cardStyle}>
        {/* Date column */}
        <div style={dateColStyle}>
          <span style={dayAbbrStyle}>{dayAbbrev}</span>
          <span style={dayNumStyle}>{dayNum}</span>
          <span style={monthStyle}>{monthAbbrev}</span>
        </div>

        <div style={dividerStyle} />

        {/* Main content */}
        <div style={contentStyle}>
          <p
            style={{ ...titleStyle, textDecorationColor: titleHovered ? 'var(--accent)' : 'transparent' }}
            onClick={() => navigate(`/workshops/${workshop.id}`)}
            onMouseEnter={() => setTitleHovered(true)}
            onMouseLeave={() => setTitleHovered(false)}
          >
            {workshop.title}
          </p>
          <p style={metaStyle}>
            {formatTime(workshop.startTime)}
            {workshop.endTime ? ` – ${formatTime(workshop.endTime)}` : ''}
            {workshop.location ? ` · ${workshop.location}` : ''}
            {workshop.speakerName ? ` · ${workshop.speakerName}` : ''}
          </p>
        </div>

        {/* Right section */}
        <div style={rightSectionStyle}>
          <div style={badgeRowStyle}>
            <span style={seatsBadgeStyle(workshop.availableSlots === 0)}>
              {workshop.availableSlots === 0 ? 'Full' : `${workshop.availableSlots} left`}
            </span>
            <span style={priceBadgeStyle(isPaid)}>
              {isPaid ? `${Number(workshop.price).toLocaleString()} VND` : 'Free'}
            </span>
          </div>

          <StageButton
            stage={stage}
            registering={registering}
            onClick={handleRegisterClick}
          />

          {regError && <p style={errorStyle}>{regError}</p>}
        </div>
      </div>

      {/* Confirmation dialog — free workshops only */}
      {showConfirm && (
        <div style={overlayStyle} onClick={() => !registering && setShowConfirm(false)}>
          <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={dialogTitleStyle}>Confirm Registration</h3>
            <p style={dialogBodyStyle}>
              Register for <strong>{workshop.title}</strong>?
            </p>
            <p style={dialogMetaStyle}>
              {new Date(workshop.startTime).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
              {' · '}
              {formatTime(workshop.startTime)}
              {workshop.location ? ` · ${workshop.location}` : ''}
            </p>
            {regError && <p style={errorStyle}>{regError}</p>}
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
// Stage button
// ---------------------------------------------------------------------------
interface StageButtonProps {
  stage: Stage;
  registering: boolean;
  onClick: () => void;
}

const STAGE_LABELS: Record<Stage, string> = {
  upcoming: 'Upcoming',
  register: 'Register',
  full: 'Full',
  registered: 'Registered',
  closed: 'Closed',
};

const StageButton: React.FC<StageButtonProps> = ({ stage, registering, onClick }) => {
  const isActive = stage === 'register' && !registering;
  const label = registering ? '…' : STAGE_LABELS[stage];

  return (
    <button
      style={stageBtnStyle(stage, registering)}
      disabled={!isActive}
      onClick={isActive ? onClick : undefined}
    >
      {label}
    </button>
  );
};

function stageBtnStyle(stage: Stage, loading: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    padding: '5px 14px',
    borderRadius: '8px',
    border: 'none',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
    opacity: loading ? 0.6 : 1,
  };

  switch (stage) {
    case 'register':
      return {
        ...base,
        backgroundColor: loading ? 'var(--border)' : 'var(--accent)',
        color: loading ? 'var(--text)' : '#fff',
        cursor: loading ? 'not-allowed' : 'pointer',
      };
    case 'registered':
      return {
        ...base,
        backgroundColor: 'var(--success-bg)',
        color: 'var(--success)',
        cursor: 'default',
      };
    case 'upcoming':
      return {
        ...base,
        backgroundColor: 'var(--accent-bg)',
        color: 'var(--accent)',
        cursor: 'default',
        border: '1px solid var(--accent-border, var(--accent))',
      };
    case 'closed':
    case 'full':
      return {
        ...base,
        backgroundColor: 'var(--border)',
        color: 'var(--text)',
        cursor: 'default',
      };
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const cardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '12px 16px',
  boxShadow: 'var(--shadow)',
  minHeight: '68px',
};

const dateColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '36px',
  flexShrink: 0,
};

const dayAbbrStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  color: 'var(--accent)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  lineHeight: 1.2,
};

const dayNumStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text-h)',
  lineHeight: 1.1,
};

const monthStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 500,
  color: 'var(--text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  lineHeight: 1.2,
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  alignSelf: 'stretch',
  backgroundColor: 'var(--border)',
  margin: '0 14px',
  flexShrink: 0,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--accent)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  cursor: 'pointer',
  textDecoration: 'underline',
  textDecorationColor: 'transparent',
  textUnderlineOffset: '2px',
  transition: 'text-decoration-color 0.15s',
};

const metaStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: 'var(--text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const rightSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '6px',
  flexShrink: 0,
  marginLeft: '12px',
};

const badgeRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
};

const seatsBadgeStyle = (isFull: boolean): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: '999px',
  backgroundColor: isFull ? 'var(--error-bg)' : 'var(--success-bg)',
  color: isFull ? 'var(--error)' : 'var(--success)',
  whiteSpace: 'nowrap',
});

const priceBadgeStyle = (isPaid: boolean): React.CSSProperties => ({
  fontSize: '11px',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: '999px',
  backgroundColor: isPaid ? 'var(--social-bg, #f3f4f6)' : 'var(--accent-bg)',
  color: isPaid ? 'var(--text-h)' : 'var(--accent)',
  border: `1px solid ${isPaid ? 'var(--border)' : 'var(--accent-border, var(--accent))'}`,
  whiteSpace: 'nowrap',
});

const errorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '11px',
  color: 'var(--error)',
  maxWidth: '160px',
  textAlign: 'right',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
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
});
