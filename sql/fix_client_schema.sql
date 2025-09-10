-- Fix client schema to match form expectations
-- The form expects parent_name and parent_email fields

-- Check current schema
SELECT 'Current clients table structure:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- Update the view to include the new fields
DROP VIEW IF EXISTS clients_pacific_time;

CREATE VIEW clients_pacific_time AS
SELECT 
    id,
    name,
    initials,
    email,
    parent_name,
    parent_email,
    phone,
    image,
    location,
    schedule,
    payment_status,
    -- Convert UTC timestamps to Pacific timezone
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' as created_at,
    updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' as updated_at
FROM clients;

-- Test the schema
SELECT 'Updated clients table structure:' as status;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'clients'
ORDER BY ordinal_position;

-- Test inserting a client with the form's data structure
SELECT 'Testing client insertion with form data...' as status;

-- This should work now
INSERT INTO clients (
    name, 
    initials, 
    parent_name,
    parent_email, 
    phone, 
    location, 
    schedule
) VALUES (
    'Test Client',
    'TC',
    'Test Parent',
    'parent@test.com',
    '123-456-7890',
    'Test Location',
    '{"monday": true, "tuesday": false, "wednesday": false, "thursday": false, "friday": false}'
);

-- Check if it was inserted
SELECT 'Test client inserted:' as status;
SELECT id, name, initials, parent_name, parent_email FROM clients WHERE name = 'Test Client';

-- Clean up test data
DELETE FROM clients WHERE name = 'Test Client';

SELECT '✅ Client schema fixed! Form should work now.' as final_status;
