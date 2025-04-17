/*
  # Remove abandoned carts table
  
  1. Changes
    - Drop abandoned_carts table as it's no longer needed
    - The system now only tracks completed orders through WhatsApp
*/

DROP TABLE IF EXISTS abandoned_carts;