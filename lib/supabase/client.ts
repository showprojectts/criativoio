
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables
const getEnv = (key: string) => {
  try {
    // 1. Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    // 2. Process (Node/Next.js)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors in restricted environments
  }
  return undefined;
};

// Hardcoded fallbacks to ensure the app works in preview environments without .env files
const FALLBACK_URL = "https://erxxghveojxtqebxcbwp.supabase.co";
const FALLBACK_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyeHhnaHZlb2p4dHFlYnhjYndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzMzOTksImV4cCI6MjA4MDI0OTM5OX0.riA2nTDegyWEaWBVw0ACWUnZbRPIZAqgiT-EiVRkWC4";

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || FALLBACK_URL;
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || FALLBACK_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Key is strictly missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
