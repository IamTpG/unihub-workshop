import { create } from 'zustand';
import { api } from '../lib/api';
import type { RegistrationResponse } from '@unihub/shared';

const ACTIVE_STATUSES = ['PENDING', 'HOLDING', 'PAID'] as const;
const POLL_INTERVAL_MS = 600;
const POLL_MAX_ATTEMPTS = 17; // ~10 seconds

interface RegistrationState {
  registrations: RegistrationResponse[];
  currentRegistration: RegistrationResponse | null;
  registeredWorkshopIds: string[];
  isLoading: boolean;
  error: string | null;

  fetchRegistrations: (status?: string) => Promise<void>;
  fetchRegistration: (id: string) => Promise<RegistrationResponse>;
  registerForWorkshop: (workshopId: string) => Promise<{ jobId: string }>;
  pollForRegistration: (workshopId: string) => Promise<string | null>;
  simulatePayment: (data: { eventType: string; intentId: string; eventId: string }) => Promise<void>;
  clearError: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  registrations: [],
  currentRegistration: null,
  registeredWorkshopIds: [],
  isLoading: false,
  error: null,

  fetchRegistrations: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ success: boolean; data: RegistrationResponse[] }>('/registrations', {
        params: { status },
      });
      const data = response.data.data;
      const activeIds = data
        .filter((r) => ACTIVE_STATUSES.includes(r.status as typeof ACTIVE_STATUSES[number]))
        .map((r) => r.workshop.id);
      set({ registrations: data, registeredWorkshopIds: activeIds, isLoading: false });
    } catch (err: unknown) {
      set({
        error: (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load registrations',
        isLoading: false,
      });
    }
  },

  fetchRegistration: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ success: boolean; data: RegistrationResponse }>(`/registrations/${id}`);
      const data = response.data.data;
      set({ currentRegistration: data, isLoading: false });
      return data;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load registration details';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  registerForWorkshop: async (workshopId) => {
    set({ isLoading: true, error: null });
    try {
      const idempotencyKey = `reg_${workshopId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const response = await api.post<{ success: boolean; data: { jobId: string } }>(
        `/workshops/${workshopId}/register`,
        {},
        { headers: { 'x-idempotency-key': idempotencyKey } },
      );
      set((state) => ({
        isLoading: false,
        registeredWorkshopIds: state.registeredWorkshopIds.includes(workshopId)
          ? state.registeredWorkshopIds
          : [...state.registeredWorkshopIds, workshopId],
      }));
      return response.data.data;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  pollForRegistration: async (workshopId) => {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      await new Promise<void>((res) => setTimeout(res, POLL_INTERVAL_MS));
      try {
        const response = await api.get<{ success: boolean; data: RegistrationResponse[] }>(
          '/registrations',
          { params: { status: 'HOLDING,PENDING' } },
        );
        const found = response.data.data.find((r) => r.workshop.id === workshopId);
        if (found) return found.id;
      } catch {
        // swallow errors during polling — retry on next tick
      }
    }
    return null;
  },

  simulatePayment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/payments/webhook/mock', data);
      set({ isLoading: false });
    } catch (err: unknown) {
      set({
        error: (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Payment simulation failed',
        isLoading: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
