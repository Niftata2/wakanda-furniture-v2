import { supabase } from '@/lib/supabase';

export class LeadService {
  static async createLead(data: any) {
    // Remove undefined or null values to prevent database errors
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v != null && v !== '')
    );

    const { data: lead, error } = await supabase.from('leads').insert(cleanData).select().single();
    if (error) {
      console.error('Lead creation error:', error.message);
      return null;
    }
    return lead;
  }

  static async updateLead(id: string, updates: any) {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) console.error('Lead update error:', error.message);
    return data;
  }
}