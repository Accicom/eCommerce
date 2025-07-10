/*
  # Make client name optional

  1. Changes
    - Make the `name` column in `catalog_clients` table nullable
    - This allows creating clients with just DNI and email

  2. Notes
    - Existing clients with names will keep their names
    - New clients can be created without providing a name
*/

-- Make the name column nullable
ALTER TABLE catalog_clients ALTER COLUMN name DROP NOT NULL;