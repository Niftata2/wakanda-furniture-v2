-- Enhanced schema for AI Sales Bot
-- Run this in Supabase SQL Editor

-- Users table (Telegram users)
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id UUID REFERENCES telegram_users(id),
  telegram_id BIGINT NOT NULL,
  status TEXT DEFAULT 'active', -- active, closed, handed_off
  current_intent TEXT, -- browsing, interested, order_request, etc.
  current_product_id UUID,
  language TEXT DEFAULT 'en',
  context JSONB DEFAULT '{}', -- stores conversation context
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  telegram_id BIGINT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, command
  content TEXT,
  direction TEXT DEFAULT 'incoming', -- incoming, outgoing
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_user_id UUID REFERENCES telegram_users(id),
  conversation_id UUID REFERENCES conversations(id),
  telegram_id BIGINT NOT NULL,
  customer_name TEXT,
  phone TEXT,
  email TEXT,
  product_id UUID REFERENCES products(id),
  product_name TEXT,
  budget_range TEXT,
  room_type TEXT,
  customization_requirements TEXT,
  delivery_location TEXT,
  status TEXT DEFAULT 'new', -- new, contacted, qualified, converted, lost
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  owner_notified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom furniture requests
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  telegram_id BIGINT NOT NULL,
  furniture_type TEXT,
  dimensions TEXT,
  material TEXT,
  color TEXT,
  style TEXT,
  quantity INTEGER DEFAULT 1,
  budget TEXT,
  reference_image_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT,
  event_type TEXT NOT NULL, -- product_view, order_request, lead_created, etc.
  product_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation events
CREATE TABLE IF NOT EXISTS moderation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  event_type TEXT NOT NULL, -- warning, blocked, abuse
  message_content TEXT,
  severity TEXT DEFAULT 'low', -- low, medium, high
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_conversations_telegram_id ON conversations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_leads_telegram_id ON leads(telegram_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_analytics_telegram_id ON analytics_events(telegram_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);

-- Update existing products table to add slug and more fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS customizable BOOLEAN DEFAULT false;