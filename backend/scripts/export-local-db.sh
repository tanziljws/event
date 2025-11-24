#!/bin/bash

# Export script untuk local database ke Railway PostgreSQL
# Usage: ./export-local-db.sh

set -e

echo "🚀 Starting database export from local to Railway..."

# Local DB connection (adjust if needed)
LOCAL_DB_URL="${LOCAL_DB_URL:-postgresql://postgres:postgres@localhost:5432/event_management}"

# Railway DB connection
RAILWAY_DB_URL="postgresql://postgres:fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq@hopper.proxy.rlwy.net:22183/railway"

# Extract connection details
LOCAL_HOST=$(echo $LOCAL_DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
LOCAL_PORT=$(echo $LOCAL_DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
LOCAL_DB=$(echo $LOCAL_DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
LOCAL_USER=$(echo $LOCAL_DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
LOCAL_PASS=$(echo $LOCAL_DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

RAILWAY_HOST="hopper.proxy.rlwy.net"
RAILWAY_PORT="22183"
RAILWAY_DB="railway"
RAILWAY_USER="postgres"
RAILWAY_PASS="fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq"

echo "📦 Exporting schema and data from local database..."
echo "   Local: $LOCAL_DB"
echo "   Railway: $RAILWAY_DB"

# Create backup directory
BACKUP_DIR="./db-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Export schema
echo "📋 Exporting schema..."
PGPASSWORD="$LOCAL_PASS" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --schema-only \
  --no-owner \
  --no-privileges \
  > "$BACKUP_DIR/schema.sql"

# Export data
echo "💾 Exporting data..."
PGPASSWORD="$LOCAL_PASS" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  > "$BACKUP_DIR/data.sql"

# Export full dump (backup)
echo "💿 Creating full backup..."
PGPASSWORD="$LOCAL_PASS" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --no-owner \
  --no-privileges \
  > "$BACKUP_DIR/full-backup.sql"

echo "✅ Export completed!"
echo "📁 Backup files saved to: $BACKUP_DIR"
echo ""
echo "🔄 Now importing to Railway..."

# Import to Railway
echo "📋 Importing schema to Railway..."
PGPASSWORD="$RAILWAY_PASS" psql \
  -h "$RAILWAY_HOST" \
  -p "$RAILWAY_PORT" \
  -U "$RAILWAY_USER" \
  -d "$RAILWAY_DB" \
  -f "$BACKUP_DIR/schema.sql" \
  2>&1 | tee "$BACKUP_DIR/import-schema.log"

echo "💾 Importing data to Railway..."
PGPASSWORD="$RAILWAY_PASS" psql \
  -h "$RAILWAY_HOST" \
  -p "$RAILWAY_PORT" \
  -U "$RAILWAY_USER" \
  -d "$RAILWAY_DB" \
  -f "$BACKUP_DIR/data.sql" \
  2>&1 | tee "$BACKUP_DIR/import-data.log"

echo ""
echo "✅ Import completed!"
echo "📊 Check logs in $BACKUP_DIR for details"
echo ""
echo "🔍 Verifying import..."
PGPASSWORD="$RAILWAY_PASS" psql \
  -h "$RAILWAY_HOST" \
  -p "$RAILWAY_PORT" \
  -U "$RAILWAY_USER" \
  -d "$RAILWAY_DB" \
  -c "\dt" \
  2>&1 | head -20

echo ""
echo "✨ Done! Database imported to Railway."

