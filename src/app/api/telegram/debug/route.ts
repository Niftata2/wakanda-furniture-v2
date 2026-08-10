import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MISSING';
  const token = process.env.TELEGRAM_BOT_TOKEN || 'MISSING';

  const { data, error } = await supabase.from('telegram_users').select('*').limit(1);

  return NextResponse.json({
    supabaseUrl: url.slice(0, 30),
    anonKeyStart: key.slice(0, 12),
    hasBotToken: token !== 'MISSING',
    dbError: error ? error.message : 'NONE - DB WORKS!',
    rowsFound: data ? data.length : 0,
  });
}