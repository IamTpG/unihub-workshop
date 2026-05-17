import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

const PaymentResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { success, timeout } = location.state || { success: false, timeout: false };

  return (
    <div style={containerStyle}>
      <div style={resultBoxStyle}>
        {timeout ? (
          <>
            <div style={{ ...iconCircleStyle, backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }}>
              <span role="img" aria-label="processing">⏳</span>
            </div>
            <h1 style={titleStyle}>Still Processing</h1>
            <p style={subtitleStyle}>
              The payment is being verified by the gateway. Please check back in "My Registrations" in a few minutes.
            </p>
          </>
        ) : success ? (
          <>
            <div style={{ ...iconCircleStyle, backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
              <span role="img" aria-label="success">✓</span>
            </div>
            <h1 style={titleStyle}>Payment Successful!</h1>
            <p style={subtitleStyle}>
              Your registration is now confirmed. You can find your ticket and QR code in the "Successful" tab.
            </p>
          </>
        ) : (
          <>
            <div style={{ ...iconCircleStyle, backgroundColor: 'var(--error-bg)', color: 'var(--error)' }}>
              <span role="img" aria-label="failed">✕</span>
            </div>
            <h1 style={titleStyle}>Payment Failed</h1>
            <p style={subtitleStyle}>
              The transaction could not be completed. Your seat reservation has been released — you can register again when you're ready.
            </p>
          </>
        )}

        <div style={buttonContainerStyle}>
          {!success && !timeout && (
            <Button fullWidth onClick={() => navigate('/workshops')}>
              Try Again
            </Button>
          )}
          <div style={{ marginTop: success || timeout ? '0' : '12px' }}>
            <Button
              variant={success || timeout ? 'primary' : 'secondary'}
              fullWidth
              onClick={() => navigate(success ? '/workshops' : '/my-registrations')}
            >
              {success ? 'Browse More Workshops' : timeout ? 'Back to My Registrations' : 'My Registrations'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: '40px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  fontFamily: 'var(--sans)',
};

const resultBoxStyle: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '360px',
  width: '100%',
};

const iconCircleStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '40px',
  margin: '0 auto 24px auto',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 800,
  color: 'var(--text-h)',
  margin: '0 0 12px 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  lineHeight: '1.6',
  margin: '0 0 32px 0',
};

const buttonContainerStyle: React.CSSProperties = {
  marginTop: '8px',
};

export default PaymentResult;
