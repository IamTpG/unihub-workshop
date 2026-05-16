import React, { useEffect } from 'react';
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
    clearError,
  } = useAdminWorkshopStore();

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
        <div style={{ marginTop: '24px' }}>
          <Button onClick={() => navigate('/admin/workshops')} style={{ width: 'auto' }}>
            &larr; Back to Workshop List
          </Button>
        </div>
      </div>
    );
  }

  const headerAction = (
    <div style={{ display: 'flex', gap: '12px' }}>
      <Button
        variant="outline"
        onClick={() => navigate('/admin/workshops')}
        style={{ width: 'auto', padding: '10px 20px' }}
      >
        &larr; Back
      </Button>
      <Button
        onClick={() => navigate(`/admin/workshops/${id}/edit`)}
        style={{ width: 'auto', padding: '10px 20px' }}
      >
        Edit Workshop
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
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
      />

      {/* 2. Main Flex/Grid Details Layout */}
      <div style={contentLayoutStyle}>
        <WorkshopOverviewCard workshop={currentWorkshop} />
        <WorkshopAssetsSidebar 
          roomLayoutUrl={currentWorkshop.roomLayoutUrl}
          pdfUrl={currentWorkshop.pdfUrl}
        />
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

export default WorkshopDetail;
