import { create } from 'zustand';
import { api } from '../lib/api';
import { useAuthStore } from './authStore';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (n: Notification) => void;
  initSSE: () => void;
  teardownSSE: () => void;
}

let sseInstance: EventSource | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications');
      const data = response.data?.data;
      set({
        notifications: data?.items ?? [],
        unreadCount: data?.unreadCount ?? 0,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently ignore — optimistic update not applied on failure
    }
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently ignore
    }
  },

  addNotification: (n: Notification) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  initSSE: () => {
    if (sseInstance) return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    const baseUrl = import.meta.env.VITE_API_URL as string;
    const url = `${baseUrl}/notifications/stream?token=${encodeURIComponent(token)}`;

    sseInstance = new EventSource(url);

    sseInstance.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Notification & { timestamp: string };
        get().addNotification(data);
      } catch {
        // ignore malformed events
      }
    };

    sseInstance.onopen = () => {
      // Re-fetch history on reconnect to cover any events missed while disconnected
      get().fetchNotifications();
    };

    sseInstance.onerror = () => {
      // EventSource reconnects automatically; no manual retry needed
    };
  },

  teardownSSE: () => {
    sseInstance?.close();
    sseInstance = null;
    set({ notifications: [], unreadCount: 0, isLoading: false });
  },
}));
