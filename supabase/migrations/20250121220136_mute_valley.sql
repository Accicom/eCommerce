/*
  # Initial Schema Setup

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (decimal)
      - `image` (text)
      - `category` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `banner_slides`
      - `id` (uuid, primary key)
      - `title` (text)
      - `subtitle` (text)
      - `image` (text)
      - `order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage content
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal NOT NULL,
  image text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create banner_slides table
CREATE TABLE IF NOT EXISTS banner_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  image text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_slides ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Enable read access for all users" ON products
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON products
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON products
  FOR DELETE TO authenticated USING (true);

-- Create policies for banner_slides
CREATE POLICY "Enable read access for all users" ON banner_slides
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON banner_slides
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON banner_slides
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON banner_slides
  FOR DELETE TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banner_slides_updated_at
  BEFORE UPDATE ON banner_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();