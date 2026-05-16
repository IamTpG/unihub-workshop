import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrationStore } from '../../stores/registrationStore';
import { RegStatus, type RegistrationResponse } from '@unihub/shared';
import { Button } from '../../components/ui/Button';
import TicketCard from '../../components/registration/TicketCard';

const MyRegistrations: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'PAID' | 'HOLDING'>('PAID');
  const { registrations, isLoading, error, fetchRegistrations } = useRegistrationStore();

  const fetchItems = useCallback(async () => {
    const statusFilter = activeTab === 'PAID' 
      ? RegStatus.PAID 
      : `${RegStatus.HOLDING},${RegStatus.PENDING},${RegStatus.FAILED},${RegStatus.EXPIRED}`;
    
    await fetchRegistrations(statusFilter);
  }, [activeTab, fetchRegistrations]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCardClick = (reg: RegistrationResponse) => {
    if (reg.status === RegStatus.PAID) {
      navigate(`/my-registrations/${reg.id}/qr`);
    } else if (reg.status === RegStatus.HOLDING) {
      navigate(`/my-registrations/${reg.id}/pay`);
    } else {
      navigate(`/my-registrations/${reg.id}/result`, { state: { registration: reg } });
    }
  };

  // Inject dynamic spinner keyframes
  useEffect(() => {
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
  }, []);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>My Registrations</h1>
        <p style={subtitleStyle}>Manage your workshop entries</p>
      </header>

      <div style={tabContainerStyle}>
        <button 
          onClick={() => setActiveTab('PAID')}
          style={activeTab === 'PAID' ? activeTabStyle : tabStyle}
        >
          Paid {activeTab === 'PAID' && registrations.length > 0 && <span style={countBadgeStyle}>{registrations.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('HOLDING')}
          style={activeTab === 'HOLDING' ? activeTabStyle : tabStyle}
        >
          Awaiting {activeTab === 'HOLDING' && registrations.length > 0 && <span style={countBadgeStyle}>{registrations.length}</span>}
        </button>
      </div>

      <div style={contentStyle}>
        {isLoading ? (
          <div style={centerStyle}>
            <div className="spinner" style={spinnerStyle} />
            <p>Loading registrations...</p>
          </div>
        ) : error ? (
          <div style={centerStyle}>
            <p style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</p>
            <Button onClick={fetchItems}>Retry</Button>
          </div>
        ) : registrations.length === 0 ? (
          <div style={emptyStyle}>
            <h3>No registrations found</h3>
            <p>You haven't signed up for any workshops yet.</p>
            <Button onClick={() => navigate('/workshops')} style={{ marginTop: '16px' }}>
              Browse Workshops
            </Button>
          </div>
        ) : (
          <div style={listStyle}>
            {registrations.map(reg => (
              <TicketCard 
                key={reg.id} 
                registration={reg} 
                onClick={() => handleCardClick(reg)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  padding: '20px',
  fontFamily: 'var(--sans)',
  minHeight: '100vh',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 800,
  color: 'var(--text-h)',
  margin: '0 0 4px 0',
  letterSpacing: '-0.5px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  margin: 0,
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '24px',
  borderBottom: '1px solid var(--border)',
  paddingBottom: '2px',
};

const tabStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--text)',
  background: 'none',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  borderBottomWidth: '2px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'transparent',
  cursor: 'pointer',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: 'var(--accent)',
  borderBottomColor: 'var(--accent)',
};

const countBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  backgroundColor: 'var(--accent)',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '10px',
  minWidth: '18px',
  textAlign: 'center',
};

const contentStyle: React.CSSProperties = {
  marginTop: '16px',
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  textAlign: 'center',
  color: 'var(--text)',
};

const emptyStyle: React.CSSProperties = {
  ...centerStyle,
  backgroundColor: 'rgba(255,255,255,0.02)',
  borderRadius: '24px',
  border: '1px dashed var(--border)',
};

const spinnerStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: '3px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px',
};

export default MyRegistrations;
