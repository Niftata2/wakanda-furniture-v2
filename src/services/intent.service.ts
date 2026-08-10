import { supabase } from '@/lib/supabase';

export type Intent =
  | 'greeting'
  | 'browsing'
  | 'price_inquiry'
  | 'high_intent'
  | 'order_request'
  | 'custom_request'
  | 'complaint'
  | 'human_request'
  | 'general_question'
  | 'thanks';

const INTENT_PATTERNS = {
  en: {
    greeting: /\b(hi|hello|hey|good morning|good afternoon)\b/i,
    price_inquiry: /\b(how much|price|cost|price of|what's the price|pricing)\b/i,
    order_request: /\b(order|buy|purchase|i'll take|want to order|place order)\b/i,
    custom_request: /\b(custom|customiz|made to order|bespoke|special|build for me|design)\b/i,
    complaint: /\b(broken|damaged|problem|issue|wrong|defect|unhappy|disappointed|refund)\b/i,
    human_request: /\b(human|person|agent|representative|talk to someone|speak to)\b/i,
    thanks: /\b(thanks|thank you|appreciate|grateful)\b/i,
    browsing: /\b(show me|browse|looking for|need|want|search)\b/i,
  },
  am: {
    greeting: /ሰላም|ጤና ይስጥልኝ|እንዴት ነዎት/i,
    price_inquiry: /ስንት|ዋጋ|ዋጋው|ዋጋ ስንት/i,
    order_request: /እፈልጋለሁ|እገዛለሁ|ትዕዛዝ|ስጡኝ|ወስጃለሁ/i,
    custom_request: /በልዩ|ልዩ|ንድፍ|ልንሰራ|ንዲሰራ/i,
    complaint: /ችግር|በላይ|ተበላሸ|ስህተት|አልሆነም|ተመለስ/i,
    human_request: /ሰው|ሰራተኛ|ሃላፊ|ማነጋገር/i,
    thanks: /አመሰግናለሁ|እናመሰግናለን|ይቅርታ/i,
    browsing: /አሳየኝ|እፈልጋለሁ|እየፈለግኩ|ፈልግ/i,
  },
};

export class IntentService {
  static classify(message: string, language: 'en' | 'am'): Intent {
    const patterns = INTENT_PATTERNS[language];
    const lower = message.toLowerCase();

    // Check high-priority intents first
    if (patterns.human_request.test(lower)) return 'human_request';
    if (patterns.complaint.test(lower)) return 'complaint';
    if (patterns.order_request.test(lower)) return 'order_request';
    if (patterns.custom_request.test(lower)) return 'custom_request';
    if (patterns.price_inquiry.test(lower)) return 'price_inquiry';
    if (patterns.greeting.test(lower)) return 'greeting';
    if (patterns.thanks.test(lower)) return 'thanks';
    if (patterns.browsing.test(lower)) return 'browsing';

    return 'general_question';
  }

  // Update conversation intent + log analytics
  static async updateIntent(conversationId: string, telegramId: number, intent: Intent) {
    await Promise.all([
      supabase.from('conversations').update({
        current_intent: intent,
        updated_at: new Date().toISOString(),
      }).eq('id', conversationId),

      supabase.from('analytics_events').insert({
        telegram_id: telegramId,
        event_type: 'intent_detected',
        metadata: { intent },
      }),
    ]);
  }

  // Determine if intent requires owner notification
  static isHighPriority(intent: Intent): boolean {
    return ['order_request', 'custom_request', 'complaint', 'human_request'].includes(intent);
  }

  // Get notification type for owner
  static getNotificationType(intent: Intent): string {
    const map: Record<Intent, string> = {
      greeting: 'new_lead',
      browsing: 'product_interest',
      price_inquiry: 'product_interest',
      high_intent: 'high_intent',
      order_request: 'order_request',
      custom_request: 'custom_request',
      complaint: 'complaint',
      human_request: 'human_request',
      general_question: 'new_lead',
      thanks: 'new_lead',
    };
    return map[intent];
  }
}