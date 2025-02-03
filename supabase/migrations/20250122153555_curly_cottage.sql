/*
  # Add categories and product fields

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `icon` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to Existing Tables
    - Add to `products`:
      - `code` (text, unique)
      - `featured` (boolean)

  3. Security
    - Enable RLS on `categories` table
    - Add policies for authenticated users to manage categories
    - Add policies for public read access to categories
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to products safely
ALTER TABLE products ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Update existing products with a generated code
DO $$ 
BEGIN 
  UPDATE products 
  SET code = 'PROD-' || SUBSTRING(CAST(id AS text), 1, 8)
  WHERE code IS NULL;

  -- Now we can safely add the NOT NULL and UNIQUE constraints
  ALTER TABLE products ALTER COLUMN code SET NOT NULL;
  ALTER TABLE products ADD CONSTRAINT products_code_unique UNIQUE (code);
END $$;

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Enable read access for all users" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at on categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();