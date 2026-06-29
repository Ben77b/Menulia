-- Separate informational allergens from filterable dish tags
ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS allergens TEXT[] NOT NULL DEFAULT '{}';
