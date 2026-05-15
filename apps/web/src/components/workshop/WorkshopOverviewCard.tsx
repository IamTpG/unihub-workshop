import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import type { AdminWorkshop } from '../../stores/adminWorkshopStore';

interface WorkshopOverviewCardProps {
  workshop: AdminWorkshop;
}

export const WorkshopOverviewCard: React.FC<WorkshopOverviewCardProps> = ({ workshop }) => {
  return (
    <div style={detailsSectionStyle}>
      <h3 style={sectionTitleStyle}>Workshop Overview</h3>
      
      <div style={gridFieldsStyle}>
        <div style={fieldGroupStyle}>
          <div style={fieldLabelStyle}>Speaker</div>
          <div style={fieldValueStyle}>{workshop.speakerName || 'Not specified'}</div>
        </div>

        <div style={fieldGroupStyle}>
          <div style={fieldLabelStyle}>Location / Venue</div>
          <div style={fieldValueStyle}>{workshop.location || 'Not specified'}</div>
        </div>

        <div style={fieldGroupStyle}>
          <div style={fieldLabelStyle}>Price</div>
          <div style={fieldValueStyle}>
            {Number(workshop.price) > 0 ? `$${Number(workshop.price).toFixed(2)}` : 'Free'}
          </div>
        </div>

        <div style={fieldGroupStyle}>
          <div style={fieldLabelStyle}>Current Status</div>
          <div style={fieldValueStyle}>
            <StatusBadge status={workshop.status} />
          </div>
        </div>
      </div>

      {workshop.description && (
        <div style={{ marginTop: '24px' }}>
          <div style={fieldLabelStyle}>Description</div>
          <div style={{ ...fieldValueStyle, lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {workshop.description}
          </div>
        </div>
      )}
    </div>
  );
};

const detailsSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: 'var(--shadow)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--text-h)',
  marginTop: 0,
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid var(--border)',
};

const gridFieldsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text)',
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--text-h)',
  fontWeight: 500,
};
