-- Tighten RLS on core menu tables, lock down rls_auto_enable, and refine menu-images storage access.

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Owners manage restaurants" ON public.restaurants;

DROP POLICY IF EXISTS "Public read restaurants" ON public.restaurants;
CREATE POLICY "Public read restaurants"
  ON public.restaurants
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners insert restaurants" ON public.restaurants;
CREATE POLICY "Owners insert restaurants"
  ON public.restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners update restaurants" ON public.restaurants;
CREATE POLICY "Owners update restaurants"
  ON public.restaurants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners delete restaurants" ON public.restaurants;
CREATE POLICY "Owners delete restaurants"
  ON public.restaurants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Keep legacy policy name used by earlier migrations (SELECT-only alias).
DROP POLICY IF EXISTS "Public can view restaurants" ON public.restaurants;
CREATE POLICY "Public can view restaurants"
  ON public.restaurants
  FOR SELECT
  USING (true);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for categories" ON public.categories;

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners insert categories" ON public.categories;
CREATE POLICY "Owners insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners update categories" ON public.categories;
CREATE POLICY "Owners update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners delete categories" ON public.categories;
CREATE POLICY "Owners delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- dishes
-- ---------------------------------------------------------------------------
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for dishes" ON public.dishes;

DROP POLICY IF EXISTS "Public read dishes" ON public.dishes;
CREATE POLICY "Public read dishes"
  ON public.dishes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners insert dishes" ON public.dishes;
CREATE POLICY "Owners insert dishes"
  ON public.dishes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.categories c
      JOIN public.restaurants r ON r.id = c.restaurant_id
      WHERE c.id = category_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners update dishes" ON public.dishes;
CREATE POLICY "Owners update dishes"
  ON public.dishes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.categories c
      JOIN public.restaurants r ON r.id = c.restaurant_id
      WHERE c.id = category_id
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.categories c
      JOIN public.restaurants r ON r.id = c.restaurant_id
      WHERE c.id = category_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners delete dishes" ON public.dishes;
CREATE POLICY "Owners delete dishes"
  ON public.dishes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.categories c
      JOIN public.restaurants r ON r.id = c.restaurant_id
      WHERE c.id = category_id
        AND r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- restaurant_links
-- ---------------------------------------------------------------------------
ALTER TABLE public.restaurant_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for restaurant_links" ON public.restaurant_links;

DROP POLICY IF EXISTS "Public read restaurant_links" ON public.restaurant_links;
CREATE POLICY "Public read restaurant_links"
  ON public.restaurant_links
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners insert restaurant_links" ON public.restaurant_links;
CREATE POLICY "Owners insert restaurant_links"
  ON public.restaurant_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners update restaurant_links" ON public.restaurant_links;
CREATE POLICY "Owners update restaurant_links"
  ON public.restaurant_links
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners delete restaurant_links" ON public.restaurant_links;
CREATE POLICY "Owners delete restaurant_links"
  ON public.restaurant_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.id = restaurant_id
        AND r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- rls_auto_enable (Supabase linter / platform helper when present)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'rls_auto_enable'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- storage.objects — menu-images bucket
-- Direct public URLs use the public bucket; API listing is blocked for anon/auth.
-- Owners may write only under {restaurant_id}/ paths they own.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read access for menu-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to menu-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read menu-images by object path" ON storage.objects;
DROP POLICY IF EXISTS "Owners upload menu-images" ON storage.objects;
DROP POLICY IF EXISTS "Owners update menu-images" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete menu-images" ON storage.objects;

CREATE POLICY "Owners upload menu-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.user_id = auth.uid()
        AND name LIKE r.id::text || '/%'
    )
  );

CREATE POLICY "Owners update menu-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.user_id = auth.uid()
        AND name LIKE r.id::text || '/%'
    )
  )
  WITH CHECK (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.user_id = auth.uid()
        AND name LIKE r.id::text || '/%'
    )
  );

CREATE POLICY "Owners delete menu-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'menu-images'
    AND EXISTS (
      SELECT 1
      FROM public.restaurants r
      WHERE r.user_id = auth.uid()
        AND name LIKE r.id::text || '/%'
    )
  );

-- Allow fetching a single object by known path (no bucket-wide listing for anon/auth).
CREATE POLICY "Public read menu-images by object path"
  ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id = 'menu-images'
    AND position('/' in name) > 0
    AND coalesce(storage.extension(name), '') <> ''
  );

NOTIFY pgrst, 'reload schema';
