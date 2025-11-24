#!/bin/bash

# Import semua table dari local DB ke Railway PostgreSQL
# Usage: ./import-all-tables.sh

set -e

echo "🚀 Importing all tables from local DB to Railway..."
echo ""

# Railway DB connection
RAILWAY_HOST="hopper.proxy.rlwy.net"
RAILWAY_PORT="22183"
RAILWAY_DB="railway"
RAILWAY_USER="postgres"
RAILWAY_PASS="fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq"

# Local DB connection - adjust these if needed
LOCAL_DB="${LOCAL_DB:-event_management}"
LOCAL_USER="${LOCAL_USER:-postgres}"
LOCAL_HOST="${LOCAL_HOST:-localhost}"
LOCAL_PORT="${LOCAL_PORT:-5432}"
LOCAL_PASS="${LOCAL_PASSWORD:-postgres}"

echo "📦 Source: Local DB ($LOCAL_DB @ $LOCAL_HOST:$LOCAL_PORT)"
echo "🔄 Target: Railway DB ($RAILWAY_DB @ $RAILWAY_HOST:$RAILWAY_PORT)"
echo ""

# Test local connection
echo "🔍 Testing local DB connection..."
if ! PGPASSWORD="$LOCAL_PASS" psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -c "\q" 2>/dev/null; then
  echo "❌ Cannot connect to local DB!"
  echo "   Please check:"
  echo "   - Is PostgreSQL running?"
  echo "   - Is DB name correct? (current: $LOCAL_DB)"
  echo "   - Are credentials correct?"
  exit 1
fi
echo "✅ Local DB connection OK"
echo ""

# Test Railway connection
echo "🔍 Testing Railway DB connection..."
if ! PGPASSWORD="$RAILWAY_PASS" psql -h "$RAILWAY_HOST" -p "$RAILWAY_PORT" -U "$RAILWAY_USER" -d "$RAILWAY_DB" -c "\q" 2>/dev/null; then
  echo "❌ Cannot connect to Railway DB!"
  echo "   Please check Railway credentials"
  exit 1
fi
echo "✅ Railway DB connection OK"
echo ""

# Get list of tables from local DB
echo "📋 Getting list of tables from local DB..."
TABLES=$(PGPASSWORD="$LOCAL_PASS" psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -t -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  ORDER BY table_name;
")

if [ -z "$TABLES" ]; then
  echo "❌ No tables found in local DB!"
  exit 1
fi

TABLE_COUNT=$(echo "$TABLES" | grep -v '^$' | wc -l | tr -d ' ')
echo "✅ Found $TABLE_COUNT tables"
echo ""

# Ask for confirmation
read -p "⚠️  This will import all data to Railway. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cancelled"
  exit 1
fi

# Export and import
echo ""
echo "🔄 Starting export -> import process..."
echo "   This may take a while depending on data size..."
echo ""

# Method 1: Full dump (recommended for complete migration)
echo "📦 Method: Full database dump (schema + data)"
echo ""

# Create temp file for dump
DUMP_FILE="/tmp/event_db_dump_$(date +%s).sql"

# Export from local
echo "📤 Exporting from local DB..."
PGPASSWORD="$LOCAL_PASS" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --verbose \
  > "$DUMP_FILE" 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Export failed!"
  rm -f "$DUMP_FILE"
  exit 1
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo "✅ Export completed! Size: $DUMP_SIZE"
echo ""

# Import to Railway
echo "📥 Importing to Railway DB..."
PGPASSWORD="$RAILWAY_PASS" psql \
  -h "$RAILWAY_HOST" \
  -p "$RAILWAY_PORT" \
  -U "$RAILWAY_USER" \
  -d "$RAILWAY_DB" \
  -f "$DUMP_FILE" \
  2>&1 | grep -v "NOTICE:" | grep -v "already exists" || true

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo "✅ Import completed!"
else
  echo "⚠️  Import completed with some warnings (check output above)"
fi

# Cleanup
rm -f "$DUMP_FILE"

echo ""
echo "🔍 Verifying import..."
IMPORTED_TABLES=$(PGPASSWORD="$RAILWAY_PASS" psql -h "$RAILWAY_HOST" -p "$RAILWAY_PORT" -U "$RAILWAY_USER" -d "$RAILWAY_DB" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
" | tr -d ' ')

echo "✅ Imported tables: $IMPORTED_TABLES"
echo ""

# Show sample of tables
echo "📊 Sample of imported tables:"
PGPASSWORD="$RAILWAY_PASS" psql \
  -h "$RAILWAY_HOST" \
  -p "$RAILWAY_PORT" \
  -U "$RAILWAY_USER" \
  -d "$RAILWAY_DB" \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name LIMIT 10;" \
  2>&1 | grep -v "NOTICE:" | head -15

echo ""
echo "✨ Done! Database imported to Railway."
echo ""
echo "💡 Next steps:"
echo "   1. Update DATABASE_URL in Railway environment variables"
echo "   2. Run Prisma migrations if needed: npx prisma migrate deploy"
echo "   3. Verify data: psql -h $RAILWAY_HOST -p $RAILWAY_PORT -U $RAILWAY_USER -d $RAILWAY_DB"

