import { supabase } from '@/lib/supabase';

// In-memory rate limit store (resets on cold start - fine for small scale)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_CONFIG = {
  messagesPerMinute: parseInt(process.env.RATE_LIMIT_MESSAGES_PER_MINUTE || '20'),
  cooldownSeconds: parseInt(process.env.RATE_LIMIT_COOLDOWN_SECONDS || '2'),
};

export class RateLimitService {
  // Check if a user is rate limited
  static isRateLimited(telegramId: number): { limited: boolean; retryAfter: number } {
    const key = `user:${telegramId}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + 60 * 1000, // reset after 1 minute
      });
      return { limited: false, retryAfter: 0 };
    }

    if (entry.count >= RATE_LIMIT_CONFIG.messagesPerMinute) {
      return {
        limited: true,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    entry.count++;
    return { limited: false, retryAfter: 0 };
  }

  // Check cooldown between messages (anti-spam)
  static hasCooldown(telegramId: number): boolean {
    const key = `cooldown:${telegramId}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (entry && entry.resetAt > now) return true;

    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_CONFIG.cooldownSeconds * 1000,
    });
    return false;
  }

  // Prevent duplicate processing of same message
  static isDuplicate(messageId: number): boolean {
    const key = `msg:${messageId}`;
    if (rateLimitStore.has(key)) return true;
    rateLimitStore.set(key, { count: 1, resetAt: Date.now() + 5 * 60 * 1000 });
    return false;
  }
}