import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, type Role } from '../../stores/authStore';
import { Card } from '../../components/ui/Card';
import { LoginForm } from '../../components/auth/LoginForm';
import { VerifyOtpForm } from '../../components/auth/VerifyOtpForm';

const Login: React.FC = () => {
  const [step, setStep] = useState<'username' | 'otp'>('username');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const triggerRedirect = (role?: Role) => {
    if (from && from !== '/') {
      navigate(from, { replace: true });
    } else {
      switch (role) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'STAFF':
          navigate('/manage', { replace: true });
          break;
        case 'STUDENT':
        default:
          navigate('/workshops', { replace: true });
          break;
      }
    }
  };

  return (
    <div style={wrapperStyle}>
      <Card>
        <div style={headerStyle}>
          <h1 style={logoStyle}>UniHub</h1>
          <p style={{ color: 'var(--text)', margin: 0 }}>
            {step === 'username' ? 'Sign in to your account' : 'Verify your security code'}
          </p>
        </div>

        {step === 'username' ? (
          <LoginForm 
            onSuccess={(uname, successMsg) => {
              setUsername(uname);
              setMessage(successMsg);
              setStep('otp');
            }}
          />
        ) : (
          <VerifyOtpForm 
            username={username}
            message={message}
            onBack={() => {
              setMessage(null);
              setStep('username');
            }}
            onSuccess={() => {
              const activeRole = useAuthStore.getState().user?.role;
              triggerRedirect(activeRole);
            }}
          />
        )}
      </Card>
    </div>
  );
};

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--bg)',
  fontFamily: 'var(--sans)',
  padding: '20px',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '24px',
};

const logoStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 800,
  color: 'var(--accent)',
  margin: '0 0 8px 0',
};

export default Login;
