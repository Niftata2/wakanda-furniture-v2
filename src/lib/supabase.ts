import { createClient } from '@supabase/supabase-js';

// ✅ VERIFIED CORRECT URL (decoded from your anon key passport!)
const SUPABASE_URL = 'https://cezjfbbbmymrejipcmyo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlempmYmJibXltcmVqaXBjbXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDA1MDMsImV4cCI6MjEwMTY3NjUwM30.aXVbW1tOFQxAgHvdloIXstABAh92qxONYwR6IehBIwI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);