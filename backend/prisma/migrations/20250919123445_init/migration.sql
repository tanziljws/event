-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('SUPER_ADMIN', 'CS_HEAD', 'CS_SENIOR_AGENT', 'CS_AGENT', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT', 'FINANCE_HEAD', 'FINANCE_SENIOR_AGENT', 'FINANCE_AGENT', 'ORGANIZER', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('APPROVE', 'DECLINE', 'ASSIGN', 'REASSIGN', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT');

-- CreateEnum
CREATE TYPE "audit_entity_type" AS ENUM ('EVENT', 'ORGANIZER', 'USER', 'TICKET', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "department" AS ENUM ('CUSTOMER_SUCCESS', 'OPERATIONS', 'FINANCE', 'ORGANIZER', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "user_position" AS ENUM ('SUPER_ADMIN', 'HEAD', 'SENIOR_AGENT', 'AGENT', 'ORGANIZER', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "event_category" AS ENUM ('ACADEMIC', 'SPORTS', 'ARTS', 'CULTURE', 'TECHNOLOGY', 'BUSINESS', 'HEALTH', 'EDUCATION', 'ENTERTAINMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "otp_purpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD', 'QR_CODE', 'CASH', 'CRYPTO', 'GATEWAY');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('ACTIVE', 'CANCELLED', 'REFUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "organizer_type" AS ENUM ('INDIVIDUAL', 'COMMUNITY', 'SMALL_BUSINESS', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "settlement_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ticket_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "assignment_type" AS ENUM ('EVENT', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "assignment_priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "assignment_status" AS ENUM ('QUEUED', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ticket_category" AS ENUM ('CUSTOMER_SUPPORT', 'EVENT_MANAGEMENT', 'PAYMENT_ISSUE', 'TECHNICAL_ISSUE', 'ORGANIZER_SUPPORT', 'FINANCE_QUERY', 'GENERAL_INQUIRY', 'MARKETING_INQUIRY');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('PAYMENT_FINANCE', 'TECHNICAL_SUPPORT', 'GENERAL_SUPPORT');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('EVENT_REMINDER_H1', 'EVENT_REMINDER_H0', 'REGISTRATION_CONFIRMED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'CERTIFICATE_READY', 'EVENT_CANCELLED', 'EVENT_UPDATED', 'UPGRADE_APPROVED', 'UPGRADE_REJECTED', 'NEW_REGISTRATION', 'GENERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "address" TEXT,
    "last_education" TEXT,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'PARTICIPANT',
    "department" "department" DEFAULT 'PARTICIPANT',
    "user_position" "user_position" DEFAULT 'PARTICIPANT',
    "manager_id" TEXT,
    "employee_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "verification_token_expires" TIMESTAMP(3),
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMP(3),
    "last_activity" TIMESTAMP(3),
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "organizer_type" "organizer_type",
    "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nik" TEXT,
    "personal_address" TEXT,
    "personal_phone" TEXT,
    "portfolio" TEXT[],
    "social_media" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individual_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "community_name" TEXT NOT NULL,
    "community_type" TEXT,
    "community_address" TEXT,
    "community_phone" TEXT,
    "contact_person" TEXT,
    "legal_document" TEXT,
    "website" TEXT,
    "social_media" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "business_type" TEXT,
    "business_address" TEXT,
    "business_phone" TEXT,
    "npwp" TEXT,
    "legal_document" TEXT,
    "logo" TEXT,
    "social_media" JSONB,
    "portfolio" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "institution_type" TEXT,
    "institution_address" TEXT,
    "institution_phone" TEXT,
    "contact_person" TEXT,
    "akta" TEXT,
    "siup" TEXT,
    "website" TEXT,
    "social_media" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "thumbnail_url" TEXT,
    "gallery_urls" TEXT[],
    "flyer_url" TEXT,
    "certificate_template_url" TEXT,
    "description" TEXT,
    "max_participants" INTEGER NOT NULL,
    "registration_deadline" TIMESTAMP(3) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "generate_certificate" BOOLEAN NOT NULL DEFAULT false,
    "status" "event_status" NOT NULL DEFAULT 'DRAFT',
    "category" "event_category" NOT NULL DEFAULT 'OTHER',
    "price" DECIMAL(10,2),
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "platform_fee" DECIMAL(5,2),
    "organizer_revenue" DECIMAL(10,2),
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "private_password" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "registration_token" TEXT NOT NULL,
    "has_attended" BOOLEAN NOT NULL DEFAULT false,
    "attendance_time" TIMESTAMP(3),
    "certificate_url" TEXT,
    "qr_code_url" TEXT,
    "status" "registration_status" NOT NULL DEFAULT 'ACTIVE',
    "cancelled_at" TIMESTAMP(3),
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended_at" TIMESTAMP(3),

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp_code" TEXT NOT NULL,
    "purpose" "otp_purpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT,
    "event_id" TEXT,
    "user_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "payment_method" "payment_method" NOT NULL,
    "payment_status" "payment_status" NOT NULL,
    "payment_reference" TEXT,
    "payment_url" TEXT,
    "qr_code_url" TEXT,
    "qr_code_data" TEXT,
    "paid_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "qr_code_url" TEXT,
    "qr_code_data" TEXT,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "used_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "audit_action" NOT NULL,
    "entity_type" "audit_entity_type" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "previous_status" TEXT,
    "new_status" TEXT,
    "notes" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "certificate_url" TEXT NOT NULL,
    "verification_hash" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "background_image" TEXT,
    "background_size" TEXT NOT NULL DEFAULT 'cover',
    "elements" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_certificate_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "background_image" TEXT,
    "background_size" TEXT NOT NULL DEFAULT 'cover',
    "elements" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_cancellations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "cancelled_by" TEXT NOT NULL,
    "cancellation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policy" TEXT NOT NULL,
    "refund_required" BOOLEAN NOT NULL DEFAULT false,
    "refund_percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "late_cancellation_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "registration_id" TEXT NOT NULL,
    "cancellation_id" TEXT,
    "refund_amount" INTEGER NOT NULL,
    "fee_amount" INTEGER NOT NULL DEFAULT 0,
    "net_refund" INTEGER NOT NULL,
    "refund_percentage" DOUBLE PRECISION NOT NULL,
    "refund_status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "refund_method" "payment_method" NOT NULL,
    "refund_reference" TEXT NOT NULL,
    "gateway_response" TEXT,
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_headers" (
    "id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cta_text" TEXT NOT NULL,
    "cta_link" TEXT NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_events" INTEGER NOT NULL,
    "published_events" INTEGER NOT NULL,
    "total_registrations" INTEGER NOT NULL,
    "total_revenue" DECIMAL(12,2) NOT NULL,
    "platform_fee" DECIMAL(12,2) NOT NULL,
    "organizer_revenue" DECIMAL(12,2) NOT NULL,
    "active_organizers" INTEGER NOT NULL,
    "new_organizers" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_revenue" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "total_revenue" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "organizer_amount" DECIMAL(10,2) NOT NULL,
    "fee_percentage" DECIMAL(5,2) NOT NULL,
    "settlement_status" "settlement_status" NOT NULL DEFAULT 'PENDING',
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_tickets" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "department" "department" NOT NULL,
    "priority" "ticket_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
    "category" "ticket_category" NOT NULL,
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "tags" TEXT[],
    "attachments" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "team_type" "TeamType" NOT NULL,
    "categories" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_assignments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "is_auto_assigned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "team_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_queue" (
    "id" TEXT NOT NULL,
    "type" "assignment_type" NOT NULL,
    "item_id" TEXT NOT NULL,
    "priority" "assignment_priority" NOT NULL DEFAULT 'NORMAL',
    "status" "assignment_status" NOT NULL DEFAULT 'QUEUED',
    "assigned_to" TEXT,
    "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_history" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "individual_profiles_user_id_key" ON "individual_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_profiles_user_id_key" ON "community_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_user_id_key" ON "business_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "institution_profiles_user_id_key" ON "institution_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_registration_token_key" ON "event_registrations"("registration_token");

-- CreateIndex
CREATE INDEX "event_registrations_event_id_registered_at_idx" ON "event_registrations"("event_id", "registered_at");

-- CreateIndex
CREATE INDEX "event_registrations_participant_id_idx" ON "event_registrations"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_participant_id_key" ON "event_registrations"("event_id", "participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_reference_key" ON "payments"("payment_reference");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_performed_at_idx" ON "audit_logs"("performed_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_registration_id_key" ON "certificates"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "certificates"("certificate_number");

-- CreateIndex
CREATE INDEX "certificates_certificate_number_idx" ON "certificates"("certificate_number");

-- CreateIndex
CREATE INDEX "certificates_issued_at_idx" ON "certificates"("issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_event_id_key" ON "certificate_templates"("event_id");

-- CreateIndex
CREATE INDEX "certificate_templates_event_id_idx" ON "certificate_templates"("event_id");

-- CreateIndex
CREATE INDEX "global_certificate_templates_is_default_idx" ON "global_certificate_templates"("is_default");

-- CreateIndex
CREATE INDEX "global_certificate_templates_is_active_idx" ON "global_certificate_templates"("is_active");

-- CreateIndex
CREATE INDEX "event_cancellations_event_id_idx" ON "event_cancellations"("event_id");

-- CreateIndex
CREATE INDEX "event_cancellations_cancellation_date_idx" ON "event_cancellations"("cancellation_date");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_refund_reference_key" ON "refunds"("refund_reference");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_registration_id_idx" ON "refunds"("registration_id");

-- CreateIndex
CREATE INDEX "refunds_refund_reference_idx" ON "refunds"("refund_reference");

-- CreateIndex
CREATE INDEX "refunds_refund_status_idx" ON "refunds"("refund_status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_analytics_date_key" ON "platform_analytics"("date");

-- CreateIndex
CREATE INDEX "platform_analytics_date_idx" ON "platform_analytics"("date");

-- CreateIndex
CREATE INDEX "organizer_revenue_organizer_id_idx" ON "organizer_revenue"("organizer_id");

-- CreateIndex
CREATE INDEX "organizer_revenue_event_id_idx" ON "organizer_revenue"("event_id");

-- CreateIndex
CREATE INDEX "organizer_revenue_settlement_status_idx" ON "organizer_revenue"("settlement_status");

-- CreateIndex
CREATE INDEX "department_tickets_department_idx" ON "department_tickets"("department");

-- CreateIndex
CREATE INDEX "department_tickets_status_idx" ON "department_tickets"("status");

-- CreateIndex
CREATE INDEX "department_tickets_assigned_to_idx" ON "department_tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "department_tickets_created_by_idx" ON "department_tickets"("created_by");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_assignments_ticket_id_key" ON "team_assignments"("ticket_id");

-- CreateIndex
CREATE INDEX "assignment_queue_status_priority_idx" ON "assignment_queue"("status", "priority");

-- CreateIndex
CREATE INDEX "assignment_queue_queued_at_idx" ON "assignment_queue"("queued_at");

-- CreateIndex
CREATE INDEX "assignment_history_item_type_item_id_idx" ON "assignment_history"("item_type", "item_id");

-- CreateIndex
CREATE INDEX "assignment_history_agent_id_idx" ON "assignment_history"("agent_id");

-- CreateIndex
CREATE INDEX "assignment_history_user_id_idx" ON "assignment_history"("user_id");

-- CreateIndex
CREATE INDEX "assignment_history_timestamp_idx" ON "assignment_history"("timestamp");

-- CreateIndex
CREATE INDEX "assignment_history_type_idx" ON "assignment_history"("type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_profiles" ADD CONSTRAINT "individual_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_profiles" ADD CONSTRAINT "community_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_profiles" ADD CONSTRAINT "institution_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_certificate_templates" ADD CONSTRAINT "global_certificate_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_cancellations" ADD CONSTRAINT "event_cancellations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_cancellation_id_fkey" FOREIGN KEY ("cancellation_id") REFERENCES "event_cancellations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_revenue" ADD CONSTRAINT "organizer_revenue_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_revenue" ADD CONSTRAINT "organizer_revenue_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_tickets" ADD CONSTRAINT "department_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_tickets" ADD CONSTRAINT "department_tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "department_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "department_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_history" ADD CONSTRAINT "assignment_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
