import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  old_price?: number;
  badge?: string;
  image_url: string;
  short_description?: string;
  description?: string;
  features?: string[];
  dimensions?: string;
  materials?: string;
  colors?: string[];
  in_stock: boolean;
  customizable: boolean;
  is_featured: boolean;
}

export class ProductService {
  // Get all categories
  static async getCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    return data || [];
  }

  // Get products by category
  static async getProductsByCategory(category: string, limit = 10) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  // Get featured products
  static async getFeaturedProducts(limit = 5) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return data || [];
  }

  // Get single product by ID
  static async getProductById(productId: string): Promise<Product | null> {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    return data;
  }

  // Search products
  static async searchProducts(query: string, limit = 10) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);
    return data || [];
  }

  // Recommend products based on preferences
  static async recommendProducts(preferences: {
    category?: string;
    budgetMin?: number;
    budgetMax?: number;
    style?: string;
  }, limit = 5) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('in_stock', true);

    if (preferences.category) {
      query = query.eq('category', preferences.category);
    }

    if (preferences.budgetMin) {
      query = query.gte('price', preferences.budgetMin);
    }

    if (preferences.budgetMax) {
      query = query.lte('price', preferences.budgetMax);
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  // Format product for Telegram display
  static formatProductCard(product: Product, language: 'en' | 'am') {
    const price = product.price.toLocaleString();
    const oldPrice = product.old_price ? ` ~~${product.old_price.toLocaleString()}~~` : '';
    
    const title = language === 'am' 
      ? `🛋️ <b>${product.name}</b>` 
      : `🛋️ <b>${product.name}</b>`;
    
    const category = language === 'am'
      ? `📂 ምድብ: ${product.category}`
      : `📂 Category: ${product.category}`;
    
    const priceText = language === 'am'
      ? `💰 ዋጋ: <b>${price} ETB</b>${oldPrice}`
      : `💰 Price: <b>${price} ETB</b>${oldPrice}`;
    
    const availability = product.in_stock
      ? (language === 'am' ? '✅ ይገኛል' : '✅ In Stock')
      : (language === 'am' ? '❌ አልቋል' : '❌ Out of Stock');

    const description = product.short_description || product.description || '';

    let message = `${title}\n\n${category}\n${priceText}\n${availability}`;
    
    if (description) {
      message += `\n\n${description}`;
    }

    if (product.features && product.features.length > 0) {
      const featuresLabel = language === 'am' ? '✨ ባህሪያት:' : '✨ Features:';
      message += `\n\n${featuresLabel}\n${product.features.slice(0, 3).map(f => `• ${f}`).join('\n')}`;
    }

    return message;
  }
}