#!/bin/bash

# Script to start backend in local development mode
# Usage: ./scripts/start-local.sh

echo "🚀 Starting backend in local development mode..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please create .env file with required configuration."
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if database is accessible
echo "🔍 Checking database connection..."
node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Please check your DATABASE_URL in .env file');
    process.exit(1);
  });
" || exit 1

echo ""
echo "✅ Pre-flight checks passed!"
echo ""
echo "📋 Configuration:"
echo "   PORT: ${PORT:-5001}"
echo "   NODE_ENV: ${NODE_ENV:-development}"
echo ""
echo "🚀 Starting server..."
echo ""

# Start server
npm run dev

