'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { apiLogin, apiSignup, apiLogout, apiUpdateUserSettings, apiGetUserSettings, apiVerifyEmail } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('finance_token');
    const storedUser = localStorage.getItem('finance_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('finance_user');
        localStorage.removeItem('finance_token');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      if (data.needsVerification) {
        return { user: null, error: null, needsVerification: true, email: data.email };
      }
      setUser(data.user);
      localStorage.setItem('finance_user', JSON.stringify(data.user));
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const signUp = async (email, password, name, base_currency) => {
    try {
      const data = await apiSignup(email, password, name, base_currency);
      if (data.needsVerification) {
        return { user: null, error: null, needsVerification: true, email: data.email };
      }
      setUser(data.user);
      localStorage.setItem('finance_user', JSON.stringify(data.user));
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const verifyEmail = async (email, code, token) => {
    try {
      const data = await apiVerifyEmail(email, code, token);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('finance_user', JSON.stringify(data.user));
      }
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const signOut = () => {
    apiLogout();
    setUser(null);
    localStorage.removeItem('finance_user');
  };

  const updateUser = async (updates) => {
    try {
      const updatedUser = await apiUpdateUserSettings(updates);
      setUser(updatedUser);
      localStorage.setItem('finance_user', JSON.stringify(updatedUser));
      return { user: updatedUser, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await apiGetUserSettings();
      setUser(freshUser);
      localStorage.setItem('finance_user', JSON.stringify(freshUser));
    } catch (e) {
      // token may be expired
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser, refreshUser, verifyEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
