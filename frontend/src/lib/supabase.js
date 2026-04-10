import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://hnunzdvyqgivzeegxbvk.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhudW56ZHZ5cWdpdnplZWd4YnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MzQxNTgsImV4cCI6MjA4MTUxMDE1OH0.uTNRCgUoPWUvdGtm_tkUX1gyMic4ROikwmHF1b5kzX8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema for reference:
// users: id, email, password_hash, name, base_currency, distribution_mode, created_at
// transactions: id, user_id, description, amount, currency, exchange_rate_to_base, type (give/lend), give_percentage, lend_percentage, date, hebrew_date, created_at
// lends: id, user_id, transaction_id, recipient_name, amount, currency, exchange_rate_to_base, date, hebrew_date, created_at
