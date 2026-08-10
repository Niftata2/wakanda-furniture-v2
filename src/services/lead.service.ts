import { supabase } from '@/lib/supabase';

export interface LeadData {
  telegram_user_id: string;
  conversation_id: string;
  telegram_id: number;
  customer_name?: string;
  phone?: string;
  email?: string;
  product_id?: string;
  product_name?: string;
  quantity?: number;
  budget_range?: string;
  room_type?: string;
  customization_requirements?: string;
  delivery_location?: string;
  message?: string;
  language?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  source?: 'website' | 'telegram' | 'deep_link' | 'qr_code';
}

export class LeadService {
  // Create a new lead
  static async createLead(data: LeadData) {
    const { data: lead, error } = await supabase
      .from('leads')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Failed to create lead:', error);
      return null;
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      telegram_id: data.telegram_id,
      event_type: 'lead_created',
      product_id: data.product_id,
      metadata: { lead_id: lead.id, priority: data.priority, source: data.source },
    });

    return lead;
  }

  // Update lead
  static async updateLead(leadId: string, updates: any) {
    const { data } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', leadId)
      .select()
      .single();
    return data;
  }

  // Create custom furniture request
  static async createCustomRequest(leadId: string, telegramId: number, details: {
    furniture_type?: string;
    dimensions?: string;
    material?: string;
    color?: string;
    style?: string;
    quantity?: number;
    budget?: string;
    reference_image_url?: string;
    description?: string;
  }) {
    const { data } = await supabase
      .from('custom_requests')
      .insert({
        lead_id: leadId,
        telegram_id: telegramId,
        ...details,
      })
      .select()
      .single();

    await supabase.from('analytics_events').insert({
      telegram_id: telegramId,
      event_type: 'custom_request_created',
      metadata: { request_id: data?.id },
    });

    return data;
  }

  // Get conversation flow state
  static async getFlowState(conversationId: string): Promise<any> {
    const { data } = await supabase
      .from('conversations')
      .select('context, current_intent, current_product_id')
      .eq('id', conversationId)
      .single();

    return data || { context: {}, current_intent: null, current_product_id: null };
  }

  // Update conversation flow state
  static async setFlowState(conversationId: string, state: {
    flow?: string;
    step?: string;
    data?: any;
    intent?: string;
  }) {
    const current = await this.getFlowState(conversationId);
    const newContext = {
      ...current.context,
      flow: state.flow || current.context?.flow,
      step: state.step || current.context?.step,
      collected_data: {
        ...(current.context?.collected_data || {}),
        ...(state.data || {}),
      },
    };

    await supabase
      .from('conversations')
      .update({
        context: newContext,
        current_intent: state.intent || current.current_intent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return newContext;
  }

  // Clear flow state (when done)
  static async clearFlowState(conversationId: string) {
    const current = await this.getFlowState(conversationId);
    const newContext = {
      ...current.context,
      flow: null,
      step: null,
    };

    await supabase
      .from('conversations')
      .update({
        context: newContext,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
  }
}
