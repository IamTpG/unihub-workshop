import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotificationStore, type Notification } from '../../stores/notificationStore';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: (id: string) => void;
}> = ({ notification, onMarkRead }) => (
  <div
    onClick={() => { if (!notification.isRead) onMarkRead(notification.id); }}
    style={{
      ...itemStyle,
      backgroundColor: notification.isRead ? 'transparent' : 'var(--accent-bg)',
      cursor: notification.isRead ? 'default' : 'pointer',
    }}
  >
    <div style={itemTopRowStyle}>
      <span style={itemTitleStyle}>{notification.title}</span>
      <div style={itemMetaStyle}>
        <span style={timeStyle}>{timeAgo(notification.createdAt)}</span>
        {!notification.isRead && <span style={unreadDotStyle} />}
      </div>
    </div>
    {notification.body && (
      <p style={itemBodyStyle}>{notification.body}</p>
    )}
  </div>
);

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  return (
    <div ref={containerRef} style={wrapperStyle}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        style={bellBtnStyle}
        title="Notifications"
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={badgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          <div style={dropdownHeaderStyle}>
            <span style={dropdownTitleStyle}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()} style={markAllBtnStyle}>
                Mark all as read
              </button>
            )}
          </div>
          <div style={listStyle}>
            {notifications.length === 0 ? (
              <div style={emptyStyle}>No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const wrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const bellBtnStyle: React.CSSProperties = {
  position: 'relative',
  background: 'transparent',
  border: 'none',
  padding: '6px',
  color: 'var(--text)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  background: '#ef4444',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 700,
  minWidth: '16px',
  height: '16px',
  borderRadius: '999px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 3px',
  lineHeight: 1,
  pointerEvents: 'none',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  width: '340px',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  zIndex: 100,
  overflow: 'hidden',
};

const dropdownHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  borderBottom: '1px solid var(--border)',
};

const dropdownTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '15px',
  color: 'var(--text-h)',
};

const markAllBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--accent)',
  fontSize: '13px',
  cursor: 'pointer',
  padding: 0,
  fontWeight: 500,
};

const listStyle: React.CSSProperties = {
  maxHeight: '360px',
  overflowY: 'auto',
};

const emptyStyle: React.CSSProperties = {
  padding: '40px 16px',
  textAlign: 'center',
  color: 'var(--text)',
  fontSize: '14px',
};

const itemStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--border)',
  transition: 'background 0.15s ease',
};

const itemTopRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '8px',
  marginBottom: '4px',
};

const itemTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '14px',
  color: 'var(--text-h)',
  flex: 1,
};

const itemMetaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexShrink: 0,
};

const timeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text)',
  whiteSpace: 'nowrap',
};

const unreadDotStyle: React.CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: 'var(--accent)',
  flexShrink: 0,
};

const itemBodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '13px',
  color: 'var(--text)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};
