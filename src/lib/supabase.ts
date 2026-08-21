import { createClient } from '@supabase/supabase-js';

const clean = (v: string | undefined, fallback: string) => (v || '').trim().replace(/^['"]|['"]$/g, '') || fallback;

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://cezjfbbbmymrejipcmyo.supabase.co');
const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlempmYmJibXltcmVqaXBjbXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDA1MDMsImV4cCI6MjEwMTY3NjUwM30.aXVbW1tOFQxAgHvdloIXstABAh92qxONYwR6IehBIwI');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);