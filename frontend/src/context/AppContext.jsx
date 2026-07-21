import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  const toggleThemeMode = useCallback(() => {
    setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const [institutions, setInstitutions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const login = useCallback((userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const fetchInstitutions = useCallback(async (force = false) => {
    if (institutions.length > 0 && !force) return;
    try {
      const res = await api.get('/institutions');
      setInstitutions(res.data.data || res.data);
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
    }
  }, [institutions.length]);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await api.get('/notifications');
      const unreads = (res.data.data || res.data || []).filter(n => !n.read).length;
      setUnreadCount(unreads);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const streamUrl = `http://${window.location.hostname}:5000/api/notifications/stream?token=${token}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        showSnackbar(`🔔 ${newNotification.title}: ${newNotification.message}`, 'info');
        setUnreadCount(prev => prev + 1);
      } catch (err) {
        console.error('Failed to parse incoming notification event:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('Real-time notification stream connection closed or error. Reconnecting...');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user, showSnackbar]);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      institutions, fetchInstitutions,
      snackbar, showSnackbar, hideSnackbar,
      loading, setLoading,
      themeMode, toggleThemeMode,
      unreadCount, fetchUnreadCount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
