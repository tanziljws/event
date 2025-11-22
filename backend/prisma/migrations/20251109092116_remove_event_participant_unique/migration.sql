-- Remove unique constraint to allow multiple ticket purchases per event
ALTER TABLE "event_registrations" DROP CONSTRAINT IF EXISTS "event_registrations_eventId_participantId_key";
