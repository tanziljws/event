-- CreateTable
CREATE TABLE "ticket_types" (
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
    -- Custom styling & branding
    "color" VARCHAR(7) DEFAULT '#2563EB',
    "icon" VARCHAR(50) DEFAULT 'ticket',
    "badge_text" VARCHAR(50),
    -- Advanced settings
    "min_quantity" INTEGER DEFAULT 1,
    "max_quantity" INTEGER DEFAULT 10,
    "requires_approval" BOOLEAN DEFAULT false,
    "terms_conditions" TEXT,
    -- Discount & promotion
    "original_price" DECIMAL(10,2),
    "discount_percentage" DECIMAL(5,2),
    "promo_code" VARCHAR(50),
    -- Metadata
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ticket_types_event_id_idx" ON "ticket_types"("event_id");
CREATE INDEX "ticket_types_is_active_idx" ON "ticket_types"("is_active");
CREATE INDEX "ticket_types_sort_order_idx" ON "ticket_types"("sort_order");

-- AlterTable: Add ticket_type_id to event_registrations
ALTER TABLE "event_registrations" ADD COLUMN "ticket_type_id" TEXT;
ALTER TABLE "event_registrations" ADD COLUMN "ticket_benefits" JSONB;

-- AddForeignKey for event_registrations
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex for event_registrations
CREATE INDEX "event_registrations_ticket_type_id_idx" ON "event_registrations"("ticket_type_id");