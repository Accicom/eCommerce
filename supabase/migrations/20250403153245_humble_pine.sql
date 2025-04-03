/*
  # Add Cart Tracking System

  1. New Tables
    - `abandoned_carts`
      - `id` (uuid, primary key)
      - `user_email` (text, nullable)
      - `cart_data` (jsonb)
      - `total_amount` (numeric)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `completed_orders`
      - `id` (uuid, primary key)
      - `order_number` (text)
      - `user_email` (text, nullable)
      - `order_data` (jsonb)
      - `total_amount` (numeric)
      - `whatsapp_message` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public insert and authenticated read access
*/

-- Create abandoned_carts table
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  cart_data jsonb NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'abandoned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create completed_orders table
CREATE TABLE IF NOT EXISTS completed_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  user_email text,
  order_data jsonb NOT NULL,
  total_amount numeric NOT NULL,
  whatsapp_message text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for abandoned_carts
CREATE POLICY "Enable insert for all users" ON abandoned_carts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users only" ON abandoned_carts
  FOR SELECT TO authenticated USING (true);

-- Create policies for completed_orders
CREATE POLICY "Enable insert for all users" ON completed_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users only" ON completed_orders
  FOR SELECT TO authenticated USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_completed_orders_updated_at
  BEFORE UPDATE ON completed_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();