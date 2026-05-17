import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { WorkshopForm } from '../../../components/workshop/WorkshopForm';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { useAdminWorkshopStore, getErrorMessage } from '../../../stores/adminWorkshopStore';
import type { UpdateWorkshopPayload } from '../../../stores/adminWorkshopStore';

export const WorkshopEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentWorkshop,
    isLoading,
    error: fetchError,
    fetchWorkshop,
    updateWorkshop,
    uploadRoomLayoutImage,
    uploadWorkshopPdf,
    clearError,
  } = useAdminWorkshopStore();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchWorkshop(id).catch(() => {});
    return () => clearError();
  }, [id, fetchWorkshop, clearError]);

  const handleSubmit = async (data: UpdateWorkshopPayload) => {
    if (!id) return;
    setSubmitError(null);
    try {
      await updateWorkshop(id, data);
      navigate(`/admin/workshops/${id}`);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to update workshop. Please try again.');
      setSubmitError(msg);
      throw err;
    }
  };

  const handleImageUpload = async () => {
    if (!id || !selectedImage) return;
    setImageError(null);
    setImageProgress(0);
    try {
      await uploadRoomLayoutImage(id, selectedImage, setImageProgress);
      setSelectedImage(null);
      setImageProgress(null);
      await fetchWorkshop(id);
    } catch (err) {
      setImageProgress(null);
      setImageError(err instanceof Error ? err.message : 'Failed to upload image.');
    }
  };

  const handlePdfUpload = async () => {
    if (!id || !selectedPdf) return;
    setPdfError(null);
    setPdfProgress(0);
    try {
      await uploadWorkshopPdf(id, selectedPdf, setPdfProgress);
      setSelectedPdf(null);
      setPdfProgress(null);
      await fetchWorkshop(id);
    } catch (err) {
      setPdfProgress(null);
      setPdfError(err instanceof Error ? err.message : 'Failed to upload PDF.');
    }
  };

  if (isLoading && !currentWorkshop) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text)' }}>Loading workshop details...</div>;
  }

  if (fetchError || !currentWorkshop) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <Alert message={fetchError || 'Workshop not found.'} variant="error" />
      </div>
    );
  }

  const headerAction = (
    <Button
      variant="outline"
      onClick={() => navigate(`/admin/workshops/${id}`)}
      style={{ width: 'auto', padding: '10px 20px' }}
    >
      Cancel
    </Button>
  );

  return (
    <div style={{ maxWidth: '900px' }}>
      <PageHeader
        backPath={`/admin/workshops/${id}`}
        title="Edit Workshop"
        subtitle={`Modifying "${currentWorkshop.title}"`}
        action={headerAction}
      />

      {submitError && (
        <div style={{ marginBottom: '24px' }}>
          <Alert message={submitError} variant="error" />
        </div>
      )}

      <div style={cardStyle}>
        <WorkshopForm
          initialData={currentWorkshop}
          onSubmit={handleSubmit}
          submitText="Update Workshop"
        />
      </div>

      {/* Asset uploads */}
      <div style={uploadGridStyle}>
        {/* Room Layout */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>Room Layout Image</div>
          {currentWorkshop.roomLayoutUrl
            ? <p style={hintStyle}>Current: <a href={currentWorkshop.roomLayoutUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>View image</a></p>
            : <p style={hintStyle}>No image uploaded yet.</p>
          }
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)} style={fileInputStyle} />
          {imageProgress !== null && <div style={trackStyle}><div style={{ ...barStyle, width: `${imageProgress}%` }} /></div>}
          {imageError && <Alert message={imageError} variant="error" />}
          <Button onClick={handleImageUpload} disabled={!selectedImage || imageProgress !== null} loading={imageProgress !== null} loadingText="Uploading..." style={{ marginTop: '12px' }}>
            {currentWorkshop.roomLayoutUrl ? 'Replace Image' : 'Upload Image'}
          </Button>
        </div>

        {/* PDF / AI Summary */}
        <div style={cardStyle}>
          <div style={sectionTitleStyle}>PDF & AI Summary</div>
          {!currentWorkshop.pdfUrl && <p style={hintStyle}>Upload a PDF to generate an AI summary.</p>}
          {currentWorkshop.pdfUrl && !currentWorkshop.aiSummary && <p style={hintStyle}>Summary is being generated...</p>}
          {currentWorkshop.aiSummary && <p style={hintStyle}>Summary ready.</p>}
          <input type="file" accept="application/pdf" onChange={(e) => setSelectedPdf(e.target.files?.[0] ?? null)} style={fileInputStyle} />
          {pdfProgress !== null && <div style={trackStyle}><div style={{ ...barStyle, width: `${pdfProgress}%` }} /></div>}
          {pdfError && <Alert message={pdfError} variant="error" />}
          <Button onClick={handlePdfUpload} disabled={!selectedPdf || pdfProgress !== null} loading={pdfProgress !== null} loadingText="Uploading..." style={{ marginTop: '12px' }}>
            {currentWorkshop.pdfUrl ? 'Replace PDF' : 'Upload PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: 'var(--shadow)',
  marginBottom: '24px',
};

const uploadGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: 'var(--text-h)',
  marginBottom: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const hintStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text)',
  margin: '0 0 12px',
};

const fileInputStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--text-h)',
};

const trackStyle: React.CSSProperties = {
  height: '6px',
  borderRadius: '999px',
  background: 'var(--border)',
  overflow: 'hidden',
  marginTop: '10px',
};

const barStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '999px',
  background: 'var(--accent)',
  transition: 'width 0.2s ease',
};

export default WorkshopEdit;
