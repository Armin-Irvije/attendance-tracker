-- Create compatibility views for existing code
-- This creates the views your code expects (clients_pacific_time, attendance_pacific_time)

-- ========================================
-- CREATE CLIENTS_PACIFIC_TIME VIEW
-- ========================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS clients_pacific_time;

-- Create the view that your code expects
CREATE VIEW clients_pacific_time AS
SELECT 
    id,
    name,
    initials,
    email,
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

-- ========================================
-- CREATE ATTENDANCE_PACIFIC_TIME VIEW
-- ========================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS attendance_pacific_time;

-- Create the view that your code expects
CREATE VIEW attendance_pacific_time AS
SELECT 
    id,
    client_id,
    date,
    status,
    hours,
    excused,
    -- Convert UTC timestamps to Pacific timezone
    created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' as created_at,
    updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' as updated_at
FROM attendance;

-- ========================================
-- ENABLE RLS ON VIEWS
-- ========================================

-- Enable RLS on the views (they inherit from base tables)
ALTER VIEW clients_pacific_time SET (security_invoker = true);
ALTER VIEW attendance_pacific_time SET (security_invoker = true);

-- ========================================
-- VERIFICATION
-- ========================================

-- Check that views were created
SELECT 'Created views:' as status;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clients_pacific_time', 'attendance_pacific_time')
ORDER BY table_name;

-- Test the views
SELECT 'Testing clients_pacific_time view:' as status;
SELECT COUNT(*) as client_count FROM clients_pacific_time;

SELECT 'Testing attendance_pacific_time view:' as status;
SELECT COUNT(*) as attendance_count FROM attendance_pacific_time;

-- Show sample data from clients view
SELECT 'Sample client data:' as status;
SELECT 
    id,
    name,
    initials,
    location,
    created_at
FROM clients_pacific_time
LIMIT 3;

SELECT '✅ Compatibility views created successfully!' as final_status;
