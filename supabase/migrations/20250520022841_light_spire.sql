/*
  # Add Client Tracking to Completed Orders

  1. Changes
    - Add `client_id` column to completed_orders table
    - Add foreign key constraint to catalog_clients table
    - Add index for better query performance
*/

-- Add client_id column
ALTER TABLE completed_orders 
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES catalog_clients(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS completed_orders_client_id_idx ON completed_orders(client_id);