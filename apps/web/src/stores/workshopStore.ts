import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';

export interface ApiWorkshop {
  id: string;
  title: string;
  speakerName: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSlots: number;
  price: number | string;
  aiSummary: string | null;
  hasPdf: boolean;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
}

export interface ApiWorkshopDetail extends ApiWorkshop {
  description: string | null;
  roomLayoutUrl: string | null;
}

interface WorkshopState {
  workshops: ApiWorkshop[];
  currentWorkshop: ApiWorkshopDetail | null;
  isLoading: boolean;
  detailLoading: boolean;
  error: string | null;
  detailError: string | null;
  fetchWorkshops: () => Promise<void>;
  fetchWorkshopDetail: (id: string) => Promise<void>;
}

export const useWorkshopStore = create<WorkshopState>((set) => ({
  workshops: [],
  currentWorkshop: null,
  isLoading: false,
  detailLoading: false,
  error: null,
  detailError: null,

  fetchWorkshops: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/workshops');
      const items = response.data?.data?.items || [];
      set({ workshops: items, isLoading: false });
    } catch (err) {
      console.error('Failed to load workshops:', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Unable to connect to workshop server.';
      set({ error: message || 'Unable to connect to workshop server.', isLoading: false });
    }
  },

  fetchWorkshopDetail: async (id) => {
    set({ detailLoading: true, detailError: null, currentWorkshop: null });
    try {
      const response = await api.get<{ success: boolean; data: ApiWorkshopDetail }>(`/workshops/${id}`);
      set({ currentWorkshop: response.data.data, detailLoading: false });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Failed to load workshop details.';
      set({ detailError: message || 'Failed to load workshop details.', detailLoading: false });
    }
  },
}));
