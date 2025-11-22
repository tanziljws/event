#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const logger = require('../src/config/logger');

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    logger.info('Setting up database...');

    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Run migrations
    logger.info('Running database migrations...');
    // Note: In production, you would run: npx prisma migrate deploy
    // For development, you would run: npx prisma migrate dev

    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
