import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables in various environments (Vite, Next.js, etc.)
const getEnv = (key: string) => {
  // Check for Vite environment variables
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // Check for standard process.env (Node/Vercel)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

// Using provided keys as fallback/default
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || "https://erxxghveojxtqebxcbwp.supabase.co";
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyeHhnaHZlb2p4dHFlYnhjYndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzMzOTksImV4cCI6MjA4MDI0OTM5OX0.riA2nTDegyWEaWBVw0ACWUnZbRPIZAqgiT-EiVRkWC4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);