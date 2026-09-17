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

// Request interceptor - Add auth token to every request
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear stored auth data
        await AsyncStorage.multiRemove([
          CONFIG.STORAGE_KEYS.AUTH_TOKEN,
          CONFIG.STORAGE_KEYS.USER_DATA,
        ]);
        
        // You can dispatch a logout action here if using context
        // For now, we'll just reject
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
    }

    // Format error message
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      'Something went wrong';

    return Promise.reject({
      ...error,
      friendlyMessage: errorMessage,
    });
  }
);

// Helper methods
export const apiGet = (url, params = {}) => api.get(url, { params });
export const apiPost = (url, data = {}) => api.post(url, data);
export const apiPut = (url, data = {}) => api.put(url, data);
export const apiPatch = (url, data = {}) => api.patch(url, data);
export const apiDelete = (url) => api.delete(url);

export default api;