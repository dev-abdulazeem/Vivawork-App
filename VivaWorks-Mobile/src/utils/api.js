// src/utils/api.js

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../constants/config';

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Request interceptor - Add auth token to every request
// ============================================
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// Refresh token state (shared across all requests)
// ============================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Endpoints that must NEVER trigger a refresh retry
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// ============================================
// Response interceptor - refresh expired tokens
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    // Network error (offline, server down) — no response object
    if (!error.response) {
      return Promise.reject({
        ...error,
        friendlyMessage: 'Network error. Please check your internet connection.',
      });
    }

    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));

    // Token expired -> try to refresh it ONCE, then retry the original request
    if (error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // Another request is already refreshing — queue this one
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN
        );

        if (!refreshToken) {
          throw new Error('No refresh token stored');
        }

        // IMPORTANT: raw axios call, NOT `api`, so interceptors don't loop
        const { data } = await axios.post(`${CONFIG.API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = data;

        const storageSets = [[CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken]];
        // Save rotated refresh token if the backend issues a new one
        if (data.refreshToken) {
          storageSets.push([CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken]);
        }
        await AsyncStorage.multiSet(storageSets);

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh token is also dead -> wipe the session.
        // AuthContext will detect this and route to the login screen.
        await AsyncStorage.multiRemove([
          CONFIG.STORAGE_KEYS.AUTH_TOKEN,
          CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
          CONFIG.STORAGE_KEYS.USER_DATA,
        ]);

        return Promise.reject({
          ...error,
          code: 'SESSION_EXPIRED',
          friendlyMessage: 'Session expired. Please log in again.',
        });
      } finally {
        isRefreshing = false;
      }
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    return Promise.reject({
      ...error,
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      friendlyMessage: errorMessage,
    });
  }
);

// ============================================
// Helper methods
// ============================================
export const apiGet = (url, params = {}) => api.get(url, { params });
export const apiPost = (url, data = {}) => api.post(url, data);
export const apiPut = (url, data = {}) => api.put(url, data);
export const apiPatch = (url, data = {}) => api.patch(url, data);
export const apiDelete = (url) => api.delete(url);

export default api;