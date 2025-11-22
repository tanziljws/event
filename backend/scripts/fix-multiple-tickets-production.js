#!/usr/bin/env node

/**
 * Fix Production Database - Add Multiple Ticket Types Support
 * 
 * This script applies the multiple ticket types migrations to production database:
 * 1. Creates ticket_types table if missing
 * 2. Adds ticket_type_id and ticket_benefits columns to event_registrations if missing
 * 3. Adds has_multiple_ticket_types column to events if missing
 * 4. Creates necessary indexes and foreign keys
 * 
 * Run this on Railway production database
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const logger = require('../src/config/logger');

const prisma = new PrismaClient();

async function checkTableExists(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = $1`,
      tableName
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      tableName,
      columnName
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error(`Error checking column ${columnName}:`, error);
    return false;
  }
}

async function checkIndexExists(indexName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT indexname 
       FROM pg_indexes 
       WHERE schemaname = 'public' AND indexname = $1`,
      indexName
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error(`Error checking index ${indexName}:`, error);
    return false;
  }
}

async function checkForeignKeyExists(constraintName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT constraint_name 
       FROM information_schema.table_constraints 
       WHERE constraint_schema = 'public' AND constraint_name = $1`,
      constraintName
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error(`Error checking foreign key ${constraintName}:`, error);
    return false;
  }
}

async function createTicketTypesTable() {
  try {
    logger.info('📦 Creating ticket_types table...');
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ticket_types" (
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
        "color" VARCHAR(7) DEFAULT '#2563EB',
        "icon" VARCHAR(50) DEFAULT 'ticket',
        "badge_text" VARCHAR(50),
        "min_quantity" INTEGER DEFAULT 1,
        "max_quantity" INTEGER DEFAULT 10,
        "requires_approval" BOOLEAN DEFAULT false,
        "terms_conditions" TEXT,
        "original_price" DECIMAL(10,2),
        "discount_percentage" DECIMAL(5,2),
        "promo_code" VARCHAR(50),
        "metadata" JSONB,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id")
      )
    `);
    
    logger.info('✅ ticket_types table created');
    return true;
  } catch (error) {
    logger.error('❌ Error creating ticket_types table:', error);
    return false;
  }
}

async function addForeignKeysAndIndexes() {
  try {
    // Add foreign key from ticket_types to events
    if (!(await checkForeignKeyExists('ticket_types_event_id_fkey'))) {
      logger.info('🔗 Adding foreign key ticket_types_event_id_fkey...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ticket_types" 
        ADD CONSTRAINT "ticket_types_event_id_fkey" 
        FOREIGN KEY ("event_id") REFERENCES "events"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      logger.info('✅ Foreign key ticket_types_event_id_fkey added');
    }

    // Add indexes for ticket_types
    const indexes = [
      { name: 'ticket_types_event_id_idx', sql: 'CREATE INDEX IF NOT EXISTS "ticket_types_event_id_idx" ON "ticket_types"("event_id")' },
      { name: 'ticket_types_is_active_idx', sql: 'CREATE INDEX IF NOT EXISTS "ticket_types_is_active_idx" ON "ticket_types"("is_active")' },
      { name: 'ticket_types_sort_order_idx', sql: 'CREATE INDEX IF NOT EXISTS "ticket_types_sort_order_idx" ON "ticket_types"("sort_order")' },
    ];

    for (const idx of indexes) {
      if (!(await checkIndexExists(idx.name))) {
        logger.info(`📊 Creating index ${idx.name}...`);
        await prisma.$executeRawUnsafe(idx.sql);
        logger.info(`✅ Index ${idx.name} created`);
      }
    }

    // Add foreign key from event_registrations to ticket_types
    if (!(await checkForeignKeyExists('event_registrations_ticket_type_id_fkey'))) {
      logger.info('🔗 Adding foreign key event_registrations_ticket_type_id_fkey...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "event_registrations" 
        ADD CONSTRAINT "event_registrations_ticket_type_id_fkey" 
        FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      logger.info('✅ Foreign key event_registrations_ticket_type_id_fkey added');
    }

    // Add index for event_registrations.ticket_type_id
    if (!(await checkIndexExists('event_registrations_ticket_type_id_idx'))) {
      logger.info('📊 Creating index event_registrations_ticket_type_id_idx...');
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "event_registrations_ticket_type_id_idx" 
        ON "event_registrations"("ticket_type_id")
      `);
      logger.info('✅ Index event_registrations_ticket_type_id_idx created');
    }

    return true;
  } catch (error) {
    logger.error('❌ Error adding foreign keys and indexes:', error);
    return false;
  }
}

async function addColumn(tableName, columnName, columnType, defaultValue = null) {
  try {
    const defaultValueClause = defaultValue !== null ? `DEFAULT ${defaultValue}` : '';
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${columnType} ${defaultValueClause}`
    );
    logger.info(`✅ Added column ${columnName} to ${tableName}`);
    return true;
  } catch (error) {
    logger.error(`❌ Error adding column ${columnName}:`, error);
    return false;
  }
}

async function fixMultipleTicketsProduction() {
  try {
    logger.info('🎫 Starting multiple ticket types migration...');
    logger.info('📍 Environment:', process.env.NODE_ENV || 'production');
    logger.info('📍 Database:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');

    let changesMade = false;

    // Step 1: Create ticket_types table if missing
    const hasTicketTypesTable = await checkTableExists('ticket_types');
    logger.info(`📊 ticket_types table: ${hasTicketTypesTable ? '✅ Exists' : '❌ Missing'}`);

    if (!hasTicketTypesTable) {
      const success = await createTicketTypesTable();
      if (success) changesMade = true;
    }

    // Step 2: Add columns to event_registrations
    const hasTicketTypeId = await checkColumnExists('event_registrations', 'ticket_type_id');
    const hasTicketBenefits = await checkColumnExists('event_registrations', 'ticket_benefits');

    logger.info(`📊 event_registrations.ticket_type_id: ${hasTicketTypeId ? '✅ Exists' : '❌ Missing'}`);
    logger.info(`📊 event_registrations.ticket_benefits: ${hasTicketBenefits ? '✅ Exists' : '❌ Missing'}`);

    if (!hasTicketTypeId) {
      const success = await addColumn('event_registrations', 'ticket_type_id', 'TEXT');
      if (success) changesMade = true;
    }

    if (!hasTicketBenefits) {
      const success = await addColumn('event_registrations', 'ticket_benefits', 'JSONB');
      if (success) changesMade = true;
    }

    // Step 3: Add column to events
    const hasMultipleTicketTypes = await checkColumnExists('events', 'has_multiple_ticket_types');
    logger.info(`📊 events.has_multiple_ticket_types: ${hasMultipleTicketTypes ? '✅ Exists' : '❌ Missing'}`);

    if (!hasMultipleTicketTypes) {
      const success = await addColumn('events', 'has_multiple_ticket_types', 'BOOLEAN', 'DEFAULT false NOT NULL');
      if (success) changesMade = true;
    }

    // Step 4: Add foreign keys and indexes
    logger.info('🔗 Checking foreign keys and indexes...');
    const fkSuccess = await addForeignKeysAndIndexes();
    if (fkSuccess) changesMade = true;

    if (changesMade) {
      logger.info('\n✅ Multiple ticket types migration completed!');
      logger.info('🔄 Please restart your application to ensure Prisma Client is in sync');
    } else {
      logger.info('\n✅ All multiple ticket types migrations already applied - no changes needed');
    }

    // Verification
    logger.info('\n📋 Verification:');
    const finalHasTicketTypesTable = await checkTableExists('ticket_types');
    const finalHasTicketTypeId = await checkColumnExists('event_registrations', 'ticket_type_id');
    const finalHasTicketBenefits = await checkColumnExists('event_registrations', 'ticket_benefits');
    const finalHasMultipleTicketTypes = await checkColumnExists('events', 'has_multiple_ticket_types');

    logger.info(`   ticket_types table: ${finalHasTicketTypesTable ? '✅' : '❌'}`);
    logger.info(`   event_registrations.ticket_type_id: ${finalHasTicketTypeId ? '✅' : '❌'}`);
    logger.info(`   event_registrations.ticket_benefits: ${finalHasTicketBenefits ? '✅' : '❌'}`);
    logger.info(`   events.has_multiple_ticket_types: ${finalHasMultipleTicketTypes ? '✅' : '❌'}`);

    if (finalHasTicketTypesTable && finalHasTicketTypeId && finalHasTicketBenefits && finalHasMultipleTicketTypes) {
      logger.info('\n🎉 Multiple ticket types support is now enabled!');
      logger.info('✅ Tickets should load correctly now');
    } else {
      logger.error('\n❌ Some components are still missing. Please check manually.');
    }

  } catch (error) {
    logger.error('❌ Error applying multiple ticket types migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixMultipleTicketsProduction()
    .then(() => {
      logger.info('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixMultipleTicketsProduction };

