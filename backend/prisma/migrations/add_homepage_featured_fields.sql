-- Add homepage featured fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_homepage_featured BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS homepage_order INTEGER;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_homepage_featured ON events(is_homepage_featured, homepage_order) WHERE is_homepage_featured = true;

