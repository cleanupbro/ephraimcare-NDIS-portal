-- SMS Shift Reminders Cron Job
-- Runs every hour to check for shifts needing reminders

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly reminder job
-- Uses Supabase's net extension for HTTP calls
SELECT cron.schedule(
  'shift-sms-reminders',
  '0 * * * *', -- Every hour on the hour
  $$
  SELECT net.http_post(
    url := current_setting('app.api_url') || '/api/cron/send-shift-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Grant execute permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Add comment for documentation
COMMENT ON TABLE cron.job IS 'Scheduled cron jobs including shift SMS reminders';

-- Create app settings if not exists
-- These should be set in Supabase dashboard under Database > Extensions > Configuration
-- Or via ALTER SYSTEM SET / SET app.api_url = 'https://your-app.vercel.app'

-- Note: If pg_cron or net extensions are not available on your Supabase plan,
-- use an external scheduler like Vercel Cron or GitHub Actions to call the endpoint.

/*
Alternative: Vercel Cron (add to vercel.json)
{
  "crons": [{
    "path": "/api/cron/send-shift-reminders",
    "schedule": "0 * * * *"
  }]
}
*/
