import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusState } from '../../components/ui/StatusState';
import { WorkshopBrief } from '../../components/workshop/WorkshopBrief';

const PaymentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRegistration: registration, isLoading, error, fetchRegistration } = useRegistrationStore();

  useEffect(() => {
    if (id) {
      fetchRegistration(id).catch(() => {});
    }
  }, [id, fetchRegistration]);

  if (isLoading) return <StatusState type="loading" message="Loading details..." />;

  if (error || !registration) {
    return (
      <StatusState 
        type="error" 
        message={error || 'Registration not found'} 
        onRetry={() => id && fetchRegistration(id)}
      />
    );
  }

  const { workshop, paymentRef } = registration;
  const isServiceUnavailable = !paymentRef;

  return (
    <div style={containerStyle}>
      <PageHeader title="Payment Details" backPath="/my-registrations" />

      <div style={infoCardStyle}>
        <WorkshopBrief 
          title={workshop.title} 
          startTime={workshop.startTime} 
        />

        <div style={dividerStyle} />

        <div style={sectionHeaderStyle}>Order Summary</div>
        <div style={priceRowStyle}>
          <span>Workshop Registration</span>
          <span>${workshop.price}</span>
        </div>
        <div style={priceRowStyle}>
          <span>Booking Fee</span>
          <span>$0.00</span>
        </div>
        <div style={totalRowStyle}>
          <span>Total Amount</span>
          <span>${workshop.price}</span>
        </div>
      </div>

      {isServiceUnavailable ? (
        <div style={warningBannerStyle}>
          <div style={{ fontSize: '20px' }}>⚠️</div>
          <div>
            <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>Payment service unavailable</p>
            <p style={{ fontSize: '13px', margin: 0 }}>
              We couldn't initialize a payment session. Please try again in a few minutes.
            </p>
          </div>
        </div>
      ) : (
        <div style={actionContainerStyle}>
          <div style={noteStyle}>
            <p><strong>Note:</strong> Your spot is held for a limited time. Please complete the payment to confirm your registration.</p>
          </div>
          <Button 
            fullWidth 
            size="lg" 
            onClick={() => navigate(`/my-registrations/${registration.id}/mock-pay`)}
          >
            Pay Now ${workshop.price}
          </Button>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: '20px',
  fontFamily: 'var(--sans)',
  minHeight: '100vh',
};

const infoCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '24px',
  padding: '24px',
  border: '1px solid var(--border)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  marginBottom: '24px',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '12px',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--border)',
  margin: '24px 0',
};

const priceRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '15px',
  color: 'var(--text)',
  marginBottom: '12px',
};

const totalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '18px',
  fontWeight: 800,
  color: 'var(--text-h)',
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid var(--border)',
};

const warningBannerStyle: React.CSSProperties = {
  backgroundColor: 'var(--error-bg)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '16px',
  display: 'flex',
  gap: '12px',
  color: 'var(--error)',
};

const actionContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const noteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text)',
  lineHeight: '1.5',
  backgroundColor: 'var(--accent-bg)',
  padding: '12px 16px',
  borderRadius: '12px',
};

export default PaymentDetails;
