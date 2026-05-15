import React, { useEffect } from 'react';
import { useWorkshopStore } from '../../stores/workshopStore';
import { WorkshopCard } from '../../components/workshop/WorkshopCard';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/date';

const StaffDesk: React.FC = () => {
  const navigate = useNavigate();
  const { workshops, isLoading, error, fetchWorkshops } = useWorkshopStore();

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  // Group and sort all workshops chronologically for the check-in queue
  const groupedWorkshops = React.useMemo(() => {
    const map: { [key: string]: typeof workshops } = {};
    
    const sorted = [...workshops].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    sorted.forEach((ws) => {
      const dayKey = formatDate(ws.startTime);
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(ws);
    });

    return Object.entries(map).map(([date, items]) => ({
      date,
      workshops: items,
    }));
  }, [workshops]);

  if (isLoading) {
    return (
      <div style={statusScreenStyle}>
        <div style={loadingSpinnerStyle} />
        <p style={{ color: 'var(--text)' }}>Loading check-in active desk...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={statusScreenStyle}>
        <h3 style={{ color: 'var(--text-h)', marginBottom: '12px' }}>Connection Failed</h3>
        <p style={{ color: 'var(--text)', marginBottom: '20px' }}>{error}</p>
        <Button onClick={() => fetchWorkshops()}>Retry Connection</Button>
      </div>
    );
  }

  return (
    <div style={pageContainer}>
      <h1 style={pageTitleStyle}>Staff Check-In Desk</h1>
      <p style={subtitleStyle}>Select a workshop below to manage arrivals and activate scanner.</p>

      {groupedWorkshops.length > 0 ? (
        <div style={{ marginTop: '28px' }}>
          {groupedWorkshops.map((group) => (
            <div key={group.date} style={{ marginBottom: '28px' }}>
              {/* Elegant Day Group Title Badge */}
              <div style={dayBadgeStyle}>{group.date}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {group.workshops.map((ws) => (
                  <WorkshopCard 
                    key={ws.id} 
                    workshop={ws} 
                    onClick={() => navigate('/manage/scan')} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <h3>No Workshops Assigned</h3>
          <p>There are currently no upcoming events on the check-in desk schedule.</p>
        </div>
      )}
    </div>
  );
};

/* Premium UI Dashboard Styles */
const pageContainer: React.CSSProperties = {
  textAlign: 'left',
  fontFamily: 'var(--sans)',
  paddingTop: '12px',
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: 'var(--text-h)',
  margin: '0 0 6px 0',
  letterSpacing: '-0.5px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  margin: 0,
};

const dayBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 600,
  marginBottom: '16px',
};

const emptyStateStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px dashed var(--border)',
  borderRadius: '16px',
  padding: '48px 24px',
  textAlign: 'center',
  color: 'var(--text)',
  marginTop: '32px',
};

const statusScreenStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  textAlign: 'center',
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

if (typeof document !== 'undefined' && !document.getElementById('spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'spinner-styles';
  style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default StaffDesk;
