-- Optional subtitle shown below category titles on the public menu
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS description TEXT;
