/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/resources';

const AuthContext = createContext(null);

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  const fetchMe = async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
      localStorage.setItem('user_role', data.role);
      localStorage.setItem('user_name', data.first_name || data.username || '');
      return data;
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_name');
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      if (accessToken) {
        const tokenPayload = decodeJwtPayload(accessToken);
        if (tokenPayload?.role) {
          setUser((prev) => ({
            ...prev,
            role: tokenPayload.role,
            username: tokenPayload.username || prev?.username,
          }));
        }
        await fetchMe();
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    return data;
  };

  const login = async ({ username, password }) => {
    const { data } = await authApi.login({ username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const me = await fetchMe();
    return me;
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // ignore logout failures and clear local state anyway
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
