import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

type ScanMode = 'camera' | 'manual';

type CheckInStatus =
  | 'CHECKED_IN'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_QR'
  | 'WRONG_WORKSHOP'
  | 'NOT_CONFIRMED';

interface VerifyCheckInRequest {
  qrToken: string;
  workshopId?: string;
}

interface VerifyCheckInResponse {
  success: boolean;
  status: CheckInStatus;
  message: string;
  studentName?: string;
  workshopTitle?: string;
  checkedInAt?: string;
}

interface ScanRouteState {
  workshopId?: string;
  workshopTitle?: string;
}

const scannerElementId = 'staff-qr-reader';

const StaffScan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state || {}) as ScanRouteState;
  const { workshopId, workshopTitle } = routeState;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);

  const [mode, setMode] = useState<ScanMode>('camera');
  const [manualToken, setManualToken] = useState('');
  const [result, setResult] = useState<VerifyCheckInResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  const isBusy = isLoading || result !== null;

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      // Scanner cleanup can fail if camera init never completed.
    } finally {
      scannerRef.current = null;
    }
  }, []);

  const verifyToken = useCallback(
    async (token: string) => {
      const qrToken = token.trim();
      if (!qrToken || isBusy) return;

      setIsLoading(true);
      setManualError(null);

      try {
        const payload: VerifyCheckInRequest = {
          qrToken,
          ...(workshopId ? { workshopId } : {}),
        };
        const response = await api.post<VerifyCheckInResponse>('/check-ins/verify', payload);
        if (mountedRef.current) {
          setResult(response.data);
        }
      } catch {
        if (mountedRef.current) {
          setResult({
            success: false,
            status: 'INVALID_QR',
            message: 'QR code not recognized',
          });
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setManualToken('');
        }
      }
    },
    [isBusy, workshopId],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (mode !== 'camera' || isBusy) {
      void stopScanner();
      return;
    }

    const startScanner = async () => {
      await stopScanner();
      setCameraError(null);

      try {
        const scanner = new Html5Qrcode(scannerElementId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            void verifyToken(decodedText);
          },
          () => {},
        );
      } catch {
        if (mountedRef.current) {
          setCameraError('Camera unavailable. Use manual input instead.');
        }
      }
    };

    void startScanner();

    return () => {
      void stopScanner();
    };
  }, [mode, isBusy, stopScanner, verifyToken]);

  useEffect(() => {
    if (!result) return;

    const timer = window.setTimeout(() => {
      setResult(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [result]);

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualToken.trim()) {
      setManualError('Enter a QR token first.');
      return;
    }

    void verifyToken(manualToken);
  };

  const resultView = result ? getResultView(result) : null;

  return (
    <div style={pageStyle}>
      <header style={topBarStyle}>
        <button type="button" onClick={() => navigate('/manage')} style={backButtonStyle}>
          &larr;
        </button>
        <div>
          <h1 style={titleStyle}>{workshopTitle || 'Scan Ticket'}</h1>
          <p style={subtitleStyle}>Staff check-in</p>
        </div>
      </header>

      <div style={toggleStyle}>
        <button
          type="button"
          onClick={() => setMode('camera')}
          style={toggleButtonStyle(mode === 'camera')}
        >
          Camera
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          style={toggleButtonStyle(mode === 'manual')}
        >
          Manual
        </button>
      </div>

      {mode === 'camera' ? (
        <section style={scannerPanelStyle}>
          <div id={scannerElementId} style={scannerBoxStyle} />
          {cameraError && <Alert variant="error" message={cameraError} />}
        </section>
      ) : (
        <form onSubmit={handleManualSubmit} style={manualPanelStyle}>
          <Input
            label="QR token"
            value={manualToken}
            onChange={(event) => setManualToken(event.target.value)}
            placeholder="Paste or type ticket token"
            disabled={isBusy}
          />
          {manualError && <Alert variant="error" message={manualError} />}
          <Button type="submit" disabled={isBusy} loading={isLoading} loadingText="Checking...">
            Check In
          </Button>
        </form>
      )}

      {isLoading && (
        <div style={loadingCardStyle}>
          <div style={spinnerStyle} />
          <span>Verifying ticket...</span>
        </div>
      )}

      {resultView && (
        <div style={resultOverlayStyle}>
          <div style={{ ...resultCardStyle, borderColor: resultView.color }}>
            <div style={{ ...resultIconStyle, color: resultView.color }}>{resultView.icon}</div>
            <h2 style={resultTitleStyle}>{resultView.title}</h2>
            <p style={resultMessageStyle}>{resultView.message}</p>
            {resultView.workshopTitle && (
              <p style={resultMetaStyle}>{resultView.workshopTitle}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function getResultView(result: VerifyCheckInResponse) {
  const checkedInAt = result.checkedInAt
    ? new Date(result.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  switch (result.status) {
    case 'CHECKED_IN':
      return {
        icon: '✓',
        color: '#16a34a',
        title: `Welcome, ${result.studentName || 'attendee'}!`,
        message: 'Check-in complete.',
        workshopTitle: result.workshopTitle,
      };
    case 'ALREADY_CHECKED_IN':
      return {
        icon: '!',
        color: '#d97706',
        title: 'Already checked in',
        message: checkedInAt ? `Already checked in at ${checkedInAt}` : result.message,
        workshopTitle: result.workshopTitle,
      };
    case 'WRONG_WORKSHOP':
      return {
        icon: '×',
        color: '#dc2626',
        title: 'Wrong workshop',
        message: 'Ticket is for a different workshop',
        workshopTitle: result.workshopTitle,
      };
    case 'NOT_CONFIRMED':
      return {
        icon: '×',
        color: '#dc2626',
        title: 'Not confirmed',
        message: result.message,
        workshopTitle: result.workshopTitle,
      };
    case 'INVALID_QR':
    default:
      return {
        icon: '×',
        color: '#dc2626',
        title: 'Invalid QR',
        message: 'QR code not recognized',
        workshopTitle: result.workshopTitle,
      };
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: '16px',
  textAlign: 'left',
  fontFamily: 'var(--sans)',
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  marginBottom: '18px',
};

const backButtonStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg)',
  color: 'var(--text-h)',
  fontSize: '22px',
  fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '22px',
  color: 'var(--text-h)',
  lineHeight: 1.2,
};

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--text)',
  fontSize: '14px',
};

const toggleStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  padding: '4px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  marginBottom: '16px',
};

const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
  minHeight: '48px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: active ? 'var(--accent)' : 'transparent',
  color: active ? '#fff' : 'var(--text-h)',
  fontWeight: 700,
  fontSize: '15px',
});

const scannerPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const scannerBoxStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '320px',
  overflow: 'hidden',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: '#000',
};

const manualPanelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const loadingCardStyle: React.CSSProperties = {
  marginTop: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  minHeight: '64px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
};

const spinnerStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  border: '2px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const resultOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  zIndex: 1000,
};

const resultCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '380px',
  backgroundColor: 'var(--bg)',
  borderRadius: '8px',
  border: '3px solid',
  padding: '32px 24px',
  textAlign: 'center',
};

const resultIconStyle: React.CSSProperties = {
  fontSize: '64px',
  fontWeight: 900,
  lineHeight: 1,
  marginBottom: '14px',
};

const resultTitleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-h)',
  fontSize: '26px',
};

const resultMessageStyle: React.CSSProperties = {
  margin: '12px 0 0',
  color: 'var(--text)',
  fontSize: '17px',
  lineHeight: 1.5,
};

const resultMetaStyle: React.CSSProperties = {
  margin: '14px 0 0',
  color: 'var(--text)',
  fontSize: '13px',
  fontWeight: 700,
};

if (typeof document !== 'undefined' && !document.getElementById('staff-scan-spinner')) {
  const style = document.createElement('style');
  style.id = 'staff-scan-spinner';
  style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

export default StaffScan;
