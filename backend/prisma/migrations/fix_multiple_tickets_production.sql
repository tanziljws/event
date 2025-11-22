-- Fix Multiple Ticket Types in Production Database
-- This migration adds all necessary tables and columns for multiple ticket types support

-- Step 1: Create ticket_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ticket_types" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER NOT NULL,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "sale_start_date" TIMESTAMP(3),
    "sale_end_date" TIMESTAMP(3),
    "benefits" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "color" VARCHAR(7) DEFAULT '#2563EB',
    "icon" VARCHAR(50) DEFAULT 'ticket',
    "badge_text" VARCHAR(50),
    "min_quantity" INTEGER DEFAULT 1,
    "max_quantity" INTEGER DEFAULT 10,
    "requires_approval" BOOLEAN DEFAULT false,
    "terms_conditions" TEXT,
    "original_price" DECIMAL(10,2),
    "discount_percentage" DECIMAL(5,2),
    "promo_code" VARCHAR(50),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add foreign key from ticket_types to events (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ticket_types_event_id_fkey'
    ) THEN
        ALTER TABLE "ticket_types" 
        ADD CONSTRAINT "ticket_types_event_id_fkey" 
        FOREIGN KEY ("event_id") REFERENCES "events"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 3: Create indexes for ticket_types (if not exists)
CREATE INDEX IF NOT EXISTS "ticket_types_event_id_idx" ON "ticket_types"("event_id");
CREATE INDEX IF NOT EXISTS "ticket_types_is_active_idx" ON "ticket_types"("is_active");
CREATE INDEX IF NOT EXISTS "ticket_types_sort_order_idx" ON "ticket_types"("sort_order");

-- Step 4: Add ticket_type_id column to event_registrations (if not exists)
ALTER TABLE "event_registrations" 
ADD COLUMN IF NOT EXISTS "ticket_type_id" TEXT;

-- Step 5: Add ticket_benefits column to event_registrations (if not exists)
ALTER TABLE "event_registrations" 
ADD COLUMN IF NOT EXISTS "ticket_benefits" JSONB;

-- Step 6: Add foreign key from event_registrations to ticket_types (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'event_registrations_ticket_type_id_fkey'
    ) THEN
        ALTER TABLE "event_registrations" 
        ADD CONSTRAINT "event_registrations_ticket_type_id_fkey" 
        FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 7: Create index for event_registrations.ticket_type_id (if not exists)
CREATE INDEX IF NOT EXISTS "event_registrations_ticket_type_id_idx" ON "event_registrations"("ticket_type_id");

-- Step 8: Add has_multiple_ticket_types column to events (if not exists)
ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "has_multiple_ticket_types" BOOLEAN NOT NULL DEFAULT false;

-- Verification: Show status
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '✅ ticket_types table: Created';
    RAISE NOTICE '✅ event_registrations.ticket_type_id: Added';
    RAISE NOTICE '✅ event_registrations.ticket_benefits: Added';
    RAISE NOTICE '✅ events.has_multiple_ticket_types: Added';
    RAISE NOTICE '✅ All indexes and foreign keys: Created';
END $$;

