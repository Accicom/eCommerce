/*
  # Fix Email Notification System

  1. Changes
    - Update notify_new_lead function to use webhook approach
    - Remove hardcoded service_role key for security
    - Add proper error handling and logging

  2. Notes
    - The function will call the edge function via webhook
    - Errors won't prevent lead creation
    - Edge function will use its own environment variables for authentication
*/

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS "new-lead-notification" ON public.catalog_leads;
DROP FUNCTION IF EXISTS notify_new_lead();

-- Create a new function that uses the webhook approach without hardcoded keys
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text;
  payload jsonb;
  result jsonb;
BEGIN
  -- Build the webhook URL
  webhook_url := 'https://dixpiyqipjzzccdlapyh.supabase.co/functions/v1/send-new-lead-notification';
  
  -- Build the payload that matches what the edge function expects
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'catalog_leads',
    'schema', 'public',
    'record', row_to_json(NEW)
  );

  -- Make the HTTP request using the net extension
  -- Note: The edge function will handle its own authentication using environment variables
  SELECT INTO result net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload
  );

  -- Log the result for debugging
  RAISE NOTICE 'Webhook response: %', result;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the insert
    RAISE WARNING 'Failed to send lead notification webhook: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER "new-lead-notification"
  AFTER INSERT ON public.catalog_leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();