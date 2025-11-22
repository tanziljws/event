-- Migration: Simplify Organizer Profiles
-- Remove optional fields, add documents array, make required fields non-null

-- Step 1: Update department enum (if CUSTOMER_SERVICE exists, update to CUSTOMER_SUCCESS)
-- First, update all data that uses CUSTOMER_SERVICE
UPDATE users SET department = 'CUSTOMER_SUCCESS'::department WHERE department::text = 'CUSTOMER_SERVICE';

-- Note: Enum changes will be handled by Prisma migrate
-- We just need to ensure data is updated first

-- Step 2: Add documents column to individual_profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'individual_profiles' AND column_name = 'documents'
  ) THEN
    ALTER TABLE individual_profiles ADD COLUMN documents TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Step 3: Update individual_profiles - make required fields NOT NULL and remove optional fields
DO $$
BEGIN
  -- Make nik NOT NULL (update NULL values first)
  UPDATE individual_profiles SET nik = '0000000000000000' WHERE nik IS NULL;
  ALTER TABLE individual_profiles ALTER COLUMN nik SET NOT NULL;
  
  -- Make personal_address NOT NULL
  UPDATE individual_profiles SET personal_address = 'Alamat belum diisi' WHERE personal_address IS NULL;
  ALTER TABLE individual_profiles ALTER COLUMN personal_address SET NOT NULL;
  
  -- Make personal_phone NOT NULL
  UPDATE individual_profiles SET personal_phone = '0000000000' WHERE personal_phone IS NULL;
  ALTER TABLE individual_profiles ALTER COLUMN personal_phone SET NOT NULL;
  
  -- Drop optional columns (portfolio, social_media)
  ALTER TABLE individual_profiles DROP COLUMN IF EXISTS portfolio;
  ALTER TABLE individual_profiles DROP COLUMN IF EXISTS social_media;
END $$;

-- Step 4: Add documents column to community_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_profiles' AND column_name = 'documents'
  ) THEN
    ALTER TABLE community_profiles ADD COLUMN documents TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Step 5: Update community_profiles - make required fields NOT NULL
DO $$
BEGIN
  -- Make community_address NOT NULL
  UPDATE community_profiles SET community_address = 'Alamat belum diisi' WHERE community_address IS NULL;
  ALTER TABLE community_profiles ALTER COLUMN community_address SET NOT NULL;
  
  -- Make community_phone NOT NULL
  UPDATE community_profiles SET community_phone = '0000000000' WHERE community_phone IS NULL;
  ALTER TABLE community_profiles ALTER COLUMN community_phone SET NOT NULL;
  
  -- Make contact_person NOT NULL
  UPDATE community_profiles SET contact_person = 'Belum diisi' WHERE contact_person IS NULL;
  ALTER TABLE community_profiles ALTER COLUMN contact_person SET NOT NULL;
  
  -- Drop optional columns
  ALTER TABLE community_profiles DROP COLUMN IF EXISTS community_type;
  ALTER TABLE community_profiles DROP COLUMN IF EXISTS legal_document;
  ALTER TABLE community_profiles DROP COLUMN IF EXISTS website;
  ALTER TABLE community_profiles DROP COLUMN IF EXISTS social_media;
END $$;

-- Step 6: Add documents column to business_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_profiles' AND column_name = 'documents'
  ) THEN
    ALTER TABLE business_profiles ADD COLUMN documents TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Step 7: Update business_profiles - make required fields NOT NULL
DO $$
BEGIN
  -- Make business_address NOT NULL
  UPDATE business_profiles SET business_address = 'Alamat belum diisi' WHERE business_address IS NULL;
  ALTER TABLE business_profiles ALTER COLUMN business_address SET NOT NULL;
  
  -- Make business_phone NOT NULL
  UPDATE business_profiles SET business_phone = '0000000000' WHERE business_phone IS NULL;
  ALTER TABLE business_profiles ALTER COLUMN business_phone SET NOT NULL;
  
  -- Drop optional columns
  ALTER TABLE business_profiles DROP COLUMN IF EXISTS business_type;
  ALTER TABLE business_profiles DROP COLUMN IF EXISTS legal_document;
  ALTER TABLE business_profiles DROP COLUMN IF EXISTS logo;
  ALTER TABLE business_profiles DROP COLUMN IF EXISTS social_media;
  ALTER TABLE business_profiles DROP COLUMN IF EXISTS portfolio;
END $$;

-- Step 8: Add documents column to institution_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'institution_profiles' AND column_name = 'documents'
  ) THEN
    ALTER TABLE institution_profiles ADD COLUMN documents TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Step 9: Update institution_profiles - make required fields NOT NULL
DO $$
BEGIN
  -- Make institution_address NOT NULL
  UPDATE institution_profiles SET institution_address = 'Alamat belum diisi' WHERE institution_address IS NULL;
  ALTER TABLE institution_profiles ALTER COLUMN institution_address SET NOT NULL;
  
  -- Make institution_phone NOT NULL
  UPDATE institution_profiles SET institution_phone = '0000000000' WHERE institution_phone IS NULL;
  ALTER TABLE institution_profiles ALTER COLUMN institution_phone SET NOT NULL;
  
  -- Make contact_person NOT NULL
  UPDATE institution_profiles SET contact_person = 'Belum diisi' WHERE contact_person IS NULL;
  ALTER TABLE institution_profiles ALTER COLUMN contact_person SET NOT NULL;
  
  -- Drop optional columns
  ALTER TABLE institution_profiles DROP COLUMN IF EXISTS institution_type;
  ALTER TABLE institution_profiles DROP COLUMN IF EXISTS akta;
  ALTER TABLE institution_profiles DROP COLUMN IF EXISTS siup;
  ALTER TABLE institution_profiles DROP COLUMN IF EXISTS website;
  ALTER TABLE institution_profiles DROP COLUMN IF EXISTS social_media;
END $$;

