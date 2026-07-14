-- Rename stacked_right to stacked_left and update the layout constraint
UPDATE categories
SET layout_type = 'stacked_left'
WHERE layout_type = 'stacked_right';

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_layout_type_check;

ALTER TABLE categories
  ADD CONSTRAINT categories_layout_type_check
  CHECK (layout_type IN ('stacked', 'stacked_left', 'carousel'));
