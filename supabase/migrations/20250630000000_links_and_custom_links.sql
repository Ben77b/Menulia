-- Custom links JSON fallback + restaurant_links table for public menu hamburger links.

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_links JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.restaurant_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_links_restaurant_id
  ON public.restaurant_links(restaurant_id);

ALTER TABLE public.restaurant_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'restaurant_links'
      AND policyname = 'Enable all access for restaurant_links'
  ) THEN
    CREATE POLICY "Enable all access for restaurant_links"
      ON public.restaurant_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
