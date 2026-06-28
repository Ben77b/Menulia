-- Self-healing schema initializer for public.restaurants (callable via service role RPC).
CREATE OR REPLACE FUNCTION public.ensure_restaurants_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := jsonb_build_object('ok', true);
BEGIN
  CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restaurants'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.restaurants
      ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    result := result || jsonb_build_object('added_user_id', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restaurants'
      AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN slug TEXT;

    UPDATE public.restaurants
    SET slug = LOWER(REGEXP_REPLACE(COALESCE(name, 'restaurant'), '[^a-zA-Z0-9\s-]', '', 'g'))
    WHERE slug IS NULL;

    UPDATE public.restaurants
    SET slug = REGEXP_REPLACE(slug, '\s+', '-', 'g')
    WHERE slug IS NOT NULL;

    UPDATE public.restaurants
    SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g')
    WHERE slug IS NOT NULL;

    UPDATE public.restaurants
    SET slug = TRIM(BOTH '-' FROM slug)
    WHERE slug IS NOT NULL;

    UPDATE public.restaurants
    SET slug = id::text
    WHERE slug IS NULL OR slug = '';

    result := result || jsonb_build_object('added_slug', true);
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_unique_idx ON public.restaurants (slug);
  CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants (user_id);

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN location TEXT NOT NULL DEFAULT '';
    result := result || jsonb_build_object('added_location', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'hours'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN hours TEXT NOT NULL DEFAULT '';
    result := result || jsonb_build_object('added_hours', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN contact_info TEXT NOT NULL DEFAULT '';
    result := result || jsonb_build_object('added_contact_info', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN meta_title TEXT NOT NULL DEFAULT '';
    result := result || jsonb_build_object('added_meta_title', true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN meta_description TEXT NOT NULL DEFAULT '';
    result := result || jsonb_build_object('added_meta_description', true);
  END IF;

  ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'restaurants'
      AND policyname = 'Owners manage restaurants'
  ) THEN
    CREATE POLICY "Owners manage restaurants"
      ON public.restaurants
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'restaurants'
      AND policyname = 'Public can view restaurants'
  ) THEN
    CREATE POLICY "Public can view restaurants"
      ON public.restaurants
      FOR SELECT
      USING (true);
  END IF;

  NOTIFY pgrst, 'reload schema';

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_restaurants_schema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_restaurants_schema() TO service_role;
