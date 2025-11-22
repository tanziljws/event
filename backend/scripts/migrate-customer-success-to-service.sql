-- Migration script to update CUSTOMER_SUCCESS to CUSTOMER_SERVICE
-- and remove SENIOR_AGENT roles

-- Step 1: Update department enum values
-- First, update all users with CUSTOMER_SUCCESS department to CUSTOMER_SERVICE
UPDATE users 
SET department = 'CUSTOMER_SERVICE'::department
WHERE department = 'CUSTOMER_SUCCESS'::department;

-- Step 2: Update department_tickets table
UPDATE department_tickets
SET department = 'CUSTOMER_SERVICE'::department
WHERE department = 'CUSTOMER_SUCCESS'::department;

-- Step 3: Update user roles - convert SENIOR_AGENT to AGENT
-- CS_SENIOR_AGENT -> CS_AGENT
UPDATE users 
SET role = 'CS_AGENT'::user_role
WHERE role = 'CS_SENIOR_AGENT'::user_role;

-- OPS_SENIOR_AGENT -> OPS_AGENT
UPDATE users 
SET role = 'OPS_AGENT'::user_role
WHERE role = 'OPS_SENIOR_AGENT'::user_role;

-- FINANCE_SENIOR_AGENT -> FINANCE_AGENT
UPDATE users 
SET role = 'FINANCE_AGENT'::user_role
WHERE role = 'FINANCE_SENIOR_AGENT'::user_role;

-- Step 4: Update user_position - convert SENIOR_AGENT to AGENT
UPDATE users 
SET user_position = 'AGENT'::user_position
WHERE user_position = 'SENIOR_AGENT'::user_position;

-- Verify changes
SELECT 
    'Department check' as check_type,
    department,
    COUNT(*) as count
FROM users
WHERE department IS NOT NULL
GROUP BY department;

SELECT 
    'Role check' as check_type,
    role,
    COUNT(*) as count
FROM users
WHERE role LIKE '%_AGENT' OR role LIKE '%_HEAD'
GROUP BY role
ORDER BY role;

SELECT 
    'Position check' as check_type,
    user_position,
    COUNT(*) as count
FROM users
WHERE user_position IS NOT NULL
GROUP BY user_position;

