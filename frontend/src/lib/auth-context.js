import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
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
      // Use Supabase client directly
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Database connection error');
      }

      if (!users || users.length === 0) {
        throw new Error('Invalid email or password');
      }

      const dbUser = users[0];

      // Verify password
      const isValid = await bcrypt.compare(password, dbUser.password_hash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      // Remove password hash before storing
      const { password_hash, ...userWithoutPassword } = dbUser;
      
      setUser(userWithoutPassword);
      localStorage.setItem('finance_user', JSON.stringify(userWithoutPassword));
      
      return { user: userWithoutPassword, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: error.message || 'Sign in failed' };
    }
  };

  const signUp = async (email, password, name, base_currency) => {
    try {
      // Check if user already exists
      const { data: existing, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (checkError) {
        console.error('Supabase check error:', checkError);
        throw new Error(checkError.message || 'Database connection error');
      }

      if (existing && existing.length > 0) {
        throw new Error('Email already registered');
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          email: email.toLowerCase(),
          password_hash,
          name,
          base_currency,
          distribution_mode: 'both',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(insertError.message || 'Failed to create account');
      }

      const { password_hash: _, ...userWithoutPassword } = newUser;
      
      setUser(userWithoutPassword);
      localStorage.setItem('finance_user', JSON.stringify(userWithoutPassword));
      
      return { user: userWithoutPassword, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error: error.message || 'Registration failed' };
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

      if (error) {
        console.error('Update error:', error);
        throw new Error(error.message || 'Update failed');
      }

      const { password_hash: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);
      localStorage.setItem('finance_user', JSON.stringify(userWithoutPassword));
      
      return { user: userWithoutPassword, error: null };
    } catch (error) {
      console.error('Update user error:', error);
      return { user: null, error: error.message || 'Update failed' };
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
