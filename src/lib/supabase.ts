import { createClient } from '@supabase/supabase-js';

// 🚀 HARDCODED URL (Supabase URLs are public, this bypasses Vercel env var bugs!)
const supabaseUrl = 'https://cezjftbbbmyymrejjpcmyo.supabase.co';
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlempmYmJibXltcmVqaXBjbXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDA1MDMsImV4cCI6MjEwMTY3NjUwM30.aXVbW1tOFQxAgHvdloIXstABAh92qxONYwR6IehBIwI').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);