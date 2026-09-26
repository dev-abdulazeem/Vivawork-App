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

// 🎯 SAFE FALLBACKS: Prevents crashes if CONFIG.STORAGE_KEYS is undefined
const KEYS = {
  AUTH_TOKEN: CONFIG.STORAGE_KEYS?.AUTH_TOKEN || '@vivaworks_auth_token',
  REFRESH_TOKEN: CONFIG.STORAGE_KEYS?.REFRESH_TOKEN || '@vivaworks_refresh_token',
  USER_DATA: CONFIG.STORAGE_KEYS?.USER_DATA || '@vivaworks_user_data',
};

const extractError = (error, defaultMessage) => {
  if (!error.response) {
    return {
      success: false,
      error: error.friendlyMessage || 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  }

  const { data, status } = error.response;

  return {
    success: false,
    error: error.friendlyMessage || data?.message || defaultMessage,
    code: error.code || data?.code || 'UNKNOWN_ERROR',
    status: status,
    errors: data?.errors || null,
  };
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
      const [storedToken, storedRefreshToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(KEYS.USER_DATA),
      ]);

      if (!storedRefreshToken) {
        await AsyncStorage.multiRemove([KEYS.AUTH_TOKEN, KEYS.USER_DATA]);
        setIsLoading(false);
        return;
      }

      if (storedToken && storedUser) {
        setToken(storedToken);

        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // 🎯 NEW: If the stored user is not verified, don't mark as fully authenticated yet
          if (parsedUser.isVerified === false) {
            console.log('⚠️ Stored user requires email verification');
            // We leave isAuthenticated as false so the app knows they aren't fully logged in
          } else {
            setIsAuthenticated(true);
            await fetchUserProfile();
          }
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          await AsyncStorage.removeItem(KEYS.USER_DATA);
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');

      if (response.data?.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(response.data.user));
      } else if (response.data?.id || response.data?.email) {
        setUser(response.data);
        await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      const isSessionExpired = error.response?.status === 401 || error.code === 'SESSION_EXPIRED';

      if (isSessionExpired) {
        console.log('Session expired. Logging out...');
        await logout();
      }
    }
  };

  const persistSession = async (accessToken, refreshToken, userData) => {
    const sets = [
      [KEYS.AUTH_TOKEN, accessToken],
      [KEYS.USER_DATA, JSON.stringify(userData)],
    ];
    if (refreshToken) {
      sets.push([KEYS.REFRESH_TOKEN, refreshToken]);
    }
    await AsyncStorage.multiSet(sets);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = response.data;

      // 🎯 SAVE TO STORAGE SO API CALLS WORK, BUT CHECK VERIFICATION FIRST
      await persistSession(accessToken, refreshToken, userData);
      setToken(accessToken);
      setUser(userData);

      // 🎯 NEW: If user is not verified, return a special flag instead of logging them in fully
      if (userData.isVerified === false) {
        console.log('⚠️ User logged in but requires email verification');
        return { success: true, requiresVerification: true, user: userData };
      }

      setIsLoading(true);
      setIsAuthenticated(true); // Only mark as fully authenticated if verified
      await fetchUserProfile();

      return { success: true, user: userData };
    } catch (error) {
      setIsLoading(false);
      return extractError(error, 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      setIsLoading(true);

      return {
        success: true,
        requiresVerification: true,
        email: userData.email,
        user: response.data?.user,
      };
    } catch (error) {
      setIsLoading(false);
      return extractError(error, 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await api.post('/auth/verify-email', { email, code });

      if (response.data?.accessToken) {
        const { accessToken, refreshToken, user: userData } = response.data;
        setIsLoading(true);

        await persistSession(accessToken, refreshToken, userData);
        setToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return extractError(error, 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async (email) => {
    try {
      const response = await api.post('/auth/resend-code', { email });
      return { success: true, message: response.data?.message };
    } catch (error) {
      return extractError(error, 'Could not resend code. Please try again.');
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, message: response.data?.message };
    } catch (error) {
      return extractError(error, 'Failed to send reset email. Please try again.');
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return { success: true, message: response.data?.message };
    } catch (error) {
      return extractError(error, 'Password reset failed. Please try again.');
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.post('/auth/logout').catch(() => {});

      // 🎯 SAFE REMOVE: Uses the guaranteed string fallbacks
      await AsyncStorage.multiRemove([
        KEYS.AUTH_TOKEN,
        KEYS.REFRESH_TOKEN,
        KEYS.USER_DATA,
      ]);

      delete api.defaults.headers.common.Authorization;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const updateUser = async (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    verifyEmail,
    resendCode,
    forgotPassword,
    resetPassword,
    logout,
    updateUser,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;