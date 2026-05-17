import React, { useEffect, useRef, useState } from 'react';
import { DataTable, type ColumnDef } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { useStudentImportStore, type ImportLog, type ImportLogStatus } from '../../../stores/studentImportStore';

const STATUS_COLORS: Record<ImportLogStatus, React.CSSProperties> = {
  PENDING: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047' },
  DONE:    { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
  FAILED:  { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' },
};

const StatusBadge: React.FC<{ status: ImportLogStatus }> = ({ status }) => (
  <span style={{ ...badgeBase, ...STATUS_COLORS[status] }}>{status}</span>
);

const columns: ColumnDef<ImportLog>[] = [
  {
    header: 'File',
    key: 'filename',
    render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{row.filename}</span>,
  },
  { header: 'Total', key: 'totalRows' },
  { header: 'Inserted', key: 'inserted', render: (row) => <span style={{ color: '#15803d', fontWeight: 600 }}>{row.inserted}</span> },
  { header: 'Updated',  key: 'updated',  render: (row) => <span style={{ color: '#0369a1', fontWeight: 600 }}>{row.updated}</span> },
  { header: 'Skipped',  key: 'skipped',  render: (row) => <span style={{ color: '#854d0e', fontWeight: 600 }}>{row.skipped}</span> },
  { header: 'Failed',   key: 'failed',   render: (row) => <span style={{ color: '#dc2626', fontWeight: 600 }}>{row.failed}</span> },
  { header: 'Status',   key: 'status',   render: (row) => <StatusBadge status={row.status} /> },
  {
    header: 'Date',
    key: 'createdAt',
    render: (row) => new Date(row.createdAt).toLocaleString(),
  },
];

const StudentImport: React.FC = () => {
  const { logs, isLoading, isUploading, uploadProgress, error, success, fetchLogs, importCsv, clearMessages } =
    useStudentImportStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await importCsv(selectedFile, () => {});
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', color: 'var(--text-h)' }}>Student Import</h1>
        <p style={{ color: 'var(--text)', margin: 0 }}>
          Upload a CSV to bulk-import students, or let the nightly job run at 2:00 AM automatically.
        </p>
      </div>

      {/* Upload card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Manual Import</h2>
        <p style={{ color: 'var(--text)', fontSize: '14px', margin: '0 0 16px 0' }}>
          CSV must have columns: <code>studentId</code>, <code>email</code>, <code>fullName</code>, and optionally <code>status</code> (defaults to ACTIVE). Max 10 MB.
        </p>

        {error   && <Alert message={error}   variant="error"   />}
        {success && <Alert message={success} variant="success" />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isUploading}
            style={fileInputStyle}
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            loading={isUploading}
            loadingText="Uploading..."
            fullWidth={false}
            size="sm"
          >
            Upload & Import
          </Button>
          {selectedFile && !isUploading && (
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{selectedFile.name}</span>
          )}
        </div>

        {uploadProgress !== null && (
          <div style={{ marginTop: '16px' }}>
            <div style={progressTrackStyle}>
              <div style={{ ...progressBarStyle, width: `${uploadProgress}%` }} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px', display: 'block' }}>
              {uploadProgress}% uploaded
            </span>
          </div>
        )}
      </div>

      {/* Nightly schedule info */}
      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <h2 style={cardTitleStyle}>Nightly Schedule</h2>
        <div style={infoRowStyle}>
          <InfoItem label="Schedule"    value="Every day at 2:00 AM" />
          <InfoItem label="Queue"       value="student-import-queue" />
          <InfoItem label="Job ID"      value="nightly-student-import" />
          <InfoItem label="Env trigger" value="NIGHTLY_CSV_PATH (set on worker)" />
        </div>
      </div>

      {/* Logs table */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Import Logs</h2>
          <Button onClick={fetchLogs} variant="outline" fullWidth={false} size="sm" loading={isLoading} loadingText="Refreshing...">
            Refresh
          </Button>
        </div>
        <DataTable<ImportLog>
          columns={columns}
          data={logs}
          isLoading={isLoading}
          emptyMessage="No imports yet. Upload a CSV above to get started."
        />
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '12px', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: '14px', color: 'var(--text-h)', fontFamily: 'monospace' }}>{value}</span>
  </div>
);

const cardStyle: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: 'var(--shadow)',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-h)',
};

const fileInputStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--text-h)',
  background: 'var(--bg)',
  cursor: 'pointer',
};

const progressTrackStyle: React.CSSProperties = {
  height: '6px',
  borderRadius: '999px',
  background: 'var(--border)',
  overflow: 'hidden',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '999px',
  background: 'var(--accent)',
  transition: 'width 0.2s ease',
};

const infoRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '20px',
};

const badgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '0.3px',
};

export default StudentImport;
