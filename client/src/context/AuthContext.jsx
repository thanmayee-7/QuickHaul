import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [activePortal, setActivePortal] = useState('customer'); // 'customer' | 'driver' | 'admin'
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Initialize session or default to customer Alex Morgan for seamless out-of-the-box demo
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          if (res.driverProfile) setDriverProfile(res.driverProfile);
          if (res.user.role === 'admin') setActivePortal('admin');
          else if (res.user.role === 'driver') setActivePortal('driver');
          else setActivePortal('customer');
        } catch (err) {
          console.warn('Session expired or invalid, auto-logging into default customer persona');
          await switchPersona('customer');
        }
      } else {
        // Auto-login default persona for zero-friction evaluation
        await switchPersona('customer');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Fetch notifications periodically
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      const unread = (res.notifications || []).filter(n => !n.is_read).length;
      setUnreadNotifsCount(unread);
    } catch (err) {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setUser(res.user);
    if (res.driverProfile) setDriverProfile(res.driverProfile);
    if (res.user.role === 'admin') setActivePortal('admin');
    else if (res.user.role === 'driver') setActivePortal('driver');
    else setActivePortal('customer');
    setAuthModalOpen(false);
    fetchNotifications();
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    setAuthToken(res.token);
    setUser(res.user);
    if (res.driverProfile) setDriverProfile(res.driverProfile);
    if (res.user.role === 'admin') setActivePortal('admin');
    else if (res.user.role === 'driver') setActivePortal('driver');
    else setActivePortal('customer');
    setAuthModalOpen(false);
    fetchNotifications();
    return res;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setDriverProfile(null);
    setActivePortal('customer');
    setNotifications([]);
    setUnreadNotifsCount(0);
  };

  // Quick Persona switcher for immediate demo & testing of Customer, Driver, and Admin flows!
  const switchPersona = async (personaRole) => {
    try {
      let email = 'customer@quickhaul.com';
      let password = 'pass123';

      if (personaRole === 'driver') {
        email = 'ramesh.driver@quickhaul.com';
        password = 'pass123';
      } else if (personaRole === 'driver_pending') {
        email = 'vikram.driver@quickhaul.com';
        password = 'pass123';
      } else if (personaRole === 'admin') {
        email = 'admin@quickhaul.com';
        password = 'admin123';
      } else if (personaRole === 'customer_priya') {
        email = 'priya@quickhaul.com';
        password = 'pass123';
      }

      const res = await api.login({ email, password });
      setAuthToken(res.token);
      setUser(res.user);
      setDriverProfile(res.driverProfile || null);

      if (personaRole === 'admin') setActivePortal('admin');
      else if (personaRole === 'driver' || personaRole === 'driver_pending') setActivePortal('driver');
      else setActivePortal('customer');

      fetchNotifications();
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  // Switch portal and automatically align persona if role differs
  const switchPortal = async (portal) => {
    setActivePortal(portal);
    if (portal === 'admin' && user?.role !== 'admin') {
      await switchPersona('admin');
    } else if (portal === 'driver' && user?.role !== 'driver') {
      await switchPersona('driver');
    } else if (portal === 'customer' && user?.role !== 'customer') {
      await switchPersona('customer');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      if (res.driverProfile) setDriverProfile(res.driverProfile);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        driverProfile,
        activePortal,
        setActivePortal,
        switchPortal,
        loading,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        notifications,
        unreadNotifsCount,
        login,
        register,
        logout,
        switchPersona,
        refreshUser,
        fetchNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
