-- Nested categories + restaurant_links table

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE TABLE IF NOT EXISTS restaurant_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_links_restaurant_id ON restaurant_links(restaurant_id);

ALTER TABLE restaurant_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for restaurant_links"
  ON restaurant_links FOR ALL USING (true) WITH CHECK (true);

-- Migrate existing JSONB custom_links into restaurant_links when table is empty
INSERT INTO restaurant_links (restaurant_id, label, url, order_index)
SELECT
  r.id,
  link->>'label',
  link->>'url',
  ROW_NUMBER() OVER (PARTITION BY r.id ORDER BY link->>'id') - 1
FROM restaurants r
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(r.custom_links, '[]'::jsonb)) AS link
WHERE NOT EXISTS (SELECT 1 FROM restaurant_links LIMIT 1)
  AND link->>'label' IS NOT NULL
  AND link->>'url' IS NOT NULL
  AND length(trim(link->>'url')) > 0;
