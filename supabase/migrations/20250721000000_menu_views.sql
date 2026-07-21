-- GDPR-safe public menu view analytics (no IP, no PII).
CREATE TABLE IF NOT EXISTS public.menu_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  language TEXT NOT NULL DEFAULT 'en',
  device_type TEXT NOT NULL DEFAULT 'unknown'
    CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'unknown'))
);

CREATE INDEX IF NOT EXISTS idx_menu_views_restaurant_created
  ON public.menu_views (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_menu_views_restaurant_language
  ON public.menu_views (restaurant_id, language);

ALTER TABLE public.menu_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log menu views" ON public.menu_views;
CREATE POLICY "Anyone can log menu views"
  ON public.menu_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners read menu views" ON public.menu_views;
CREATE POLICY "Owners read menu views"
  ON public.menu_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT ON public.menu_views TO anon, authenticated;
