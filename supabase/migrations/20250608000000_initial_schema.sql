-- menulia.io — Initial Schema (PostgreSQL via Supabase)
-- Run: supabase db reset (local) or apply via Supabase dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Profiles (extends Supabase auth.users) ───────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Restaurants ────────────────────────────────────────────────────────────
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  website_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_reservations BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX idx_restaurants_user_id ON public.restaurants(user_id);

-- ─── Custom Restaurant Links ────────────────────────────────────────────────
CREATE TABLE public.custom_restaurant_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE INDEX idx_custom_links_restaurant ON public.custom_restaurant_links(restaurant_id);

-- ─── Operating Hours (Onboarding Obligatory) ────────────────────────────────
CREATE TABLE public.operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (restaurant_id, day_of_week)
);

CREATE INDEX idx_operating_hours_restaurant ON public.operating_hours(restaurant_id);

-- ─── Menu Categories ────────────────────────────────────────────────────────
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_menu_categories_restaurant ON public.menu_categories(restaurant_id);

-- ─── Menu Items ─────────────────────────────────────────────────────────────
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  allergens TEXT[] NOT NULL DEFAULT '{}',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);

-- ─── Menu Translations ──────────────────────────────────────────────────────
CREATE TABLE public.menu_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  translated_name TEXT NOT NULL,
  translated_description TEXT NOT NULL DEFAULT '',
  UNIQUE (item_id, language_code)
);

CREATE INDEX idx_menu_translations_item ON public.menu_translations(item_id);

-- ─── Reservations ───────────────────────────────────────────────────────────
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_restaurant ON public.reservations(restaurant_id);
CREATE INDEX idx_reservations_date ON public.reservations(restaurant_id, date);

-- ─── Page Views (Analytics) ───────────────────────────────────────────────────
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_views_restaurant ON public.page_views(restaurant_id);
CREATE INDEX idx_page_views_viewed_at ON public.page_views(restaurant_id, viewed_at);

-- ─── Business Expenses ──────────────────────────────────────────────────────
CREATE TABLE public.business_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('Staff', 'Inventory', 'Rent', 'Utilities', 'Marketing')),
  expense_date DATE NOT NULL
);

CREATE INDEX idx_business_expenses_restaurant ON public.business_expenses(restaurant_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_restaurant_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Restaurants: owners manage, public read by slug (via service role or anon for public menu)
CREATE POLICY "Owners manage restaurants" ON public.restaurants
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view restaurants" ON public.restaurants
  FOR SELECT USING (true);

-- Public read for menu-related tables
CREATE POLICY "Public read custom links" ON public.custom_restaurant_links FOR SELECT USING (true);
CREATE POLICY "Owners manage custom links" ON public.custom_restaurant_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
);

CREATE POLICY "Public read operating hours" ON public.operating_hours FOR SELECT USING (true);
CREATE POLICY "Owners manage operating hours" ON public.operating_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
);

CREATE POLICY "Public read menu categories" ON public.menu_categories FOR SELECT USING (true);
CREATE POLICY "Owners manage menu categories" ON public.menu_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
);

CREATE POLICY "Public read menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Owners manage menu items" ON public.menu_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.menu_categories c
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE c.id = category_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Public read menu translations" ON public.menu_translations FOR SELECT USING (true);
CREATE POLICY "Owners manage menu translations" ON public.menu_translations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.menu_items i
    JOIN public.menu_categories c ON c.id = i.category_id
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE i.id = item_id AND r.user_id = auth.uid()
  )
);

-- Reservations: public can insert, owners manage
CREATE POLICY "Anyone can create reservations" ON public.reservations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners manage reservations" ON public.reservations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
);
CREATE POLICY "Public read own pending" ON public.reservations FOR SELECT USING (true);

-- Page views: anyone can insert, owners read
CREATE POLICY "Anyone can log page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners read page views" ON public.page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
);

-- Expenses: owners only
CREATE POLICY "Owners manage expenses" ON public.business_expenses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = restaurant_id AND r.user_id = auth.uid())
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
