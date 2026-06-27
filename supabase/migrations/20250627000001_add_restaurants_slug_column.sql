-- Ensure restaurants.slug exists for public menu URLs and slug-based lookups.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restaurants'
      AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN slug TEXT;

    UPDATE public.restaurants
    SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'))
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

    CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_key ON public.restaurants (slug);
  END IF;
END $$;
