import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { createQueueItem, enqueue } from '../../lib/offlineQueue';

type ScanMode = 'camera' | 'manual';

type CheckInStatus =
  | 'CHECKED_IN'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_QR'
  | 'WRONG_WORKSHOP'
  | 'NOT_CONFIRMED'
  | 'QUEUED_OFFLINE'
  | 'QUEUED_NETWORK';

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
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const {
    items: queueItems,
    pendingCount,
    failedCount,
    isSyncing,
    retryItem,
    syncNow,
  } = useOfflineSync();

  const isBusy = isLoading || result !== null;
  const resolvedWorkshopTitle = workshopTitle || 'Selected workshop';
  const resolvedWorkshopId = workshopId || '';

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

  const queueScan = useCallback(
    (qrToken: string, reason: 'offline' | 'network') => {
      enqueue(
        createQueueItem({
          qrToken,
          workshopId: resolvedWorkshopId,
          workshopTitle: resolvedWorkshopTitle,
        }),
      );

      if (mountedRef.current) {
        setResult({
          success: true,
          status: reason === 'offline' ? 'QUEUED_OFFLINE' : 'QUEUED_NETWORK',
          message:
            reason === 'offline'
              ? 'Queued (offline) - will sync when connected'
              : 'Network error - scan queued for sync',
          workshopTitle: resolvedWorkshopTitle,
        });
      }

      if (reason === 'network' && isOnline) {
        void syncNow();
      }
    },
    [isOnline, resolvedWorkshopId, resolvedWorkshopTitle, syncNow],
  );

  const verifyToken = useCallback(
    async (token: string) => {
      const qrToken = token.trim();
      if (!qrToken || isBusy) return;

      setManualError(null);

      if (!isOnline) {
        queueScan(qrToken, 'offline');
        setManualToken('');
        return;
      }

      setIsLoading(true);

      try {
        const payload: VerifyCheckInRequest = {
          qrToken,
          ...(workshopId ? { workshopId } : {}),
        };
        const response = await api.post<VerifyCheckInResponse>('/check-ins/verify', payload);
        if (mountedRef.current) {
          setResult(response.data);
        }
      } catch (error) {
        if (!mountedRef.current) return;

        if (isNetworkError(error)) {
          queueScan(qrToken, 'network');
        } else {
          setResult(getApiErrorResult(error));
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          setManualToken('');
        }
      }
    },
    [isBusy, isOnline, queueScan, workshopId],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (pendingCount > 0) {
        void syncNow();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingCount, syncNow]);

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
          &lt;
        </button>
        <div>
          <h1 style={titleStyle}>{workshopTitle || 'Scan Ticket'}</h1>
          <p style={subtitleStyle}>Staff check-in</p>
        </div>
      </header>

      {!isOnline && (
        <div style={offlineBannerStyle}>You're offline - scans are queued locally</div>
      )}

      <section style={queueSummaryStyle}>
        <div style={queueBadgeStyle}>
          Queue: {pendingCount} pending | {failedCount} failed
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          fullWidth={false}
          onClick={() => setIsQueueOpen((open) => !open)}
        >
          {isQueueOpen ? 'Hide Queue' : 'Show Queue'}
        </Button>
      </section>

      {isQueueOpen && (
        <section style={queuePanelStyle}>
          <div style={queuePanelHeaderStyle}>
            <h2 style={queuePanelTitleStyle}>Offline Queue</h2>
            <Button
              type="button"
              size="sm"
              fullWidth={false}
              loading={isSyncing}
              loadingText="Syncing..."
              disabled={pendingCount === 0}
              onClick={() => void syncNow()}
            >
              Sync Now
            </Button>
          </div>

          {queueItems.length === 0 ? (
            <p style={emptyQueueStyle}>No queued scans.</p>
          ) : (
            <div style={queueListStyle}>
              {queueItems.map((item) => (
                <article key={item.id} style={queueItemStyle}>
                  <div>
                    <h3 style={queueItemTitleStyle}>{item.workshopTitle || 'Workshop'}</h3>
                    <p style={queueItemMetaStyle}>{formatDateTime(item.localTimestamp)}</p>
                    {item.failureReason && (
                      <p style={queueFailureStyle}>{item.failureReason}</p>
                    )}
                  </div>
                  <div style={queueItemActionsStyle}>
                    <span style={queueStatusStyle(item.syncStatus)}>{item.syncStatus}</span>
                    {item.syncStatus === 'failed' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        fullWidth={false}
                        onClick={() => retryItem(item.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

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

function isNetworkError(error: unknown) {
  return isAxiosError(error) && !error.response;
}

function getApiErrorResult(error: unknown): VerifyCheckInResponse {
  if (isAxiosError(error) && error.response?.data && typeof error.response.data === 'object') {
    const data = error.response.data as Partial<VerifyCheckInResponse> & { message?: string };
    if (typeof data.status === 'string' && typeof data.message === 'string') {
      return {
        success: Boolean(data.success),
        status: data.status as CheckInStatus,
        message: data.message,
        studentName: data.studentName,
        workshopTitle: data.workshopTitle,
        checkedInAt: data.checkedInAt,
      };
    }
  }

  return {
    success: false,
    status: 'INVALID_QR',
    message: 'QR code not recognized',
  };
}

function getResultView(result: VerifyCheckInResponse) {
  const checkedInAt = result.checkedInAt
    ? new Date(result.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  switch (result.status) {
    case 'CHECKED_IN':
      return {
        icon: 'OK',
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
    case 'QUEUED_OFFLINE':
    case 'QUEUED_NETWORK':
      return {
        icon: '...',
        color: '#2563eb',
        title: 'Queued',
        message: result.message,
        workshopTitle: result.workshopTitle,
      };
    case 'WRONG_WORKSHOP':
      return {
        icon: 'X',
        color: '#dc2626',
        title: 'Wrong workshop',
        message: 'Ticket is for a different workshop',
        workshopTitle: result.workshopTitle,
      };
    case 'NOT_CONFIRMED':
      return {
        icon: 'X',
        color: '#dc2626',
        title: 'Not confirmed',
        message: result.message,
        workshopTitle: result.workshopTitle,
      };
    case 'INVALID_QR':
    default:
      return {
        icon: 'X',
        color: '#dc2626',
        title: 'Invalid QR',
        message: 'QR code not recognized',
        workshopTitle: result.workshopTitle,
      };
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const offlineBannerStyle: React.CSSProperties = {
  padding: '12px',
  marginBottom: '12px',
  borderRadius: '8px',
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  color: '#92400e',
  fontWeight: 700,
  textAlign: 'center',
};

const queueSummaryStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  marginBottom: '12px',
};

const queueBadgeStyle: React.CSSProperties = {
  flex: 1,
  minHeight: '40px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  color: 'var(--text-h)',
  fontWeight: 700,
  fontSize: '14px',
};

const queuePanelStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '16px',
  backgroundColor: 'var(--bg)',
};

const queuePanelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  marginBottom: '10px',
};

const queuePanelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-h)',
  fontSize: '16px',
};

const emptyQueueStyle: React.CSSProperties = {
  margin: '8px 0',
  color: 'var(--text)',
};

const queueListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const queueItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '10px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
};

const queueItemTitleStyle: React.CSSProperties = {
  margin: 0,
  color: 'var(--text-h)',
  fontSize: '14px',
  lineHeight: 1.3,
};

const queueItemMetaStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--text)',
  fontSize: '12px',
};

const queueFailureStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#dc2626',
  fontSize: '12px',
  fontWeight: 700,
};

const queueItemActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '8px',
};

const queueStatusStyle = (status: CheckInStatus | 'pending' | 'synced' | 'failed'): React.CSSProperties => {
  const colors = {
    pending: { backgroundColor: '#eff6ff', color: '#2563eb' },
    synced: { backgroundColor: '#f0fdf4', color: '#16a34a' },
    failed: { backgroundColor: '#fef2f2', color: '#dc2626' },
  };

  return {
    ...(status in colors ? colors[status as keyof typeof colors] : colors.pending),
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'capitalize',
  };
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
  fontSize: '44px',
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
