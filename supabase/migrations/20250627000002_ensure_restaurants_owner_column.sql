-- Ensure restaurants.user_id exists for owner scoping and RLS policies.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'restaurants'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.restaurants
      ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants (user_id);
  END IF;
END $$;
