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
    clearError,
  } = useAdminWorkshopStore();
  
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkshop(id).catch(() => {});
    }
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
      throw err; // Stop button loading animation
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
        title={`Edit Workshop`} 
        subtitle={`Modifying "${currentWorkshop.title}"`}
        action={headerAction}
      />

      {(submitError) && (
        <div style={{ marginBottom: '24px' }}>
          <Alert message={submitError} variant="error" />
        </div>
      )}

      <div style={formContainerStyle}>
        <WorkshopForm 
          initialData={currentWorkshop} 
          onSubmit={handleSubmit} 
          submitText="Update Workshop" 
        />
      </div>
    </div>
  );
};

const formContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: 'var(--shadow)',
};

export default WorkshopEdit;
