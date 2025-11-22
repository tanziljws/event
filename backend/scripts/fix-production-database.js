#!/usr/bin/env node

/**
 * Fix Production Database - Add missing columns
 * 
 * This script adds missing columns (event_end_date, event_end_time) to the events table
 * Run this on Railway production database
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const logger = require('../src/config/logger');

const prisma = new PrismaClient();

async function checkColumnExists(tableName, columnName) {
  try {
    const result = await prisma.$queryRawUnsafe(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = $1 AND column_name = $2`,
      tableName,
      columnName
    );
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    logger.error(`Error checking column ${columnName}:`, error);
    return false;
  }
}

async function addColumn(tableName, columnName, columnType) {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${columnType}`
    );
    logger.info(`✅ Added column ${columnName} to ${tableName}`);
    return true;
  } catch (error) {
    logger.error(`❌ Error adding column ${columnName}:`, error);
    return false;
  }
}

async function fixProductionDatabase() {
  try {
    logger.info('🔧 Starting database fix...');
    logger.info('📍 Environment:', process.env.NODE_ENV);
    logger.info('📍 Database:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');

    // Check if event_end_date exists
    const hasEventEndDate = await checkColumnExists('events', 'event_end_date');
    const hasEventEndTime = await checkColumnExists('events', 'event_end_time');
    const hasDocuments = await checkColumnExists('individual_profiles', 'documents');

    logger.info(`📊 Current status:`);
    logger.info(`   events.event_end_date: ${hasEventEndDate ? '✅ Exists' : '❌ Missing'}`);
    logger.info(`   events.event_end_time: ${hasEventEndTime ? '✅ Exists' : '❌ Missing'}`);
    logger.info(`   individual_profiles.documents: ${hasDocuments ? '✅ Exists' : '❌ Missing'}`);

    let fixed = false;

    // Add event_end_date if missing
    if (!hasEventEndDate) {
      logger.info('➕ Adding event_end_date column...');
      const success = await addColumn('events', 'event_end_date', 'TIMESTAMP(3)');
      if (success) fixed = true;
    }

    // Add event_end_time if missing
    if (!hasEventEndTime) {
      logger.info('➕ Adding event_end_time column...');
      const success = await addColumn('events', 'event_end_time', 'TEXT');
      if (success) fixed = true;
    }

    // Add documents column to individual_profiles if missing
    if (!hasDocuments) {
      logger.info('➕ Adding documents column to individual_profiles...');
      const success = await addColumn('individual_profiles', 'documents', 'TEXT[]');
      if (success) fixed = true;
    }

    if (fixed) {
      logger.info('✅ Database fix completed!');
      logger.info('🔄 Regenerating Prisma Client...');
      
      // Regenerate Prisma Client
      try {
        execSync('npx prisma generate', { stdio: 'inherit' });
        logger.info('✅ Prisma Client regenerated');
      } catch (error) {
        logger.warn('⚠️  Error regenerating Prisma Client:', error.message);
      }
    } else {
      logger.info('✅ All columns already exist - no changes needed');
    }

    // Verify
    logger.info('\n📋 Verification:');
    const finalHasEventEndDate = await checkColumnExists('events', 'event_end_date');
    const finalHasEventEndTime = await checkColumnExists('events', 'event_end_time');
    const finalHasDocuments = await checkColumnExists('individual_profiles', 'documents');
    
    logger.info(`   events.event_end_date: ${finalHasEventEndDate ? '✅' : '❌'}`);
    logger.info(`   events.event_end_time: ${finalHasEventEndTime ? '✅' : '❌'}`);
    logger.info(`   individual_profiles.documents: ${finalHasDocuments ? '✅' : '❌'}`);

    if (finalHasEventEndDate && finalHasEventEndTime && finalHasDocuments) {
      logger.info('\n🎉 Database is now up to date!');
      logger.info('✅ API should work correctly now');
    } else {
      logger.error('\n❌ Some columns are still missing. Please check manually.');
    }

  } catch (error) {
    logger.error('❌ Error fixing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixProductionDatabase()
    .then(() => {
      logger.info('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixProductionDatabase };

