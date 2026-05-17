import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { useAdminWorkshopStore } from '../../../stores/adminWorkshopStore';

// Subcomponents extracted for granular UI modularity
import { WorkshopStatsCards } from '../../../components/workshop/WorkshopStatsCards';
import { WorkshopOverviewCard } from '../../../components/workshop/WorkshopOverviewCard';
import { WorkshopAssetsSidebar } from '../../../components/workshop/WorkshopAssetsSidebar';

import { formatDateTimeRange } from '../../../utils/date';

export const WorkshopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    workshopStats,
    currentWorkshop,
    isLoading,
    error,
    fetchWorkshopStats,
    uploadWorkshopPdf,
    uploadRoomLayoutImage,
    clearError,
  } = useAdminWorkshopStore();
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkshopStats(id).catch(() => {});
    }
    return () => clearError();
  }, [id, fetchWorkshopStats, clearError]);

  if (isLoading) {
    return <div style={loadingContainerStyle}>Loading workshop data...</div>;
  }

  if (error || !currentWorkshop) {
    return (
      <div style={errorWrapperStyle}>
        <Alert message={error || 'Workshop not found.'} variant="error" />
      </div>
    );
  }

  const headerAction = (
    <Button
      onClick={() => navigate(`/admin/workshops/${id}/edit`)}
      style={{ width: 'auto', padding: '10px 20px' }}
    >
      Edit Workshop
    </Button>
  );

  const handlePdfUpload = async () => {
    if (!id || !selectedPdf) return;

    setUploadError(null);
    setUploadProgress(0);

    try {
      await uploadWorkshopPdf(id, selectedPdf, setUploadProgress);
      setSelectedPdf(null);
      setUploadProgress(null);
      await fetchWorkshopStats(id);
    } catch (err) {
      setUploadProgress(null);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload PDF.');
    }
  };

  const handleImageUpload = async () => {
    if (!id || !selectedImage) return;

    setImageUploadError(null);
    setImageUploadProgress(0);

    try {
      await uploadRoomLayoutImage(id, selectedImage, setImageUploadProgress);
      setSelectedImage(null);
      setImageUploadProgress(null);
      await fetchWorkshopStats(id);
    } catch (err) {
      setImageUploadProgress(null);
      setImageUploadError(err instanceof Error ? err.message : 'Failed to upload image.');
    }
  };

  return (
    <div>
      <PageHeader
        backPath="/admin/workshops"
        title={currentWorkshop.title}
        subtitle={formatDateTimeRange(currentWorkshop.startTime, currentWorkshop.endTime)}
        action={headerAction}
      />

      {/* 1. Stats Grid Header Section */}
      <WorkshopStatsCards
        totalRegistrations={workshopStats?.totalRegistrations || 0}
        capacity={currentWorkshop.capacity}
        availableSlots={currentWorkshop.availableSlots}
        registrationCounts={workshopStats?.registrationCounts || {}}
        checkedInCount={workshopStats?.checkedInCount}
      />

      {/* 2. Main Flex/Grid Details Layout */}
      <div style={contentLayoutStyle}>
        <WorkshopOverviewCard workshop={currentWorkshop} />
        <div style={sideStackStyle}>
          <WorkshopAssetsSidebar
            roomLayoutUrl={currentWorkshop.roomLayoutUrl}
            pdfUrl={currentWorkshop.pdfUrl}
          />

          {/* Room Layout Image Upload */}
          <section style={summaryPanelStyle}>
            <div style={panelHeaderStyle}>Room Layout Image</div>

            {currentWorkshop.roomLayoutUrl && (
              <p style={panelTextStyle}>
                Current:{' '}
                <a
                  href={currentWorkshop.roomLayoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent)', fontSize: '13px' }}
                >
                  View image
                </a>
              </p>
            )}

            {!currentWorkshop.roomLayoutUrl && (
              <p style={panelTextStyle}>No room layout uploaded yet.</p>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)}
              style={fileInputStyle}
            />

            {imageUploadProgress !== null && (
              <div style={progressTrackStyle}>
                <div style={{ ...progressBarStyle, width: `${imageUploadProgress}%` }} />
              </div>
            )}

            {imageUploadError && <Alert message={imageUploadError} variant="error" />}

            <Button
              onClick={handleImageUpload}
              disabled={!selectedImage || imageUploadProgress !== null}
              loading={imageUploadProgress !== null}
              loadingText="Uploading..."
              style={{ marginTop: '12px' }}
            >
              {currentWorkshop.roomLayoutUrl ? 'Replace Image' : 'Upload Room Layout'}
            </Button>
          </section>

          <section style={summaryPanelStyle}>
            <div style={panelHeaderStyle}>PDF & AI Summary</div>

            {!currentWorkshop.pdfUrl && (
              <p style={panelTextStyle}>Upload a PDF to generate a workshop summary.</p>
            )}

            {currentWorkshop.pdfUrl && !currentWorkshop.aiSummary && (
              <div style={processingRowStyle}>
                <div style={smallSpinnerStyle} />
                <span>Summary is being generated...</span>
              </div>
            )}

            {currentWorkshop.aiSummary && (
              <p style={summaryTextStyle}>{currentWorkshop.aiSummary}</p>
            )}

            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => setSelectedPdf(event.target.files?.[0] ?? null)}
              style={fileInputStyle}
            />

            {uploadProgress !== null && (
              <div style={progressTrackStyle}>
                <div style={{ ...progressBarStyle, width: `${uploadProgress}%` }} />
              </div>
            )}

            {uploadError && <Alert message={uploadError} variant="error" />}

            <Button
              onClick={handlePdfUpload}
              disabled={!selectedPdf || uploadProgress !== null}
              loading={uploadProgress !== null}
              loadingText="Uploading..."
              style={{ marginTop: '12px' }}
            >
              {currentWorkshop.pdfUrl ? 'Replace PDF' : 'Upload PDF for AI Summary'}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

// Dedicated Page-Level Styles
const loadingContainerStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  color: 'var(--text)',
};

const errorWrapperStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '40px auto',
  textAlign: 'center',
};

const contentLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '32px',
  alignItems: 'start',
};

const sideStackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const summaryPanelStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  backgroundColor: 'var(--bg)',
  padding: '20px',
  boxShadow: 'var(--shadow)',
};

const panelHeaderStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text)',
  marginBottom: '12px',
};

const panelTextStyle: React.CSSProperties = {
  margin: '0 0 14px',
  color: 'var(--text)',
  fontSize: '14px',
  lineHeight: 1.5,
};

const processingRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: 'var(--text)',
  fontSize: '14px',
  marginBottom: '14px',
};

const summaryTextStyle: React.CSSProperties = {
  margin: '0 0 16px',
  color: 'var(--text)',
  fontSize: '14px',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
};

const fileInputStyle: React.CSSProperties = {
  width: '100%',
  color: 'var(--text)',
  fontSize: '14px',
};

const progressTrackStyle: React.CSSProperties = {
  height: '6px',
  backgroundColor: 'var(--border)',
  borderRadius: '999px',
  overflow: 'hidden',
  marginTop: '12px',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  backgroundColor: 'var(--accent)',
  transition: 'width 0.2s ease',
};

const smallSpinnerStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  border: '2px solid var(--border)',
  borderTopColor: 'var(--accent)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

if (typeof document !== 'undefined' && !document.getElementById('admin-ai-summary-spinner')) {
  const style = document.createElement('style');
  style.id = 'admin-ai-summary-spinner';
  style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
}

export default WorkshopDetail;
