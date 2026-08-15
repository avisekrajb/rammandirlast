import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { getToken, setToken, removeToken, setUser, getUser, removeUser } from '../services/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const tokenCheckInterval = useRef(null);

  // Initialize auth on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initAuth = async () => {
      try {
        const token = getToken();
        const storedUser = getUser();
        
        if (token && storedUser) {
          // Set user from localStorage
          setUserState(storedUser);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token is still valid
          try {
            const response = await api.get('/auth/me');
            // Update user data if changed
            if (response.data.user) {
              const updatedUser = { ...storedUser, ...response.data.user };
              setUserState(updatedUser);
              setUser(updatedUser);
            }
          } catch (error) {
            // Token expired or invalid - clear it silently
            console.log('Token verification failed, clearing session');
            removeToken();
            removeUser();
            setUserState(null);
            delete api.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear any corrupt data
        removeToken();
        removeUser();
        setUserState(null);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      // Store token and user data
      setToken(token);
      setUser(userData);
      setUserState(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  }, []);

  // Signup function
  const signup = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      const { token, user: newUser } = response.data;
      
      // Store token and user data
      setToken(token);
      setUser(newUser);
      setUserState(newUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Signup failed' 
      };
    }
  }, []);

  // Google OAuth Login
  const googleAuth = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/google', userData);
      const { token, user: googleUser } = response.data;
      
      // Store token and user data
      setToken(token);
      setUser(googleUser);
      setUserState(googleUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user: googleUser };
    } catch (error) {
      console.error('Google auth error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Google authentication failed' 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    removeToken();
    removeUser();
    setUserState(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  // Update user function
  const updateUser = useCallback((updatedUser) => {
    setUserState(updatedUser);
    setUser(updatedUser);
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return null;
      
      const response = await api.get('/auth/me');
      if (response.data.user) {
        const updatedUser = { ...user, ...response.data.user };
        setUserState(updatedUser);
        setUser(updatedUser);
        return updatedUser;
      }
      return null;
    } catch (error) {
      console.error('Refresh user error:', error);
      return null;
    }
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'admin' || user?.role === 'superadmin';
  }, [user]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user && !!getToken();
  }, [user]);

  // Get user's display name
  const getDisplayName = useCallback(() => {
    return user?.name || 'User';
  }, [user]);

  // Get user's profile photo
  const getProfilePhoto = useCallback(() => {
    return user?.profilePhoto || null;
  }, [user]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        signup,
        googleAuth,
        logout, 
        setUser: updateUser,
        refreshUser,
        isAdmin,
        isAuthenticated,
        getDisplayName,
        getProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};