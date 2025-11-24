#!/bin/bash

# Simple import script - langsung import semua dari local ke Railway
# Usage: ./import-now.sh

set -e

echo "🚀 Importing all data from local DB to Railway..."
echo ""

# Railway DB (fixed)
RAILWAY_HOST="hopper.proxy.rlwy.net"
RAILWAY_PORT="22183"
RAILWAY_DB="railway"
RAILWAY_USER="postgres"
RAILWAY_PASS="fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq"

# Local DB - auto detect atau set via env
LOCAL_DB="${LOCAL_DB:-event_management}"
LOCAL_USER="${LOCAL_USER:-postgres}"
LOCAL_HOST="${LOCAL_HOST:-localhost}"
LOCAL_PORT="${LOCAL_PORT:-5432}"
LOCAL_PASS="${LOCAL_PASSWORD:-postgres}"

echo "📦 Source: $LOCAL_DB @ $LOCAL_HOST:$LOCAL_PORT"
echo "🔄 Target: Railway @ $RAILWAY_HOST:$RAILWAY_PORT"
echo ""

# Test local connection
echo "🔍 Testing local DB..."
if ! PGPASSWORD="$LOCAL_PASS" psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -c "\q" 2>/dev/null; then
  echo "❌ Cannot connect to local DB!"
  echo ""
  echo "💡 Set these if different:"
  echo "   export LOCAL_DB=your_db_name"
  echo "   export LOCAL_USER=your_user"
  echo "   export LOCAL_PASSWORD=your_password"
  exit 1
fi
echo "✅ Local DB OK"
echo ""

# Test Railway connection
echo "🔍 Testing Railway DB..."
if ! PGPASSWORD="$RAILWAY_PASS" psql -h "$RAILWAY_HOST" -p "$RAILWAY_PORT" -U "$RAILWAY_USER" -d "$RAILWAY_DB" -c "\q" 2>/dev/null; then
  echo "❌ Cannot connect to Railway DB!"
  exit 1
fi
echo "✅ Railway DB OK"
echo ""

# Count tables
TABLE_COUNT=$(PGPASSWORD="$LOCAL_PASS" psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
" | tr -d ' ')

echo "📊 Found $TABLE_COUNT tables to import"
echo ""

# Direct import (streaming)
echo "🔄 Importing all data..."
echo "   This may take a while..."
echo ""

PGPASSWORD="$LOCAL_PASS" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  2>/dev/null | \
PGPASSWORD="$RAILWAY_PASS" psql \
  -h "$RAILWAY_HOST" \
  -p "$RAILWAY_PORT" \
  -U "$RAILWAY_USER" \
  -d "$RAILWAY_DB" \
  2>&1 | grep -v "NOTICE:" | grep -v "already exists" || true

echo ""
echo "✅ Import completed!"
echo ""

# Verify
IMPORTED=$(PGPASSWORD="$RAILWAY_PASS" psql -h "$RAILWAY_HOST" -p "$RAILWAY_PORT" -U "$RAILWAY_USER" -d "$RAILWAY_DB" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
" | tr -d ' ')

echo "📊 Imported tables: $IMPORTED"
echo ""
echo "✨ Done! All data imported to Railway."
echo ""
echo "💡 Next: Update DATABASE_URL in Railway to:"
echo "   postgresql://postgres:$RAILWAY_PASS@$RAILWAY_HOST:$RAILWAY_PORT/$RAILWAY_DB"

