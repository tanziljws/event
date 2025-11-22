-- Add event_end_date and event_end_time columns to events table
-- Migration: add_event_end_date_time

-- Check if columns exist before adding them
DO $$
BEGIN
    -- Add event_end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'event_end_date'
    ) THEN
        ALTER TABLE "events" 
        ADD COLUMN "event_end_date" TIMESTAMP(3);
        
        RAISE NOTICE 'Added column event_end_date';
    ELSE
        RAISE NOTICE 'Column event_end_date already exists';
    END IF;

    -- Add event_end_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'event_end_time'
    ) THEN
        ALTER TABLE "events" 
        ADD COLUMN "event_end_time" TEXT;
        
        RAISE NOTICE 'Added column event_end_time';
    ELSE
        RAISE NOTICE 'Column event_end_time already exists';
    END IF;
END $$;

