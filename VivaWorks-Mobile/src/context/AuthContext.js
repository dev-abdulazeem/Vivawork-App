// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../constants/config';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setIsAuthenticated(true);
        // Always fetch fresh user from backend (shape: { user })
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Your backend: GET /api/auth/me -> { user: {...} }
      const response = await api.get('/auth/me');
      if (response.data?.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem(
          CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.data.user)
        );
      }
    } catch (error) {
      if (error.response?.status === 401) await logout();
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      // Your backend returns: { message, user, accessToken }
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;

      await AsyncStorage.multiSet([
        [CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken],
        [CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
      ]);

      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);

      // Fetch full profile (wallet, skills, etc.)
      await fetchUserProfile();

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.friendlyMessage || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: register does NOT return a token on your backend.
  // It returns { user } and sends a verification email instead.
  const register = async (userData) => {
    try {
      setIsLoading(true);
      // { email, password, firstName, lastName, isFreelancer, isBuyer }
      const response = await api.post('/auth/register', userData);
      return {
        success: true,
        requiresVerification: true,
        email: userData.email,
        user: response.data?.user,
      };
    } catch (error) {
      return { success: false, error: error.friendlyMessage || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      await api.post('/auth/verify-email', { email, code });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.friendlyMessage || 'Verification failed' };
    }
  };

  const resendCode = async (email) => {
    try {
      await api.post('/auth/resend-code', { email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.friendlyMessage || 'Could not resend code' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
      await AsyncStorage.multiRemove([
        CONFIG.STORAGE_KEYS.AUTH_TOKEN,
        CONFIG.STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = async (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    await AsyncStorage.setItem(
      CONFIG.STORAGE_KEYS.USER_DATA,
      JSON.stringify(updatedUser)
    );
  };

  const value = {
    user, token, isLoading, isAuthenticated,
    login, register, verifyEmail, resendCode, logout, updateUser, fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;