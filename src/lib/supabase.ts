import { createClient } from '@supabase/supabase-js';

// 🛡️ BULLETPROOF: Hardcoded to bypass Vercel environment variable caching!
// 👇 MAKE SURE THIS URL MATCHES EXACTLY WHAT IS IN YOUR SUPABASE DASHBOARD (Settings -> API -> Project URL)
const SUPABASE_URL = 'https://cezjftbbbmyymrejjpcmyo.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlempmYmJibXltcmVqaXBjbXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDA1MDMsImV4cCI6MjEwMTY3NjUwM30.aXVbW1tOFQxAgHvdloIXstABAh92qxONYwR6IehBIwI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);