-- Direct SQL migration script to update enums
-- This script adds new enum values, updates data, then removes old values

-- Step 1: Add CUSTOMER_SERVICE to department enum
ALTER TYPE department ADD VALUE IF NOT EXISTS 'CUSTOMER_SERVICE';

-- Step 2: Update all CUSTOMER_SUCCESS to CUSTOMER_SERVICE
UPDATE users 
SET department = 'CUSTOMER_SERVICE'
WHERE department = 'CUSTOMER_SUCCESS';

UPDATE department_tickets
SET department = 'CUSTOMER_SERVICE'
WHERE department = 'CUSTOMER_SUCCESS';

-- Step 3: Add new role values (they should already exist, but just in case)
-- Note: We can't add enum values in the middle, so we'll update the data first
-- Then we'll need to remove the old values using a migration

-- Step 4: Update SENIOR_AGENT roles to AGENT roles
UPDATE users 
SET role = 'CS_AGENT'
WHERE role = 'CS_SENIOR_AGENT';

UPDATE users 
SET role = 'OPS_AGENT'
WHERE role = 'OPS_SENIOR_AGENT';

UPDATE users 
SET role = 'FINANCE_AGENT'
WHERE role = 'FINANCE_SENIOR_AGENT';

-- Step 5: Update user_position from SENIOR_AGENT to AGENT
UPDATE users 
SET user_position = 'AGENT'
WHERE user_position = 'SENIOR_AGENT';

-- Step 6: Verify changes
SELECT 
    'Department' as type,
    department::text as value,
    COUNT(*) as count
FROM users
WHERE department IS NOT NULL
GROUP BY department
UNION ALL
SELECT 
    'Role' as type,
    role::text as value,
    COUNT(*) as count
FROM users
WHERE role LIKE '%_AGENT' OR role LIKE '%_HEAD'
GROUP BY role
UNION ALL
SELECT 
    'Position' as type,
    user_position::text as value,
    COUNT(*) as count
FROM users
WHERE user_position IS NOT NULL
GROUP BY user_position
ORDER BY type, value;

-- Note: After running this script, you need to:
-- 1. Remove CUSTOMER_SUCCESS from the enum using: npx prisma db push --accept-data-loss
-- 2. Remove SENIOR_AGENT from user_position enum
-- 3. Remove CS_SENIOR_AGENT, OPS_SENIOR_AGENT, FINANCE_SENIOR_AGENT from user_role enum

