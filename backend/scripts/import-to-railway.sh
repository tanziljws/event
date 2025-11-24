#!/bin/bash

# Quick import script - langsung import dari local ke Railway
# Usage: ./import-to-railway.sh

set -e

echo "🚀 Importing database from local to Railway..."

# Local DB (adjust these if needed)
LOCAL_DB="${LOCAL_DB:-event_management}"
LOCAL_USER="${LOCAL_USER:-postgres}"
LOCAL_HOST="${LOCAL_HOST:-localhost}"
LOCAL_PORT="${LOCAL_PORT:-5432}"

# Railway DB
RAILWAY_HOST="hopper.proxy.rlwy.net"
RAILWAY_PORT="22183"
RAILWAY_DB="railway"
RAILWAY_USER="postgres"
RAILWAY_PASS="fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq"

echo "📦 Exporting from local: $LOCAL_DB"
echo "🔄 Importing to Railway: $RAILWAY_DB"

# Export and pipe directly to Railway
echo "🔄 Streaming export -> import..."

PGPASSWORD="${LOCAL_PASSWORD:-postgres}" pg_dump \
  -h "$LOCAL_HOST" \
  -p "$LOCAL_PORT" \
  -U "$LOCAL_USER" \
  -d "$LOCAL_DB" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | PGPASSWORD="$RAILWAY_PASS" psql \
    -h "$RAILWAY_HOST" \
    -p "$RAILWAY_PORT" \
    -U "$RAILWAY_USER" \
    -d "$RAILWAY_DB"

echo ""
echo "✅ Import completed!"
echo "🔍 Verifying tables..."

PGPASSWORD="$RAILWAY_PASS" psql \
  -h "$RAILWAY_HOST" \
  -p "$RAILWAY_PORT" \
  -U "$RAILWAY_USER" \
  -d "$RAILWAY_DB" \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" \
  2>&1

echo ""
echo "✨ Done!"

