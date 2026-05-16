import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { QRCodeSVG } from 'qrcode.react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusState } from '../../components/ui/StatusState';
import { WorkshopBrief } from '../../components/workshop/WorkshopBrief';

const TicketQR: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentRegistration: registration, isLoading, error, fetchRegistration } = useRegistrationStore();

  useEffect(() => {
    if (id) {
      fetchRegistration(id).catch(() => {});
    }
  }, [id, fetchRegistration]);

  if (isLoading) return <StatusState type="loading" message="Loading ticket..." />;

  if (error || !registration) {
    return (
      <StatusState 
        type="error" 
        message={error || 'Ticket not found'} 
        onRetry={() => id && fetchRegistration(id)}
      />
    );
  }

  const { workshop, qrStub } = registration;

  return (
    <div style={containerStyle}>
      <PageHeader title="Your Ticket" backPath="/my-registrations" />

      <div style={ticketCardStyle}>
        <div style={workshopInfoStyle}>
          <WorkshopBrief 
            title={workshop.title} 
            startTime={workshop.startTime} 
          />
        </div>

        <div style={qrContainerStyle}>
          {qrStub ? (
            <div style={qrWrapperStyle}>
              <QRCodeSVG 
                value={qrStub} 
                size={220} 
                level="H"
                includeMargin={true}
              />
              <p style={qrHintStyle}>Show this QR at the entrance</p>
            </div>
          ) : (
            <div style={noQrStyle}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎟️</div>
              <p style={{ fontWeight: 700, color: 'var(--text-h)', marginBottom: '8px' }}>QR Code not generated yet.</p>
              <p style={{ fontSize: '14px', color: 'var(--text)' }}>It will appear once payment is fully processed.</p>
            </div>
          )}
        </div>

        <div style={footerStyle}>
          <div style={infoRowStyle}>
            <span>Attendee:</span>
            <span style={boldStyle}>You</span>
          </div>
          <div style={infoRowStyle}>
            <span>Ticket ID:</span>
            <span style={monoStyle}>{registration.id.toUpperCase()}</span>
          </div>
        </div>
      </div>
      
      <p style={helpTextStyle}>
        Admission is subject to workshop capacity and rules. 
        Please arrive 10 minutes early.
      </p>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: '20px',
  fontFamily: 'var(--sans)',
  minHeight: '100vh',
};

const ticketCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '24px',
  overflow: 'hidden',
  border: '1px solid var(--border)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
};

const workshopInfoStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: 'var(--accent-bg)',
  borderBottom: '1px dashed var(--border)',
};

const qrContainerStyle: React.CSSProperties = {
  padding: '40px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const qrWrapperStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '16px',
  borderRadius: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
};

const qrHintStyle: React.CSSProperties = {
  marginTop: '16px',
  fontSize: '13px',
  color: '#666',
  fontWeight: 600,
};

const noQrStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
};

const footerStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: 'rgba(0,0,0,0.02)',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '14px',
  color: 'var(--text)',
};

const boldStyle: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--text-h)',
};

const monoStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '11px',
  color: 'var(--text)',
  wordBreak: 'break-all',
};

const helpTextStyle: React.CSSProperties = {
  marginTop: '24px',
  fontSize: '13px',
  color: 'var(--text)',
  textAlign: 'center',
  lineHeight: '1.5',
  padding: '0 20px',
};

export default TicketQR;
