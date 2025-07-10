/*
  # Fix notify_new_lead function

  1. Function Updates
    - Replace the non-existent `supabase_functions.http_request` with the correct `net.http_post`
    - Update the function to use proper Supabase HTTP extensions
    - Add proper error handling

  2. Security
    - Maintain existing trigger functionality
    - Ensure proper error handling doesn't break lead insertion
*/

-- First, let's recreate the notify_new_lead function with the correct HTTP request method
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Use the correct Supabase HTTP extension function
  -- This will attempt to call the send-new-lead-notification edge function
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-new-lead-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'lead_id', NEW.id,
      'email', NEW.email,
      'dni', NEW.dni,
      'status', NEW.status
    )
  );
  
  -- Always return NEW to ensure the trigger doesn't interfere with the insert
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the insert
    RAISE WARNING 'Failed to send lead notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;