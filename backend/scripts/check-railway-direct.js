#!/usr/bin/env node

/**
 * Check Railway Production Database Structure (Direct Connection)
 * 
 * This script checks Railway database directly using DATABASE_URL from environment
 * No need for Railway CLI service name
 * 
 * Usage:
 *   # Set DATABASE_URL first
 *   export DATABASE_URL="postgresql://postgres:password@host:port/db"
 *   node scripts/check-railway-direct.js
 * 
 *   # Or pass via Railway CLI
 *   railway variables --set DATABASE_URL="..." && node scripts/check-railway-direct.js
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

async function checkRailwayDatabaseDirect() {
  try {
    logger.info('🔍 Checking Railway Production Database Structure (Direct Connection)...');
    
    if (!process.env.DATABASE_URL) {
      logger.error('❌ DATABASE_URL not found in environment variables!');
      logger.error('');
      logger.error('💡 Please set DATABASE_URL:');
      logger.error('   export DATABASE_URL="postgresql://postgres:password@host:port/db"');
      logger.error('');
      logger.error('   Or run from Railway directory:');
      logger.error('   cd backend');
      logger.error('   railway link');
      logger.error('   railway variables');
      process.exit(1);
    }

    // Extract database info from URL (without password)
    const url = new URL(process.env.DATABASE_URL);
    logger.info('📍 Database Connection:');
    logger.info(`   Host: ${url.hostname}:${url.port}`);
    logger.info(`   Database: ${url.pathname.substring(1)}`);
    logger.info(`   User: ${url.username}`);
    logger.info('');

    let allGood = true;
    const missingItems = [];

    // Check ticket_types table
    logger.info('📊 Checking ticket_types table...');
    const hasTicketTypesTable = await checkTableExists('ticket_types');
    logger.info(`   ticket_types table: ${hasTicketTypesTable ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!hasTicketTypesTable) {
      allGood = false;
      missingItems.push('ticket_types table');
    }

    // Check event_registrations columns
    logger.info('');
    logger.info('📊 Checking event_registrations table...');
    const hasTicketTypeId = await checkColumnExists('event_registrations', 'ticket_type_id');
    const hasTicketBenefits = await checkColumnExists('event_registrations', 'ticket_benefits');

    logger.info(`   ticket_type_id column: ${hasTicketTypeId ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!hasTicketTypeId) {
      allGood = false;
      missingItems.push('event_registrations.ticket_type_id');
    }

    logger.info(`   ticket_benefits column: ${hasTicketBenefits ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!hasTicketBenefits) {
      allGood = false;
      missingItems.push('event_registrations.ticket_benefits');
    }

    // Check events columns
    logger.info('');
    logger.info('📊 Checking events table...');
    const hasMultipleTicketTypes = await checkColumnExists('events', 'has_multiple_ticket_types');
    const hasEventEndDate = await checkColumnExists('events', 'event_end_date');
    const hasEventEndTime = await checkColumnExists('events', 'event_end_time');

    logger.info(`   has_multiple_ticket_types column: ${hasMultipleTicketTypes ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!hasMultipleTicketTypes) {
      allGood = false;
      missingItems.push('events.has_multiple_ticket_types');
    }

    logger.info(`   event_end_date column: ${hasEventEndDate ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!hasEventEndDate) {
      allGood = false;
      missingItems.push('events.event_end_date');
    }

    logger.info(`   event_end_time column: ${hasEventEndTime ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!hasEventEndTime) {
      allGood = false;
      missingItems.push('events.event_end_time');
    }

    // Check individual_profiles.documents
    logger.info('');
    logger.info('📊 Checking individual_profiles table...');
    const hasDocuments = await checkColumnExists('individual_profiles', 'documents');
    logger.info(`   documents column: ${hasDocuments ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!hasDocuments) {
      allGood = false;
      missingItems.push('individual_profiles.documents');
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
      if (!exists) {
        allGood = false;
        missingItems.push(`index: ${idx}`);
      }
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
      if (!exists) {
        allGood = false;
        missingItems.push(`foreign key: ${fk}`);
      }
    }

    // Summary
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');
    if (allGood) {
      logger.info('✅ SUMMARY: All required tables and columns exist!');
      logger.info('✅ Railway database is up to date with Prisma schema');
      logger.info('✅ Database matches local database structure');
    } else {
      logger.info('❌ SUMMARY: Some components are missing:');
      missingItems.forEach(item => {
        logger.info(`   ❌ ${item}`);
      });
      logger.info('');
      logger.info('💡 To fix, run:');
      logger.info('   node scripts/fix-multiple-tickets-production.js');
      logger.info('   node scripts/fix-production-database.js');
      logger.info('   # or');
      logger.info('   npm run fix:all');
    }
    logger.info('═══════════════════════════════════════════════════════');

    // Count records (optional)
    if (allGood) {
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
    }

    return allGood;
  } catch (error) {
    logger.error('❌ Error checking database:', error);
    logger.error('');
    logger.error('💡 Make sure DATABASE_URL is correct and database is accessible');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkRailwayDatabaseDirect()
    .then((allGood) => {
      logger.info('');
      if (allGood) {
        logger.info('✅ Database check completed - All good!');
        process.exit(0);
      } else {
        logger.info('⚠️  Database check completed - Fixes needed');
        process.exit(1);
      }
    })
    .catch((error) => {
      logger.error('');
      logger.error('❌ Database check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkRailwayDatabaseDirect };

