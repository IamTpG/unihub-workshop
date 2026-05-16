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
}

interface WorkshopState {
  workshops: ApiWorkshop[];
  isLoading: boolean;
  error: string | null;
  fetchWorkshops: () => Promise<void>;
}

export const useWorkshopStore = create<WorkshopState>((set) => ({
  workshops: [],
  isLoading: false,
  error: null,
  fetchWorkshops: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/workshops');
      // Enforce standard response mapping according to service.listPublished structure
      const items = response.data?.data?.items || [];
      set({ workshops: items, isLoading: false });
    } catch (err) {
      console.error('Failed to load workshops:', err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Unable to connect to workshop server.';
      set({
        error: message || 'Unable to connect to workshop server.',
        isLoading: false,
      });
    }
  },
}));
