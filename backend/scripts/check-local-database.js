#!/usr/bin/env node

/**
 * Check Local Database Structure
 * 
 * This script checks the local PostgreSQL database structure
 * and compares it with the Prisma schema
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
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      tableName,
      columnName
    );
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error(`Error checking column ${columnName}:`, error);
    return null;
  }
}

async function getTableColumns(tableName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns 
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      tableName
    );
    return result;
  } catch (error) {
    logger.error(`Error getting columns for ${tableName}:`, error);
    return [];
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

async function checkLocalDatabase() {
  try {
    logger.info('🔍 Checking Local Database Structure...');
    logger.info('📍 Database URL:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');
    logger.info('');

    // Check ticket_types table
    logger.info('📊 Checking ticket_types table...');
    const hasTicketTypesTable = await checkTableExists('ticket_types');
    logger.info(`   ticket_types table: ${hasTicketTypesTable ? '✅ EXISTS' : '❌ MISSING'}`);

    if (hasTicketTypesTable) {
      const columns = await getTableColumns('ticket_types');
      logger.info(`   Columns (${columns.length}):`);
      columns.forEach(col => {
        logger.info(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

    // Check event_registrations columns
    logger.info('');
    logger.info('📊 Checking event_registrations table...');
    const hasTicketTypeId = await checkColumnExists('event_registrations', 'ticket_type_id');
    const hasTicketBenefits = await checkColumnExists('event_registrations', 'ticket_benefits');

    logger.info(`   ticket_type_id column: ${hasTicketTypeId ? '✅ EXISTS' : '❌ MISSING'}`);
    if (hasTicketTypeId) {
      logger.info(`     Type: ${hasTicketTypeId.data_type}, Nullable: ${hasTicketTypeId.is_nullable}`);
    }

    logger.info(`   ticket_benefits column: ${hasTicketBenefits ? '✅ EXISTS' : '❌ MISSING'}`);
    if (hasTicketBenefits) {
      logger.info(`     Type: ${hasTicketBenefits.data_type}, Nullable: ${hasTicketBenefits.is_nullable}`);
    }

    // Check events columns
    logger.info('');
    logger.info('📊 Checking events table...');
    const hasMultipleTicketTypes = await checkColumnExists('events', 'has_multiple_ticket_types');
    const hasEventEndDate = await checkColumnExists('events', 'event_end_date');
    const hasEventEndTime = await checkColumnExists('events', 'event_end_time');

    logger.info(`   has_multiple_ticket_types column: ${hasMultipleTicketTypes ? '✅ EXISTS' : '❌ MISSING'}`);
    if (hasMultipleTicketTypes) {
      logger.info(`     Type: ${hasMultipleTicketTypes.data_type}, Default: ${hasMultipleTicketTypes.column_default}`);
    }

    logger.info(`   event_end_date column: ${hasEventEndDate ? '✅ EXISTS' : '❌ MISSING'}`);
    if (hasEventEndDate) {
      logger.info(`     Type: ${hasEventEndDate.data_type}, Nullable: ${hasEventEndDate.is_nullable}`);
    }

    logger.info(`   event_end_time column: ${hasEventEndTime ? '✅ EXISTS' : '❌ MISSING'}`);
    if (hasEventEndTime) {
      logger.info(`     Type: ${hasEventEndTime.data_type}, Nullable: ${hasEventEndTime.is_nullable}`);
    }

    // Check indexes
    logger.info('');
    logger.info('📊 Checking indexes...');
    const indexes = [
      'ticket_types_event_id_idx',
      'ticket_types_is_active_idx',
      'ticket_types_sort_order_idx',
      'event_registrations_ticket_type_id_idx',
    ];

    for (const idx of indexes) {
      const exists = await checkIndexExists(idx);
      logger.info(`   ${idx}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // Check foreign keys
    logger.info('');
    logger.info('📊 Checking foreign keys...');
    const foreignKeys = [
      'ticket_types_event_id_fkey',
      'event_registrations_ticket_type_id_fkey',
    ];

    for (const fk of foreignKeys) {
      const exists = await checkForeignKeyExists(fk);
      logger.info(`   ${fk}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    }

    // Summary
    logger.info('');
    logger.info('📋 Summary:');
    const allGood = hasTicketTypesTable && 
                    hasTicketTypeId && 
                    hasTicketBenefits && 
                    hasMultipleTicketTypes &&
                    hasEventEndDate &&
                    hasEventEndTime;

    if (allGood) {
      logger.info('✅ All required tables and columns exist!');
      logger.info('✅ Local database is up to date with Prisma schema');
    } else {
      logger.info('⚠️  Some tables/columns are missing:');
      if (!hasTicketTypesTable) logger.info('   ❌ ticket_types table');
      if (!hasTicketTypeId) logger.info('   ❌ event_registrations.ticket_type_id');
      if (!hasTicketBenefits) logger.info('   ❌ event_registrations.ticket_benefits');
      if (!hasMultipleTicketTypes) logger.info('   ❌ events.has_multiple_ticket_types');
      if (!hasEventEndDate) logger.info('   ❌ events.event_end_date');
      if (!hasEventEndTime) logger.info('   ❌ events.event_end_time');
      logger.info('');
      logger.info('💡 To fix, run:');
      logger.info('   npm run fix:tickets');
      logger.info('   or');
      logger.info('   node scripts/fix-multiple-tickets-production.js');
    }

    // Count records
    logger.info('');
    logger.info('📊 Database Records:');
    try {
      const ticketTypesCount = await prisma.ticketType.count();
      logger.info(`   ticket_types: ${ticketTypesCount} records`);
      
      const registrationsCount = await prisma.eventRegistration.count();
      logger.info(`   event_registrations: ${registrationsCount} records`);
      
      const eventsCount = await prisma.event.count();
      logger.info(`   events: ${eventsCount} records`);
    } catch (error) {
      logger.warn('⚠️  Could not count records:', error.message);
    }

  } catch (error) {
    logger.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkLocalDatabase()
    .then(() => {
      logger.info('');
      logger.info('✅ Database check completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('');
      logger.error('❌ Database check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkLocalDatabase };

