-- Fix Timezone Issues for Attendance Tracker
-- Run this in your Supabase SQL Editor

-- First, let's check the current timezone settings
SELECT 
    name,
    setting,
    unit,
    context,
    short_desc
FROM pg_settings 
WHERE name LIKE '%timezone%';

-- Check current timezone
SHOW timezone;

-- Set timezone to Pacific timezone for the session
SET timezone = 'America/Los_Angeles';

-- Verify the change
SHOW timezone;

-- Create a function to get current timestamp in Pacific timezone
CREATE OR REPLACE FUNCTION get_pacific_timestamp()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN NOW() AT TIME ZONE 'America/Los_Angeles';
END;
$$ LANGUAGE plpgsql;

-- Update the update_updated_at_column function to use Pacific timezone
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'America/Los_Angeles';
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function to convert UTC timestamps to Pacific timezone for display
CREATE OR REPLACE FUNCTION format_timestamp_pacific(timestamp_with_tz TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
    RETURN timestamp_with_tz AT TIME ZONE 'America/Los_Angeles';
END;
$$ LANGUAGE plpgsql;

-- Add a comment to the clients table about timezone handling
COMMENT ON TABLE clients IS 'Client data with timestamps stored in UTC but displayed in Pacific timezone';

-- Add a comment to the attendance table about timezone handling
COMMENT ON TABLE attendance IS 'Attendance data with timestamps stored in UTC but displayed in Pacific timezone';

-- Create a view to display client data with Pacific timezone timestamps
CREATE OR REPLACE VIEW clients_pacific_time AS
SELECT 
    id,
    name,
    initials,
    parent_name,
    parent_email,
    phone,
    image,
    location,
    schedule,
    payment_status,
    created_at AT TIME ZONE 'America/Los_Angeles' as created_at_pacific,
    updated_at AT TIME ZONE 'America/Los_Angeles' as updated_at_pacific,
    created_at,
    updated_at
FROM clients;

-- Create a view to display attendance data with Pacific timezone timestamps
CREATE OR REPLACE VIEW attendance_pacific_time AS
SELECT 
    id,
    client_id,
    date,
    status,
    hours,
    excused,
    notes,
    created_at AT TIME ZONE 'America/Los_Angeles' as created_at_pacific,
    updated_at AT TIME ZONE 'America/Los_Angeles' as updated_at_pacific,
    created_at,
    updated_at
FROM attendance;

-- Verify the views work correctly
SELECT 
    name,
    created_at_pacific,
    updated_at_pacific
FROM clients_pacific_time 
LIMIT 5;

-- Show current time in different timezones for reference
SELECT 
    'UTC' as timezone,
    NOW() AT TIME ZONE 'UTC' as current_time
UNION ALL
SELECT 
    'Pacific' as timezone,
    NOW() AT TIME ZONE 'America/Los_Angeles' as current_time
UNION ALL
SELECT 
    'Local Database' as timezone,
    NOW() as current_time;

-- Instructions for the application:
-- 1. When creating new clients, the created_at will be set automatically with Pacific timezone
-- 2. When displaying timestamps, use the format_timestamp_pacific() function or the views
-- 3. The database stores all timestamps in UTC but converts them to Pacific timezone for display
-- 4. This ensures consistency across different timezones while maintaining Pacific timezone display
