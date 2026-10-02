import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../constants/config';

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: CONFIG.API_TIMEOUT || 30000,
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
      const storageKeys = CONFIG?.STORAGE_KEYS || {};
      const tokenKey = storageKeys.AUTH_TOKEN || '@vivaworks_auth_token';
      
      const token = await AsyncStorage.getItem(tokenKey);
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
// Response interceptor - Handle errors cleanly
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    // 1. Handle Network Errors (Offline, Server Down, or Timeout)
    if (!error.response) {
      return Promise.reject({
        ...error,
        friendlyMessage: 'Network error. Please check your internet connection or backend server.',
      });
    }

    // 2. Handle Expired Tokens (401 Unauthorized)
    // Instead of trying to refresh (which causes the 404 error), 
    // we just clear the storage and tell the app the session is dead.
    if (error.response.status === 401) {
      const storageKeys = CONFIG?.STORAGE_KEYS || {};
      
      // Clear all auth-related data from storage
      await AsyncStorage.multiRemove([
        storageKeys.AUTH_TOKEN || '@vivaworks_auth_token',
        storageKeys.REFRESH_TOKEN || '@vivaworks_refresh_token',
        storageKeys.USER_DATA || '@vivaworks_user_data',
      ]);

      // Clear default headers so subsequent requests don't use the bad token
      delete api.defaults.headers.common.Authorization;

      return Promise.reject({
        ...error,
        code: 'SESSION_EXPIRED',
        friendlyMessage: 'Session expired. Please log in again.',
      });
    }

    // 3. Handle all other backend errors
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