import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  const handleConfirm = () => {
    onConfirm();
    onClose(); // close modal after confirm execution
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={modalTitleStyle}>{title}</h3>
        <p style={modalTextStyle}>{description}</p>
        <div style={modalActionsStyle}>
          <button 
            onClick={onClose} 
            style={cancelBtnStyle}
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm} 
            style={confirmBtnStyle(isDanger)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px',
  animation: 'fadeIn 0.2s ease-out',
};

const modalCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  borderRadius: '18px',
  padding: '28px 24px',
  width: '100%',
  maxWidth: '320px',
  textAlign: 'center',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  border: '1px solid var(--border)',
  transform: 'scale(1)',
  animation: 'scaleIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

const modalTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--text-h)',
  letterSpacing: '-0.3px',
};

const modalTextStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  margin: '0 0 24px 0',
  lineHeight: '1.5',
};

const modalActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--bg)',
  color: 'var(--text-h)',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '15px',
};

const confirmBtnStyle = (isDanger: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '12px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: isDanger ? 'var(--error)' : 'var(--accent)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '15px',
  boxShadow: isDanger 
    ? '0 4px 10px rgba(255, 59, 48, 0.25)' 
    : '0 4px 10px rgba(170, 59, 255, 0.25)',
});

// Setup Keyframe Animations once globally if in browser
if (typeof document !== 'undefined' && !document.getElementById('modal-animations')) {
  const style = document.createElement('style');
  style.id = 'modal-animations';
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
