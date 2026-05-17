import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { WorkshopForm } from '../../../components/workshop/WorkshopForm';
import { Alert } from '../../../components/ui/Alert';
import { useAdminWorkshopStore, getErrorMessage } from '../../../stores/adminWorkshopStore';
import type { CreateWorkshopPayload } from '../../../stores/adminWorkshopStore';

export const WorkshopCreate: React.FC = () => {
  const navigate = useNavigate();
  const { createWorkshop } = useAdminWorkshopStore();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateWorkshopPayload) => {
    setError(null);
    try {
      await createWorkshop(data);
      navigate('/admin/workshops');
    } catch (err) {
      // Extract error message for inline display
      const msg = getErrorMessage(err, 'Failed to create workshop. Please try again.');
      setError(msg);
      throw err; // Propagate to stop form submission loading state
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <PageHeader
        title="Create New Workshop"
        subtitle="Fill in the details to schedule a new learning session."
      />

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <Alert message={error} variant="error" />
        </div>
      )}

      <div style={formContainerStyle}>
        <WorkshopForm onSubmit={handleSubmit} submitText="Create Workshop" />
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

export default WorkshopCreate;
