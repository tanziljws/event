#!/bin/bash

# Auto-fix Production Database Script
# This script runs all database fixes automatically on Railway

set -e

echo "🔧 Starting automatic production database fixes..."
echo "📍 Environment: ${NODE_ENV:-production}"
echo "📍 Database: ${DATABASE_URL:+Connected}"

cd "$(dirname "$0")/.."

# Run fix scripts
echo ""
echo "📦 Running multiple tickets fix..."
node scripts/fix-multiple-tickets-production.js

echo ""
echo "✅ All database fixes completed!"
echo "🚀 Server can now start normally"

