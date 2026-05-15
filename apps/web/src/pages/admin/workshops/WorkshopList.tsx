import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { DataTable } from '../../../components/ui/DataTable';
import type { ColumnDef } from '../../../components/ui/DataTable';
import { Pagination } from '../../../components/ui/Pagination';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { useAdminWorkshopStore } from '../../../stores/adminWorkshopStore';
import type { AdminWorkshop } from '../../../stores/adminWorkshopStore';

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};

export const WorkshopList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    workshops, 
    pagination, 
    isLoading, 
    error, 
    fetchWorkshops 
  } = useAdminWorkshopStore();

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handlePageChange = (page: number) => {
    fetchWorkshops(page);
  };

  const columns: ColumnDef<AdminWorkshop>[] = [
    {
      header: 'Title',
      key: 'title',
      render: (row) => (
        <Link 
          to={`/admin/workshops/${row.id}`}
          style={{ 
            color: 'var(--accent)', 
            textDecoration: 'none', 
            fontWeight: 600 
          }}
        >
          {row.title}
        </Link>
      ),
      style: { minWidth: '200px' },
    },
    {
      header: 'Speaker',
      key: 'speakerName',
      render: (row) => row.speakerName || <span style={{ color: 'var(--text)', fontStyle: 'italic' }}>N/A</span>,
    },
    {
      header: 'Location',
      key: 'location',
      render: (row) => row.location || <span style={{ color: 'var(--text)', fontStyle: 'italic' }}>N/A</span>,
    },
    {
      header: 'Scheduled Time',
      key: 'startTime',
      render: (row) => formatDate(row.startTime),
      style: { whiteSpace: 'nowrap' },
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link 
            to={`/admin/workshops/${row.id}`} 
            style={actionLinkStyle}
          >
            View
          </Link>
          <Link 
            to={`/admin/workshops/${row.id}/edit`} 
            style={actionLinkStyle}
          >
            Edit
          </Link>
        </div>
      ),
    },
  ];

  const actionLinkStyle: React.CSSProperties = {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '14px',
  };

  const headerAction = (
    <Button 
      onClick={() => navigate('/admin/workshops/new')}
      style={{ width: 'auto', padding: '10px 20px' }}
    >
      + Create Workshop
    </Button>
  );

  return (
    <div>
      <PageHeader 
        title="Manage Workshops" 
        subtitle="Create, update, and monitor UniHub scheduled workshop sessions."
        action={headerAction}
      />

      {error && (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Alert message={error} variant="error" />
          <Button 
            variant="outline" 
            onClick={() => fetchWorkshops(pagination?.page || 1)}
            style={{ width: 'fit-content', margin: '0 auto' }}
          >
            Try Again
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={workshops}
        isLoading={isLoading}
        emptyMessage="No workshops found. Click 'Create Workshop' to get started."
      />

      {!isLoading && pagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default WorkshopList;
