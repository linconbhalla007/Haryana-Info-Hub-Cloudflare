import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { loginAdmin } from '../services/adminApi.js';

// TODO: Replace localStorage auth with secure JWT/session authentication

const AdminAuthContext = createContext(null);

const STORAGE_KEY = 'haryana_admin_session';

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem(STORAGE_KEY);
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed && parsed.username) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse admin session from localStorage:', e);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await loginAdmin(username, password);
    
    // Normalize response user info
    const userInfo = {
      username: (res.user && res.user.username) || username,
      role: (res.user && res.user.role) || 'admin',
      loggedInAt: new Date().toISOString(),
    };

    setUser(userInfo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
    return res;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
