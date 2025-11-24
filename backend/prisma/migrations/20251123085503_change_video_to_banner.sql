-- Migration: Change videoUrl to bannerUrl in events_headers table

-- Step 1: Add new banner_url column
ALTER TABLE "events_headers" ADD COLUMN IF NOT EXISTS "banner_url" TEXT;

-- Step 2: Copy data from video_url to banner_url (if video_url contains image URL, keep it; otherwise set default)
UPDATE "events_headers" 
SET "banner_url" = CASE 
  WHEN "video_url" LIKE '%.png' OR "video_url" LIKE '%.jpg' OR "video_url" LIKE '%.jpeg' OR "video_url" LIKE '%.webp' OR "video_url" LIKE '%.gif' 
  THEN "video_url"
  ELSE '/banner/default-banner.png'
END
WHERE "banner_url" IS NULL;

-- Step 3: Set default for any NULL values
UPDATE "events_headers" 
SET "banner_url" = '/banner/default-banner.png'
WHERE "banner_url" IS NULL;

-- Step 4: Make banner_url NOT NULL
ALTER TABLE "events_headers" ALTER COLUMN "banner_url" SET NOT NULL;

-- Step 5: Drop old video_url column (optional - can be done later if needed)
-- ALTER TABLE "events_headers" DROP COLUMN IF EXISTS "video_url";
