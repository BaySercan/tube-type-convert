import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  // In a real app, you might want to throw an error or handle this more gracefully
  console.error("VITE_SUPABASE_URL is not configured. Please check your .env file. App might not work as expected.");
  // throw new Error("VITE_SUPABASE_URL is not configured. Please check your .env file.");
}

if (!supabaseAnonKey) {
  // In a real app, you might want to throw an error or handle this more gracefully
  console.error("VITE_SUPABASE_ANON_KEY is not configured. Please check your .env file. App might not work as expected.");
  // throw new Error("VITE_SUPABASE_ANON_KEY is not configured. Please check your .env file.");
}

// It's okay to initialize with potentially undefined values if you want the app to load
// and show a message, rather than crashing, if env vars are missing.
// However, Supabase client itself might throw an error if URL is truly invalid.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Ensure that your .env file (which contains sensitive keys) is listed in your .gitignore file
// to prevent committing it to your repository.
// Example .gitignore line:
// .env
