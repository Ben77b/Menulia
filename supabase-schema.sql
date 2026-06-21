-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT,
  banner_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  website_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  theme_colors JSONB DEFAULT '{"color1":"#FFFFFF","color2":"#F3F4F6","color3":"#FFFFFF","matchMainBackground":false}'::jsonb,
  typography JSONB DEFAULT '{"selectedPreset":"minimalist-cafe","customHeadingFont":"","customBodyFont":""}'::jsonb,
  external_links JSONB DEFAULT '{"instagram":"","facebook":"","website":""}'::jsonb,
  footer_slogan TEXT DEFAULT '',
  custom_links JSONB DEFAULT '[]'::jsonb,
  operating_hours JSONB DEFAULT '[
    {"day":"Monday","isOpen":true,"startTime":"09:00","endTime":"22:00"},
    {"day":"Tuesday","isOpen":true,"startTime":"09:00","endTime":"22:00"},
    {"day":"Wednesday","isOpen":true,"startTime":"09:00","endTime":"22:00"},
    {"day":"Thursday","isOpen":true,"startTime":"09:00","endTime":"22:00"},
    {"day":"Friday","isOpen":true,"startTime":"09:00","endTime":"23:00"},
    {"day":"Saturday","isOpen":true,"startTime":"10:00","endTime":"23:00"},
    {"day":"Sunday","isOpen":true,"startTime":"10:00","endTime":"21:00"}
  ]'::jsonb,
  font_pack_id TEXT DEFAULT 'Inter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add slug column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'slug'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN slug TEXT UNIQUE;
    -- Generate slugs from names for existing records
    UPDATE restaurants SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'));
    UPDATE restaurants SET slug = REGEXP_REPLACE(slug, '\s+', '-', 'g');
    UPDATE restaurants SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g');
    UPDATE restaurants SET slug = TRIM(slug, '-');
  END IF;
END $$;

-- Migration: Add font_pack_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'font_pack_id'
  ) THEN
    ALTER TABLE restaurants ADD COLUMN font_pack_id TEXT DEFAULT 'Inter';
  END IF;
END $$;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  layout_type TEXT DEFAULT 'stacked' CHECK (layout_type IN ('stacked', 'carousel')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dishes table
CREATE TABLE IF NOT EXISTS dishes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON dishes(category_id);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all - can be tightened later)
CREATE POLICY "Enable all access for restaurants" ON restaurants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dishes" ON dishes FOR ALL USING (true) WITH CHECK (true);

-- Migration: Rename 'image' column to 'image_url' if it exists and is named 'image'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'image'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE dishes RENAME COLUMN image TO image_url;
  END IF;
END $$;
