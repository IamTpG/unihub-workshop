import React, { useEffect, useState } from 'react';
import { useWorkshopStore } from '../../stores/workshopStore';
import { Button } from '../../components/ui/Button';
import { DateRangeSelector } from '../../components/workshop/DateRangeSelector';
import { WorkshopCard } from '../../components/workshop/WorkshopCard';
import { useNavigate } from 'react-router-dom';

import { formatDate, getStartOfWeek, getEndOfWeek, formatWeekRange } from '../../utils/date';

const StudentHome: React.FC = () => {
  const navigate = useNavigate();
  const { workshops, isLoading, error, fetchWorkshops } = useWorkshopStore();

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  };

  // Filter workshops for the current week
  const weekWorkshops = React.useMemo(() => {
    const end = getEndOfWeek(currentWeekStart);
    return workshops.filter((ws) => {
      const d = new Date(ws.startTime);
      return d >= currentWeekStart && d <= end;
    });
  }, [workshops, currentWeekStart]);

  // Group the dynamic API array into Day Groups for visually segmented rendering
  const groupedWorkshops = React.useMemo(() => {
    const map: { [key: string]: typeof workshops } = {};
    
    weekWorkshops.forEach((ws) => {
      const dayKey = formatDate(ws.startTime);
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(ws);
    });

    return Object.entries(map).map(([date, items]) => ({
      date,
      workshops: items,
    }));
  }, [weekWorkshops]);

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
      {/* Date Range Selector Component */}
      <DateRangeSelector 
        label={formatWeekRange(currentWeekStart)} 
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
      />

      {/* Section Title Bar */}
      <div style={headerRowStyle}>
        <h2 style={headerTitleStyle}>Workshops For You</h2>
        <span style={headerSubtextStyle}>{weekWorkshops.length} this week</span>
      </div>

      {/* Workshops List Grouped by Day */}
      {groupedWorkshops.length > 0 ? (
        <div>
          {groupedWorkshops.map((group) => (
            <div key={group.date} style={{ marginBottom: '28px' }}>
              {/* Day Badge */}
              <div style={dayBadgeStyle}>{group.date}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {group.workshops.map((ws) => (
                  <WorkshopCard 
                    key={ws.id} 
                    workshop={ws} 
                    onClick={() => navigate(`/workshops/${ws.id}`)} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <h3>No Workshops Found</h3>
          <p>Check back later for updates and scheduled events.</p>
        </div>
      )}
    </div>
  );
};

/* System-Aware Theme Styling consuming global variables natively */
const pageContainer: React.CSSProperties = {
  textAlign: 'left',
  fontFamily: 'var(--sans)',
  paddingTop: '12px',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: '20px',
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

// Inject dynamic spinner keyframes to index.css dynamically or hardcode here
if (typeof document !== 'undefined' && !document.getElementById('spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'spinner-styles';
  style.innerHTML = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default StudentHome;
