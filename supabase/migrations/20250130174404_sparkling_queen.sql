/*
  # Add product description field

  1. Changes
    - Add description field to products table
    - Make it optional for existing products
    - Add full text search capabilities
*/

-- Add description column
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;

-- Enable full text search
CREATE INDEX IF NOT EXISTS products_description_search_idx ON products USING gin(to_tsvector('spanish', coalesce(description, '')));