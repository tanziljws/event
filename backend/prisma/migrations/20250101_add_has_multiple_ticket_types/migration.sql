-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "has_multiple_ticket_types" BOOLEAN NOT NULL DEFAULT false;
