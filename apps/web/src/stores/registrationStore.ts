import { create } from 'zustand';
import { api } from '../lib/api';
import type { RegistrationResponse } from '@unihub/shared';

interface RegistrationState {
  registrations: RegistrationResponse[];
  currentRegistration: RegistrationResponse | null;
  isLoading: boolean;
  error: string | null;
  
  fetchRegistrations: (status?: string) => Promise<void>;
  fetchRegistration: (id: string) => Promise<RegistrationResponse>;
  registerForWorkshop: (workshopId: string) => Promise<{ jobId: string }>;
  simulatePayment: (data: { eventType: string; intentId: string; eventId: string }) => Promise<void>;
  clearError: () => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  registrations: [],
  currentRegistration: null,
  isLoading: false,
  error: null,

  fetchRegistrations: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<{ success: boolean; data: RegistrationResponse[] }>('/registrations', {
        params: { status },
      });
      set({ registrations: response.data.data, isLoading: false });
    } catch (err: unknown) {
      set({ 
        error: (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load registrations', 
        isLoading: false 
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
      // Use timestamp + random as basic idempotency key
      const idempotencyKey = `reg_${workshopId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const response = await api.post<{ success: boolean; data: { jobId: string } }>(
        `/workshops/${workshopId}/register`,
        {},
        { headers: { 'x-idempotency-key': idempotencyKey } }
      );
      set({ isLoading: false });
      return response.data.data;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  simulatePayment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/payments/webhook/mock', data);
      set({ isLoading: false });
    } catch (err: unknown) {
      set({ 
        error: (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Payment simulation failed', 
        isLoading: false 
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
