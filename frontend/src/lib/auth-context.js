import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('finance_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('finance_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error) throw new Error(error.message || 'Database error');
      if (!users || users.length === 0) throw new Error('Invalid email or password');

      const dbUser = users[0];
      const isValid = await bcrypt.compare(password, dbUser.password_hash);
      if (!isValid) throw new Error('Invalid email or password');

      const { password_hash, ...userWithoutPassword } = dbUser;
      setUser(userWithoutPassword);
      localStorage.setItem('finance_user', JSON.stringify(userWithoutPassword));
      return { user: userWithoutPassword, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const signUp = async (email, password, name, base_currency) => {
    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (existing && existing.length > 0) throw new Error('Email already registered');

      const password_hash = await bcrypt.hash(password, 10);
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: email.toLowerCase(),
          password_hash,
          name,
          base_currency,
          distribution_mode: 'both',
          default_view: 'month',
          use_hebrew_calendar: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw new Error(error.message || 'Failed to create account');

      const { password_hash: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem('finance_user', JSON.stringify(userWithoutPassword));

      // Send admin notification (fire and forget)
      try {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/email/signup-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_name: name, user_email: email.toLowerCase() })
        });
      } catch (_) { /* non-blocking */ }

      return { user: userWithoutPassword, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('finance_user');
  };

  const updateUser = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const { password_hash: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);
      localStorage.setItem('finance_user', JSON.stringify(userWithoutPassword));
      return { user: userWithoutPassword, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
