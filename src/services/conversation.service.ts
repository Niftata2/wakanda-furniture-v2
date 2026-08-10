import { supabase } from '@/lib/supabase';

export class ConversationService {
  // Update conversation context
  static async updateContext(conversationId: string, context: any) {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('context')
      .eq('id', conversationId)
      .single();

    const existingContext = conversation?.context || {};
    const newContext = { ...existingContext, ...context };

    await supabase
      .from('conversations')
      .update({ context: newContext, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return newContext;
  }

  // Get conversation context
  static async getContext(conversationId: string) {
    const { data } = await supabase
      .from('conversations')
      .select('context')
      .eq('id', conversationId)
      .single();
    return data?.context || {};
  }

  // Update conversation intent
  static async updateIntent(conversationId: string, intent: string) {
    await supabase
      .from('conversations')
      .update({ current_intent: intent, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  // Update current product
  static async updateCurrentProduct(conversationId: string, productId: string) {
    await supabase
      .from('conversations')
      .update({ 
        current_product_id: productId, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', conversationId);
  }

  // Close conversation
  static async closeConversation(conversationId: string) {
    await supabase
      .from('conversations')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }
}