import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://hnunzdvyqgivzeegxbvk.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhudW56ZHZ5cWdpdnplZWd4YnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MzQxNTgsImV4cCI6MjA4MTUxMDE1OH0.uTNRCgUoPWUvdGtm_tkUX1gyMic4ROikwmHF1b5kzX8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions using Supabase client
export const db = {
  // Users
  users: {
    getByEmail: async (email) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      return { data, error };
    },
    
    create: async (userData) => {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      return { data, error };
    },
    
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }
  },
  
  // Transactions
  transactions: {
    getByUserAndDateRange: async (userId, startDate, endDate) => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      return { data, error };
    },
    
    create: async (transactionData) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();
      return { data, error };
    },
    
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },
    
    delete: async (id) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      return { error };
    }
  },
  
  // Lends (only used when distribution_mode !== 'give_only')
  lends: {
    getByUser: async (userId) => {
      const { data, error } = await supabase
        .from('lends')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      return { data, error };
    },
    
    create: async (lendData) => {
      const { data, error } = await supabase
        .from('lends')
        .insert([lendData])
        .select()
        .single();
      return { data, error };
    },
    
    delete: async (id) => {
      const { error } = await supabase
        .from('lends')
        .delete()
        .eq('id', id);
      return { error };
    }
  }
};
