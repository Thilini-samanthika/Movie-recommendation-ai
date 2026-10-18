import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser as apiLogin, registerUser as apiRegister, fetchUserProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    initialMode: 'login', // 'login' or 'register'
    pendingAction: null,   // Callback or payload to trigger post-authentication
    message: '',
  });

  // Verify and restore authenticated session on initial mount / refresh
  const restoreSession = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      // Validate token against backend verified profile
      const profile = await fetchUserProfile();
      if (profile && profile.id != null) {
        setUser({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          role: profile.role,
        });
        setToken(storedToken);
      } else {
        throw new Error('Invalid user profile response');
      }
    } catch (err) {
      console.warn('Session verification failed, resetting token:', err.message);
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userRole');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Login handler with real backend-verified identity and role
  const login = async (usernameOrEmail, password) => {
    const data = await apiLogin({ username: usernameOrEmail, password });
    if (!data.token) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);

    const authenticatedUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
    };

    setUser(authenticatedUser);
    localStorage.setItem('userProfile', JSON.stringify(authenticatedUser));
    localStorage.setItem('userRole', data.role || 'ROLE_USER');

    // Execute pending post-auth action if one was queued
    if (authModalState.pendingAction) {
      try {
        authModalState.pendingAction(authenticatedUser);
      } catch (err) {
        console.error('Pending post-auth action failed:', err);
      }
    }
    closeAuthModal();

    return authenticatedUser;
  };

  // Register handler
  const register = async (username, email, password) => {
    const data = await apiRegister({ username, email, password });
    return data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    setToken(null);
    setUser(null);
  };

  // Auth modal management
  const openAuthModal = (initialMode = 'login', pendingAction = null, message = '') => {
    setAuthModalState({
      isOpen: true,
      initialMode,
      pendingAction,
      message,
    });
  };

  const closeAuthModal = () => {
    setAuthModalState({
      isOpen: false,
      initialMode: 'login',
      pendingAction: null,
      message: '',
    });
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user && user.role === 'ROLE_ADMIN');

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        authModalState,
        openAuthModal,
        closeAuthModal,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
