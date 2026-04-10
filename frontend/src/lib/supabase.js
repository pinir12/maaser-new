import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://mznzgekkzbollftoxfma.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bnpnZWtremJvbGxmdG94Zm1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTA4MDE5OCwiZXhwIjoyMDMwNjU2MTk4fQ.GwDiacV8UXB6MJoSECjmZ_fObXB1lIVEJVsYGCdz5Ow';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});
