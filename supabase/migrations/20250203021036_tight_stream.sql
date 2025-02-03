/*
  # Add mobile banner support
  
  1. Changes
    - Add mobile_image column to banner_slides table
    
  2. Notes
    - The mobile_image is optional and will fallback to the main image if not provided
*/

ALTER TABLE banner_slides ADD COLUMN IF NOT EXISTS mobile_image text;