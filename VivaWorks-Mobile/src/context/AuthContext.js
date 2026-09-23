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

// Helper to extract error details from API response
const extractError = (error, defaultMessage) => {
  if (!error.response) {
    return {
      success: false,
      error: 'Network error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  }

  const { data, status } = error.response;
  
  return {
    success: false,
    error: data?.message || defaultMessage,
    code: data?.code || 'UNKNOWN_ERROR',
    status: status,
    errors: data?.errors || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Controls Splash Screen
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
        
        // 🚨 CRITICAL FIX: Parse and set the user IMMEDIATELY from storage.
        // This prevents the "undefined" UI flash or permanent undefined state on reload.
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          // If the stored data is corrupted, clear it to prevent future issues
          await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        }

        // Then, fetch fresh data in the background to update the cache
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false); // Hide splash after initial check
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      
      // Handle backend returning { user: { ... } }
      if (response.data?.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem(
          CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.data.user)
        );
      } 
      // Fallback: Handle backend returning { id: 1, firstName: "John", ... } directly
      else if (response.data?.id || response.data?.email) {
        setUser(response.data);
        await AsyncStorage.setItem(
          CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.data)
        );
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // 🚨 CRITICAL FIX: ONLY logout if it's a definitive 401 Unauthorized (token is actually invalid).
      // If it's a network error (e.g., user is offline), we keep the cached user 
      // so the app doesn't break and show "undefined".
      if (error.response?.status === 401) {
        console.log('Token invalid or expired. Logging out...');
        await logout();
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;

      // ✅ SUCCESS: Show splash screen for a smooth transition
      setIsLoading(true);

      await AsyncStorage.multiSet([
        [CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken],
        [CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
      ]);

      setToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);

      await fetchUserProfile();

      return { success: true, user: userData };
    } catch (error) {
      // ❌ FAILURE: Explicitly ensure loading is false so we stay on LoginScreen
      setIsLoading(false);
      return extractError(error, 'Login failed. Please try again.');
    } finally {
      // Turn off loading after successful transition so the Main App renders
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // ✅ SUCCESS: Show splash briefly before going to Verify Email
      setIsLoading(true);
      
      return {
        success: true,
        requiresVerification: true,
        email: userData.email,
        user: response.data?.user,
      };
    } catch (error) {
      // ❌ FAILURE: Stay on Register screen
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
        const { accessToken, user: userData } = response.data;
        
        // ✅ SUCCESS: Show splash screen while logging them in
        setIsLoading(true);

        await AsyncStorage.multiSet([
          [CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken],
          [CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
        ]);

        setToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (error) {
      // ❌ FAILURE: Stay on Verify screen
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
      // Show splash during logout transition
      setIsLoading(true);
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
      setIsLoading(false); // Hide splash, show Auth screens
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