import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase project credentials for Kallani
const SUPABASE_PROJECT_URL = 'https://tdwoluyohdlkmwaswebw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_JUER2LkX4rAs3JdZOxN3Rg_aslZutyE';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY;

/**
 * Checks if Supabase connection credentials have been provided
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://')
  );
};

/**
 * Supabase client instance (connected to project tdwoluyohdlkmwaswebw)
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
