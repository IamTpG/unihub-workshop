import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';

export type ImportLogStatus = 'PENDING' | 'DONE' | 'FAILED';

export interface ImportLog {
  id: string;
  filename: string;
  totalRows: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  status: ImportLogStatus;
  createdAt: string;
}

interface StudentImportState {
  logs: ImportLog[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number | null;
  error: string | null;
  success: string | null;
  fetchLogs: () => Promise<void>;
  importCsv: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  clearMessages: () => void;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
};

export const useStudentImportStore = create<StudentImportState>((set, get) => ({
  logs: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: null,
  error: null,
  success: null,

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/admin/import/logs');
      set({ logs: res.data?.data ?? [], isLoading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to load import logs.'), isLoading: false });
    }
  },

  importCsv: async (file, onProgress) => {
    set({ isUploading: true, uploadProgress: 0, error: null, success: null });
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/admin/import/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const pct = Math.round((event.loaded * 100) / event.total);
          onProgress(pct);
          set({ uploadProgress: pct });
        },
      });

      set({ isUploading: false, uploadProgress: null, success: 'Import queued successfully. Check the log table for results.' });
      await get().fetchLogs();
    } catch (err) {
      set({
        isUploading: false,
        uploadProgress: null,
        error: getErrorMessage(err, 'Failed to import CSV.'),
      });
    }
  },

  clearMessages: () => set({ error: null, success: null }),
}));
