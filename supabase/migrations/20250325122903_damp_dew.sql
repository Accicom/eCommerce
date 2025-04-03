/*
  # Add brand, supplier and visibility fields to products

  1. Changes to Products Table
    - Add `brand` (text, optional)
    - Add `supplier` (text, optional) 
    - Add `visible` (boolean, default true)

  2. Notes
    - All new products will be visible by default
    - Existing products will be marked as visible
*/

-- Add new columns to products
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS supplier text,
  ADD COLUMN IF NOT EXISTS visible boolean DEFAULT true;

-- Set existing products as visible
UPDATE products SET visible = true WHERE visible IS NULL;