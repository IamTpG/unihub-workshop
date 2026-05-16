import React from 'react';
import { formatDate, formatTime } from '../../utils/date';

interface WorkshopBriefProps {
  title: string;
  startTime: string | Date;
  location?: string;
  price?: number;
  showPrice?: boolean;
}

export const WorkshopBrief: React.FC<WorkshopBriefProps> = ({ 
  title, 
  startTime, 
  price, 
  showPrice 
}) => {
  return (
    <div style={containerStyle}>
      <div style={sectionHeaderStyle}>Workshop</div>
      <h2 style={workshopTitleStyle}>{title}</h2>
      <div style={dateTimeStyle}>
        {formatDate(startTime)} • {formatTime(startTime)}
      </div>
      
      {showPrice && price !== undefined && (
        <div style={priceContainerStyle}>
          <div style={dividerStyle} />
          <div style={sectionHeaderStyle}>Registration Price</div>
          <div style={priceValueStyle}>${price}</div>
        </div>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: '100%',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '12px',
};

const workshopTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 800,
  color: 'var(--text-h)',
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const dateTimeStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text)',
  fontWeight: 500,
};

const priceContainerStyle: React.CSSProperties = {
  marginTop: '24px',
};

const priceValueStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  color: 'var(--text-h)',
};

const dividerStyle: React.CSSProperties = {
  height: '1px',
  backgroundColor: 'var(--border)',
  margin: '0 0 24px 0',
};
