/*
  # Fix catalog_clients RLS policy for anonymous insertions

  1. Security Changes
    - Add policy to allow anonymous users to insert into catalog_clients table
    - This enables the catalog gate registration flow to work properly
    - Maintains existing security for other operations

  2. Changes Made
    - Add INSERT policy for public role on catalog_clients table
    - Allow anonymous users to create client records during registration
*/

-- Add policy to allow anonymous users to insert new client records
CREATE POLICY "Enable insert for anonymous users during registration"
  ON catalog_clients
  FOR INSERT
  TO public
  WITH CHECK (true);