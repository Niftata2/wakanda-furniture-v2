import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET() {
  const health: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {},
  };

  // Check Supabase
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    health.services.database = error ? 'degraded' : 'ok';
  } catch {
    health.services.database = 'error';
  }

  // Check Gemini API
  try {
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (GEMINI_KEY) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`
      );
      health.services.gemini = res.ok ? 'ok' : 'error';
    } else {
      health.services.gemini = 'not_configured';
    }
  } catch {
    health.services.gemini = 'error';
  }

  // Check Telegram
  try {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (TOKEN) {
      const res = await fetch(`https://api.telegram.org/bot${TOKEN}/getMe`);
      const data = await res.json();
      health.services.telegram = data.ok ? 'ok' : 'error';
      health.services.bot_username = data.result?.username || 'unknown';
    } else {
      health.services.telegram = 'not_configured';
    }
  } catch {
    health.services.telegram = 'error';
  }

  // Overall status
  const hasError = Object.values(health.services).some(s => s === 'error');
  if (hasError) health.status = 'degraded';

  return NextResponse.json(health, { status: hasError ? 503 : 200 });
}