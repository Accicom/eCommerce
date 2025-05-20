/*
  # Add Catalog Clients System

  1. New Tables
    - `catalog_clients`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `dni` (text, unique, required)
      - `cuit` (text, unique)
      - `celular` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `catalog_leads`
      - `id` (uuid, primary key)
      - `dni` (text, unique)
      - `email` (text, required)
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_attempt` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated admin access
    - Add policies for public read/insert access where needed
*/

-- Create catalog_clients table
CREATE TABLE IF NOT EXISTS catalog_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dni text UNIQUE NOT NULL,
  cuit text UNIQUE,
  celular text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Add check constraints for DNI and CUIT format
  CONSTRAINT valid_dni CHECK (dni ~ '^\d{7,8}$'),
  CONSTRAINT valid_cuit CHECK (cuit IS NULL OR cuit ~ '^\d{11}$')
);

-- Create catalog_leads table
CREATE TABLE IF NOT EXISTS catalog_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dni text UNIQUE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_attempt timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE catalog_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_leads ENABLE ROW LEVEL SECURITY;

-- Policies for catalog_clients
CREATE POLICY "Enable read access for all users" ON catalog_clients
  FOR SELECT USING (true);

CREATE POLICY "Enable insert/update/delete for authenticated users only" ON catalog_clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for catalog_leads
CREATE POLICY "Enable insert for all users" ON catalog_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read/update for authenticated users only" ON catalog_leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_catalog_clients_updated_at
  BEFORE UPDATE ON catalog_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catalog_leads_updated_at
  BEFORE UPDATE ON catalog_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();