import React, { useEffect } from 'react';
import { useWorkshopStore } from '../../stores/workshopStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { Button } from '../../components/ui/Button';
import { WorkshopCard } from '../../components/workshop/WorkshopCard';

const StudentHome: React.FC = () => {
  const { workshops, isLoading, error, fetchWorkshops } = useWorkshopStore();
  const { fetchRegistrations } = useRegistrationStore();

  useEffect(() => {
    fetchWorkshops();
    fetchRegistrations();
  }, [fetchWorkshops, fetchRegistrations]);

  const sortedWorkshops = React.useMemo(
    () => [...workshops].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [workshops],
  );

  if (isLoading) {
    return (
      <div style={statusScreenStyle}>
        <div style={loadingSpinnerStyle} />
        <p style={{ color: 'var(--text)' }}>Fetching upcoming events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={statusScreenStyle}>
        <h3 style={{ color: 'var(--text-h)', marginBottom: '12px' }}>Oops! Something went wrong</h3>
        <p style={{ color: 'var(--text)', marginBottom: '20px' }}>{error}</p>
        <Button onClick={() => fetchWorkshops()}>Retry Connection</Button>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <div style={headerRowStyle}>
        <h2 style={headerTitleStyle}>Upcoming Workshops</h2>
        <span style={headerSubtextStyle}>{sortedWorkshops.length} available</span>
      </div>

      {sortedWorkshops.length > 0 ? (
        <div style={listStyle}>
          {sortedWorkshops.map((ws) => (
            <WorkshopCard key={ws.id} workshop={ws} />
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <h3>No Workshops Available</h3>
          <p>Check back later for upcoming events.</p>
        </div>
      )}
    </div>
  );
};

const pageContainer: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  paddingTop: '12px',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: '16px',
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: '21px',
  fontWeight: 700,
  color: 'var(--text-h)',
  margin: 0,
  letterSpacing: '-0.3px',
};

const headerSubtextStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  fontWeight: 500,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const statusScreenStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  textAlign: 'center',
  fontFamily: 'var(--sans)',
  padding: '20px',
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px',
};

const emptyStateStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px dashed var(--border)',
  borderRadius: '16px',
  padding: '48px 24px',
  textAlign: 'center',
  color: 'var(--text)',
  fontFamily: 'var(--sans)',
  marginTop: '24px',
};

if (typeof document !== 'undefined' && !document.getElementById('spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'spinner-styles';
  style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default StudentHome;
