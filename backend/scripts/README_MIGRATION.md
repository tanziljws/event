# Migration Guide: CUSTOMER_SUCCESS → CUSTOMER_SERVICE

## Overview
This migration updates the database to:
1. Change `CUSTOMER_SUCCESS` to `CUSTOMER_SERVICE` in the `department` enum
2. Remove `SENIOR_AGENT` from the `user_position` enum
3. Remove `CS_SENIOR_AGENT`, `OPS_SENIOR_AGENT`, `FINANCE_SENIOR_AGENT` from the `user_role` enum

## Migration Steps

### Option 1: Using Migration Script (Recommended)

1. **Run the data migration script first:**
   ```bash
   npm run migrate:customer-service
   ```
   This will update all existing data in the database.

2. **Update the schema:**
   ```bash
   npx prisma db push --accept-data-loss
   ```
   This will update the enum definitions in the database.

### Option 2: Manual SQL Migration

1. **Connect to your database:**
   ```bash
   psql -U your_user -d event_management_db
   ```

2. **Run the SQL script:**
   ```bash
   psql -U your_user -d event_management_db -f scripts/migrate-customer-success-to-service.sql
   ```

3. **Update the schema:**
   ```bash
   npx prisma db push --accept-data-loss
   ```

### Option 3: Step-by-step Migration (If you encounter errors)

1. **First, temporarily add CUSTOMER_SERVICE to the enum:**
   - Edit `schema.prisma` and add `CUSTOMER_SERVICE` to the `Department` enum (keep `CUSTOMER_SUCCESS` for now)
   - Run: `npx prisma db push`

2. **Run the data migration:**
   ```bash
   npm run migrate:customer-service
   ```

3. **Remove CUSTOMER_SUCCESS from schema:**
   - Edit `schema.prisma` and remove `CUSTOMER_SUCCESS` from the `Department` enum
   - Remove `SENIOR_AGENT` from `UserPosition` enum
   - Remove `CS_SENIOR_AGENT`, `OPS_SENIOR_AGENT`, `FINANCE_SENIOR_AGENT` from `UserRole` enum
   - Run: `npx prisma db push --accept-data-loss`

## Troubleshooting

### Error: "invalid input value for enum department_new: CUSTOMER_SUCCESS"

This means there's still data using `CUSTOMER_SUCCESS`. Solution:
1. Run the migration script first: `npm run migrate:customer-service`
2. Verify all data is updated
3. Then run: `npx prisma db push --accept-data-loss`

### Error: "The underlying table for model `events` does not exist"

This is a shadow database issue. Solution:
1. Use `prisma db push` instead of `prisma migrate dev`
2. Or reset the shadow database: `rm -rf prisma/migrations/.shadow`

### Error: Enum casting errors in migration script

If you see enum casting errors:
1. Make sure the schema.prisma already has `CUSTOMER_SERVICE` in the enum
2. Run `npx prisma generate` first
3. Then run the migration script

## Verification

After migration, verify the changes:

```sql
-- Check departments
SELECT department, COUNT(*) as count
FROM users
WHERE department IS NOT NULL
GROUP BY department;

-- Check roles
SELECT role, COUNT(*) as count
FROM users
WHERE role LIKE '%_AGENT' OR role LIKE '%_HEAD'
GROUP BY role
ORDER BY role;

-- Check positions
SELECT user_position, COUNT(*) as count
FROM users
WHERE user_position IS NOT NULL
GROUP BY user_position;
```

## Rollback

If you need to rollback:

```sql
-- Rollback department
UPDATE users SET department = 'CUSTOMER_SUCCESS'::department WHERE department = 'CUSTOMER_SERVICE'::department;
UPDATE department_tickets SET department = 'CUSTOMER_SUCCESS'::department WHERE department = 'CUSTOMER_SERVICE'::department;

-- Rollback roles (if needed)
-- Note: You'll need to decide which users should be SENIOR_AGENT again
UPDATE users SET role = 'CS_SENIOR_AGENT'::user_role WHERE role = 'CS_AGENT'::user_role AND ...;
-- (Add appropriate WHERE conditions)

-- Rollback positions
UPDATE users SET user_position = 'SENIOR_AGENT'::user_position WHERE user_position = 'AGENT'::user_position AND ...;
-- (Add appropriate WHERE conditions)
```

