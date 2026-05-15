import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { api } from '../lib/api';

export type Role = 'STUDENT' | 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  role: Role;
  username?: string;
  fullName?: string | null;
  email?: string;
}

interface JWTPayload {
  sub: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  requestOtp: (username: string) => Promise<string>;
  verifyOtp: (username: string, otp: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token) => {
        try {
          const decoded = jwtDecode<JWTPayload>(token);
          set({
            token,
            isAuthenticated: true,
            user: {
              id: decoded.sub,
              role: decoded.role,
            },
          });
        } catch (err) {
          console.error('Failed to decode authentication token', err);
        }
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      requestOtp: async (username) => {
        const response = await api.post('/auth/login', { username });
        return response.data?.message || 'Verification code sent.';
      },
      verifyOtp: async (username, otp) => {
        const response = await api.post('/auth/verify-otp', { username, otp });
        const token = response.data?.data?.accessToken;
        if (!token) {
          throw new Error('Authentication response was missing valid tokens');
        }
        get().login(token);
      },
    }),
    {
      name: 'unihub-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
