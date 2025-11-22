-- Migration: Unified OrganizerProfile
-- This migration creates a single unified table to replace IndividualProfile, CommunityProfile, BusinessProfile, and InstitutionProfile

-- Step 1: Create new unified OrganizerProfile table
CREATE TABLE IF NOT EXISTS "organizer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organizer_type" TEXT NOT NULL,
    
    -- Common fields (required)
    "organization_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    
    -- Optional identification fields (simplified)
    "identification_number" TEXT, -- NIK for INDIVIDUAL, NPWP for BUSINESS, etc.
    "contact_person" TEXT, -- For COMMUNITY and INSTITUTION
    
    -- Documents (PDF files only)
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Optional fields (simplified)
    "website" TEXT,
    "social_media" JSONB,
    
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "organizer_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "organizer_profiles_user_id_key" UNIQUE ("user_id")
);

-- Step 2: Migrate data from old tables to new unified table
-- IndividualProfile
INSERT INTO "organizer_profiles" (
    "id", "user_id", "organizer_type", "organization_name", "address", "phone", 
    "identification_number", "documents", "social_media", "created_at", "updated_at"
)
SELECT 
    gen_random_uuid()::TEXT,
    "user_id",
    'INDIVIDUAL',
    COALESCE("personal_address", ''),
    COALESCE("personal_address", ''),
    COALESCE("personal_phone", ''),
    "nik",
    ARRAY[]::TEXT[], -- documents will be migrated separately if needed
    "social_media",
    "created_at",
    "updated_at"
FROM "individual_profiles"
ON CONFLICT ("user_id") DO NOTHING;

-- CommunityProfile
INSERT INTO "organizer_profiles" (
    "id", "user_id", "organizer_type", "organization_name", "address", "phone",
    "contact_person", "documents", "website", "social_media", "created_at", "updated_at"
)
SELECT 
    gen_random_uuid()::TEXT,
    "user_id",
    'COMMUNITY',
    "community_name",
    COALESCE("community_address", ''),
    COALESCE("community_phone", ''),
    "contact_person",
    ARRAY[]::TEXT[],
    "website",
    "social_media",
    "created_at",
    "updated_at"
FROM "community_profiles"
ON CONFLICT ("user_id") DO NOTHING;

-- BusinessProfile
INSERT INTO "organizer_profiles" (
    "id", "user_id", "organizer_type", "organization_name", "address", "phone",
    "identification_number", "documents", "social_media", "created_at", "updated_at"
)
SELECT 
    gen_random_uuid()::TEXT,
    "user_id",
    'SMALL_BUSINESS',
    "business_name",
    COALESCE("business_address", ''),
    COALESCE("business_phone", ''),
    "npwp",
    ARRAY[]::TEXT[],
    "social_media",
    "created_at",
    "updated_at"
FROM "business_profiles"
ON CONFLICT ("user_id") DO NOTHING;

-- InstitutionProfile
INSERT INTO "organizer_profiles" (
    "id", "user_id", "organizer_type", "organization_name", "address", "phone",
    "contact_person", "identification_number", "documents", "website", "social_media", "created_at", "updated_at"
)
SELECT 
    gen_random_uuid()::TEXT,
    "user_id",
    'INSTITUTION',
    "institution_name",
    COALESCE("institution_address", ''),
    COALESCE("institution_phone", ''),
    "contact_person",
    COALESCE("akta", "siup"),
    ARRAY[]::TEXT[],
    "website",
    "social_media",
    "created_at",
    "updated_at"
FROM "institution_profiles"
ON CONFLICT ("user_id") DO NOTHING;

-- Step 3: Add foreign key constraint
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Update User model relation (will be done in schema.prisma)
-- Note: Old profile tables will be dropped in a separate migration after verification

