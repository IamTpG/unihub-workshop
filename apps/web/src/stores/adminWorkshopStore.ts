import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';

export type WorkshopStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface AdminWorkshop {
  id: string;
  title: string;
  description?: string | null;
  speakerName?: string | null;
  location?: string | null;
  roomLayoutUrl?: string | null;
  pdfUrl?: string | null;
  aiSummary?: string | null;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSlots: number;
  price: number;
  status: WorkshopStatus;
  createdAt: string;
  updatedAt: string;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WorkshopStats {
  workshop: AdminWorkshop;
  registrationCounts: Record<string, number>;
  totalRegistrations: number;
}

export interface CreateWorkshopPayload {
  title: string;
  description?: string;
  speakerName?: string;
  location?: string;
  roomLayoutUrl?: string;
  pdfUrl?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  price?: number;
  status?: WorkshopStatus;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
}

export type UpdateWorkshopPayload = Partial<CreateWorkshopPayload>;

interface AdminWorkshopState {
  workshops: AdminWorkshop[];
  pagination: PaginationMetadata | null;
  currentWorkshop: AdminWorkshop | null;
  workshopStats: WorkshopStats | null;
  isLoading: boolean;
  error: string | null;
  
  fetchWorkshops: (page?: number, limit?: number) => Promise<void>;
  fetchWorkshop: (id: string) => Promise<AdminWorkshop>;
  fetchWorkshopStats: (id: string) => Promise<WorkshopStats>;
  createWorkshop: (data: CreateWorkshopPayload) => Promise<AdminWorkshop>;
  updateWorkshop: (id: string, data: UpdateWorkshopPayload) => Promise<AdminWorkshop>;
  uploadWorkshopPdf: (
    id: string,
    file: File,
    onProgress?: (percent: number) => void,
  ) => Promise<{ message: string }>;
  clearError: () => void;
}

export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || fallback;
  }
  return fallback;
};

export const useAdminWorkshopStore = create<AdminWorkshopState>((set) => ({
  workshops: [],
  pagination: null,
  currentWorkshop: null,
  workshopStats: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchWorkshops: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/admin/workshops', {
        params: { page, limit }
      });
      const data = response.data?.data;
      set({
        workshops: data?.items || [],
        pagination: data?.pagination || null,
        isLoading: false
      });
    } catch (err) {
      console.error('Failed to fetch admin workshops:', err);
      set({
        error: getErrorMessage(err, 'Failed to load workshops from server.'),
        isLoading: false
      });
    }
  },

  fetchWorkshop: async (id: string) => {
    set({ isLoading: true, error: null, currentWorkshop: null });
    try {
      const response = await api.get(`/admin/workshops/${id}`);
      const workshop = response.data?.data;
      set({ currentWorkshop: workshop, isLoading: false });
      return workshop;
    } catch (err) {
      console.error(`Failed to fetch workshop ${id}:`, err);
      const error = getErrorMessage(err, 'Failed to load workshop details.');
      set({ error, isLoading: false });
      throw err;
    }
  },

  fetchWorkshopStats: async (id: string) => {
    set({ isLoading: true, error: null, workshopStats: null });
    try {
      const response = await api.get(`/admin/workshops/${id}/stats`);
      const stats = response.data?.data;
      set({ 
        workshopStats: stats, 
        currentWorkshop: stats?.workshop || null,
        isLoading: false 
      });
      return stats;
    } catch (err) {
      console.error(`Failed to fetch stats for workshop ${id}:`, err);
      const error = getErrorMessage(err, 'Failed to load workshop statistics.');
      set({ error, isLoading: false });
      throw err;
    }
  },

  createWorkshop: async (data: CreateWorkshopPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/admin/workshops', data);
      const workshop = response.data?.data;
      set({ isLoading: false });
      return workshop;
    } catch (err) {
      console.error('Failed to create workshop:', err);
      const error = getErrorMessage(err, 'Failed to create workshop.');
      set({ error, isLoading: false });
      throw err;
    }
  },

  updateWorkshop: async (id: string, data: UpdateWorkshopPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/admin/workshops/${id}`, data);
      const workshop = response.data?.data;
      set({ currentWorkshop: workshop, isLoading: false });
      return workshop;
    } catch (err) {
      console.error(`Failed to update workshop ${id}:`, err);
      const error = getErrorMessage(err, 'Failed to update workshop.');
      set({ error, isLoading: false });
      throw err;
    }
  },

  uploadWorkshopPdf: async (id: string, file: File, onProgress?: (percent: number) => void) => {
    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await api.post(`/admin/workshops/${id}/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total || !onProgress) return;
          onProgress(Math.round((event.loaded * 100) / event.total));
        },
      });

      return response.data?.data;
    } catch (err) {
      console.error(`Failed to upload PDF for workshop ${id}:`, err);
      const error = getErrorMessage(err, 'Failed to upload workshop PDF.');
      throw new Error(error);
    }
  }
}));
