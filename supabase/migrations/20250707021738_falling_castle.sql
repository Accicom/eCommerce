/*
  # Fix Lead Notification Trigger

  1. Changes
    - Drop the existing trigger that sends empty payload
    - Recreate the trigger with proper payload containing lead data
    - Use correct syntax for supabase_functions.http_request

  2. Notes
    - The trigger will now send the complete lead data to the Edge function
    - This should fix the "Unexpected end of JSON input" error
*/

-- Drop the existing trigger
DROP TRIGGER IF EXISTS "new-lead-notification" ON public.catalog_leads;

-- Create a function to handle the trigger logic
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM supabase_functions.http_request(
    'https://dixpiyqipjzzccdlapyh.supabase.co/functions/v1/send-new-lead-notification',
    'POST',
    '{"Content-type":"application/json","Authorization":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeHBpeXFpcGp6emNjZGxhcHloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ5NzUyNywiZXhwIjoyMDUzMDczNTI3fQ.gZwc87RKxw1gcOYOq0ADafH3AvuxJNsKGJVMDvY7pkg"}',
    json_build_object(
      'type', 'INSERT',
      'table', 'catalog_leads',
      'schema', 'public',
      'record', row_to_json(NEW)
    )::text,
    '5000'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger using the new function
CREATE TRIGGER "new-lead-notification"
  AFTER INSERT ON public.catalog_leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();