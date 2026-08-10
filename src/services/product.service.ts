import { supabase } from '@/lib/supabase';

export class ProductService {
  static async getCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    return data || [];
  }

  static async getProductsByCategory(category: string, limit = 5) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('in_stock', true)
      .limit(limit);
    return data || [];
  }

  static async getProductById(id: string) {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    return data;
  }

  static async getFeaturedProducts(limit = 8) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('in_stock', true)
      .limit(limit);
    return data || [];
  }
}