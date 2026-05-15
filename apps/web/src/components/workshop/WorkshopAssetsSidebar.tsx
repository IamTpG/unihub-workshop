import React from 'react';

interface WorkshopAssetsSidebarProps {
  roomLayoutUrl?: string | null;
  pdfUrl?: string | null;
}

export const WorkshopAssetsSidebar: React.FC<WorkshopAssetsSidebarProps> = ({
  roomLayoutUrl,
  pdfUrl,
}) => {
  return (
    <div style={sidebarSectionStyle}>
      <h3 style={sectionTitleStyle}>Materials & Assets</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={assetCardStyle}>
          <div style={assetTitleStyle}>Room Layout</div>
          {roomLayoutUrl ? (
            <a 
              href={roomLayoutUrl} 
              target="_blank" 
              rel="noreferrer"
              style={assetLinkStyle}
            >
              View Layout Image &rarr;
            </a>
          ) : (
            <div style={assetEmptyStyle}>No Layout Uploaded</div>
          )}
        </div>

        <div style={assetCardStyle}>
          <div style={assetTitleStyle}>Information PDF</div>
          {pdfUrl ? (
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noreferrer"
              style={assetLinkStyle}
            >
              Download PDF Guide &rarr;
            </a>
          ) : (
            <div style={assetEmptyStyle}>No PDF Uploaded</div>
          )}
        </div>
      </div>
    </div>
  );
};

const sidebarSectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--code-bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '24px',
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

const assetCardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
};

const assetTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-h)',
  marginBottom: '8px',
};

const assetLinkStyle: React.CSSProperties = {
  color: 'var(--accent)',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
};

const assetEmptyStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text)',
  fontStyle: 'italic',
};
