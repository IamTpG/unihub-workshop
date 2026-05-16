import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { RegStatus } from '@unihub/shared';
import { Button } from '../../components/ui/Button';

const MockPaymentGateway: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    currentRegistration: registration, 
    isLoading, 
    error, 
    fetchRegistration,
    simulatePayment,
    clearError
  } = useRegistrationStore();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRegistration(id).catch(() => {});
    }
  }, [id, fetchRegistration]);

  const pollStatus = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 5;
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const updated = await fetchRegistration(id!);
        if (updated.status !== RegStatus.HOLDING) {
          clearInterval(interval);
          navigate(`/my-registrations/${id}/result`, { 
            state: { success: updated.status === RegStatus.PAID } 
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsProcessing(false);
          navigate(`/my-registrations/${id}/result`, { 
            state: { success: false, timeout: true } 
          });
        }
      } catch {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 1500);
  }, [id, fetchRegistration, navigate]);

  const handleSimulate = useCallback(async (type: 'SUCCESS' | 'FAILURE') => {
    if (!registration || !registration.paymentRef) return;
    
    setIsProcessing(true);
    clearError();
    
    try {
      const eventType = type === 'SUCCESS' ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED';
      const timestamp = Date.now();
      await simulatePayment({
        eventType,
        intentId: registration.paymentRef,
        eventId: `mock_${timestamp}`,
      });

      // Start Polling
      await pollStatus();
    } catch {
      setIsProcessing(false);
    }
  }, [registration, clearError, simulatePayment, pollStatus]);

  if (isLoading) return <div style={centerStyle}>Loading simulation...</div>;

  return (
    <div style={containerStyle}>
      <div style={gatewayBoxStyle}>
        <div style={badgeStyle}>TEST MODE</div>
        <h1 style={titleStyle}>Mock Payment Gateway</h1>
        <p style={subtitleStyle}>This is a simulation for development purposes.</p>
        
        <div style={amountStyle}>
          <span style={labelStyle}>PAYING TO UNIHUB</span>
          <span style={valueStyle}>${registration?.workshop.price}</span>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={buttonGroupStyle}>
          <Button 
            fullWidth 
            onClick={() => handleSimulate('SUCCESS')}
            disabled={isProcessing}
          >
            {isProcessing ? 'Verifying...' : 'Simulate Success'}
          </Button>
          <div style={{ height: '8px' }} />
          <Button 
            variant="secondary"
            fullWidth 
            onClick={() => handleSimulate('FAILURE')}
            disabled={isProcessing}
          >
            {isProcessing ? 'Verifying...' : 'Simulate Failure'}
          </Button>
        </div>
        
        <button 
          onClick={() => navigate(-1)} 
          style={cancelButtonStyle}
          disabled={isProcessing}
        >
          Cancel and go back
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  fontFamily: 'sans-serif',
};

const gatewayBoxStyle: React.CSSProperties = {
  backgroundColor: 'white',
  width: '100%',
  maxWidth: '400px',
  padding: '40px 30px',
  borderRadius: '24px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  textAlign: 'center',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#ef4444',
  color: 'white',
  fontSize: '11px',
  fontWeight: 800,
  padding: '4px 12px',
  borderRadius: '999px',
  marginBottom: '20px',
  letterSpacing: '0.05em',
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#1e293b',
  margin: '0 0 8px 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  marginBottom: '32px',
};

const amountStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  padding: '24px',
  borderRadius: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '32px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#94a3b8',
  letterSpacing: '0.05em',
};

const valueStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 800,
  color: '#0f172a',
};

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '14px',
  marginBottom: '20px',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '24px',
};

const cancelButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};

const centerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  fontFamily: 'sans-serif',
  color: '#64748b',
};

export default MockPaymentGateway;
