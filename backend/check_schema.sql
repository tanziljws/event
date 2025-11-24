-- Check if banner_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events_headers' 
AND column_name IN ('video_url', 'banner_url')
ORDER BY column_name;
