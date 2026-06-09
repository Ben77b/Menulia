-- menulia.io sandbox seed data
-- Run after migration: supabase db reset

-- Demo users (auth.users must be created via Supabase Auth first; these are profile stubs for local dev)
INSERT INTO public.profiles (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'tacos@demo.menulia.io'),
  ('22222222-2222-2222-2222-222222222222', 'sushi@demo.menulia.io'),
  ('33333333-3333-3333-3333-333333333333', 'trattoria@demo.menulia.io'),
  ('44444444-4444-4444-4444-444444444444', 'burger@demo.menulia.io')
ON CONFLICT (id) DO NOTHING;

-- Restaurants
INSERT INTO public.restaurants (id, user_id, name, slug, logo_url, banner_url, instagram_url, facebook_url, website_url, is_premium, accepts_reservations) VALUES
  ('a0000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'La Calle Tacos', 'la-calle-tacos',
   'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200',
   'https://instagram.com/lacalletacos', 'https://facebook.com/lacalletacos', NULL, false, false),
  ('a0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Sakura Omakase', 'sakura-omakase',
   'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=200', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200',
   'https://instagram.com/sakuraomakase', NULL, 'https://sakuraomakase.com', true, true),
  ('a0000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Nonna Rosa Trattoria', 'nonna-rosa-trattoria',
   'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200',
   'https://instagram.com/nonnarosa', 'https://facebook.com/nonnarosa', 'https://nonnarosa.it', false, false),
  ('a0000004-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'Smash & Co.', 'smash-and-co',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200',
   'https://instagram.com/smashandco', 'https://facebook.com/smashandco', NULL, true, true);

-- Custom links
INSERT INTO public.custom_restaurant_links (id, restaurant_id, label, url) VALUES
  ('link-1', 'a0000001-0000-0000-0000-000000000001', 'TripAdvisor', 'https://tripadvisor.com/la-calle-tacos'),
  ('link-2', 'a0000002-0000-0000-0000-000000000002', 'Michelin Guide', 'https://guide.michelin.com/sakura'),
  ('link-3', 'a0000004-0000-0000-0000-000000000004', 'Uber Eats', 'https://ubereats.com/smash-and-co');

-- Operating hours (Mon closed for all, Tue closed for trattoria)
INSERT INTO public.operating_hours (id, restaurant_id, day_of_week, open_time, close_time, is_closed)
SELECT
  gen_random_uuid(),
  r.id,
  d.day,
  CASE WHEN d.day = 1 OR (r.slug = 'nonna-rosa-trattoria' AND d.day = 2) THEN NULL ELSE '11:00:00'::time END,
  CASE WHEN d.day = 1 OR (r.slug = 'nonna-rosa-trattoria' AND d.day = 2) THEN NULL ELSE '22:00:00'::time END,
  d.day = 1 OR (r.slug = 'nonna-rosa-trattoria' AND d.day = 2)
FROM public.restaurants r
CROSS JOIN (SELECT generate_series(0, 6) AS day) d;

-- See src/lib/mock-data.ts for full menu item seed — import via app or extend this file.
