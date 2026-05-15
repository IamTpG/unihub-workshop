import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Extend Axios Request Config to keep track of refresh attempts
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY,
  },
});

// Tracking state for silent token refreshing
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request Interceptor to append JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle expired tokens silently
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If the 401 happened ON the refresh endpoint, immediately boot to log out
      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Fire the refresh request - HttpOnly cookie is attached automatically by browser
        const response = await api.post('/auth/refresh');
        const newToken = response.data?.data?.accessToken;

        if (!newToken) {
          throw new Error('Authentication tokens missing in refresh response');
        }

        // Rehydrate client state
        useAuthStore.getState().login(newToken);

        // Dispatch and resolve any queued promises that stacked up while waiting
        processQueue(null, newToken);

        // Retry original failed request with refreshed auth token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
