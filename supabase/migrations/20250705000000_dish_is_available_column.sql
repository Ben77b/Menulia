-- Dish visibility toggle for menu builder (hide out-of-stock items on public menus)
ALTER TABLE dishes
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;
