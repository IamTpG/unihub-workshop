import React, { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface VerifyOtpFormProps {
  username: string;
  message?: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const VerifyOtpForm: React.FC<VerifyOtpFormProps> = ({ username, message, onBack, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { verifyOtp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      setError('Please enter your verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyOtp(username, otp.trim());
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
      setOtp('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <Input
        label="Verification Code (OTP)"
        type="text"
        value={otp}
        onChange={(e) => {
          const numericVal = e.target.value.replace(/\D/g, ''); // Retains only digit characters
          setOtp(numericVal);
        }}
        placeholder="Enter 6-digit code"
        style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px', fontWeight: 600 }}
        maxLength={6}
        autoFocus
        disabled={loading}
        error={error || undefined}
        inputMode="numeric"
        pattern="[0-9]*"
        headerRight={
          <button
            type="button"
            onClick={onBack}
            style={backButtonStyle}
            disabled={loading}
          >
            Change Username
          </button>
        }
      />
      {message && <span style={infoTextStyle}>{message}</span>}
      <Button 
        type="submit" 
        loading={loading} 
        loadingText="Validating session..."
      >
        Verify Code
      </Button>
    </form>
  );
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--accent)',
  fontSize: '12px',
  cursor: 'pointer',
  padding: 0,
};

const infoTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--accent)',
  marginTop: '-12px',
  textAlign: 'left',
};
