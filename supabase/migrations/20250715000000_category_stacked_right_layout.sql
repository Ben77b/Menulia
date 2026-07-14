-- Allow stacked_right as a category display format on the public menu
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_layout_type_check;

ALTER TABLE categories
  ADD CONSTRAINT categories_layout_type_check
  CHECK (layout_type IN ('stacked', 'stacked_right', 'carousel'));
