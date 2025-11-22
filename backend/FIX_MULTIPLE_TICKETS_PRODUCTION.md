# Fix Multiple Ticket Types in Production Database

## Problem
Multiple ticket types functionality was added locally but not yet applied to production database. This causes "Failed to load tickets" errors in production.

## What This Fix Does
This script applies all multiple ticket types migrations to production:

1. ✅ Creates `ticket_types` table if missing
2. ✅ Adds `ticket_type_id` column to `event_registrations` table
3. ✅ Adds `ticket_benefits` column to `event_registrations` table
4. ✅ Adds `has_multiple_ticket_types` column to `events` table
5. ✅ Creates all necessary indexes
6. ✅ Creates all necessary foreign keys

## How to Run

### Option 1: Using Railway CLI (Recommended)

```bash
# Connect to Railway production database
railway run --service <your-backend-service> node scripts/fix-multiple-tickets-production.js
```

### Option 2: Direct SQL (Using psql)

If you prefer to run SQL directly on Railway:

```bash
PGPASSWORD=your_password psql -h your_host -U postgres -p your_port -d railway
```

Then run the SQL from the migrations:
- `backend/prisma/migrations/20241230_add_ticket_types/migration.sql`
- `backend/prisma/migrations/20250101_add_has_multiple_ticket_types/migration.sql`

### Option 3: Using Node.js Script Locally (with DATABASE_URL)

Make sure your `.env` has the production `DATABASE_URL`, then:

```bash
cd backend
node scripts/fix-multiple-tickets-production.js
```

## Verification

After running the script, it will automatically verify:

- ✅ `ticket_types` table exists
- ✅ `event_registrations.ticket_type_id` column exists
- ✅ `event_registrations.ticket_benefits` column exists
- ✅ `events.has_multiple_ticket_types` column exists
- ✅ All indexes are created
- ✅ All foreign keys are created

## What Happens After

Once the migration is applied:

1. ✅ Tickets should load correctly in production
2. ✅ Multiple ticket types will work for events
3. ✅ Users can buy multiple tickets with different ticket types
4. ✅ Ticket type information will be displayed correctly

## Notes

- The script is **idempotent** - it's safe to run multiple times
- It checks if each component exists before creating it
- No data will be lost - only adds missing columns/tables
- Existing registrations without `ticket_type_id` will remain valid (nullable field)

## Related Files

- Migration: `backend/prisma/migrations/20241230_add_ticket_types/migration.sql`
- Migration: `backend/prisma/migrations/20250101_add_has_multiple_ticket_types/migration.sql`
- Script: `backend/scripts/fix-multiple-tickets-production.js`

