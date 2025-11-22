#!/bin/bash

# Database Backup Script
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nusa_db_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

echo "🔄 Starting database backup..."

PGPASSWORD=nusa372747 pg_dump -h localhost -U nusa -d nusa_db > $BACKUP_DIR/$BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completed: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_DIR/$BACKUP_FILE
    echo "📦 Backup compressed: $BACKUP_FILE.gz"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
    echo "🧹 Old backups cleaned up"
else
    echo "❌ Backup failed!"
    exit 1
fi
