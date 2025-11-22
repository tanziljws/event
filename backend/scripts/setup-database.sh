#!/bin/bash

# Event Management System - Database Setup Script

echo "🗄️  Setting up PostgreSQL database for Event Management System..."

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "⚠️  PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
fi

# Create database and user
echo "📊 Creating database and user..."

sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE event_management_db;

-- Create user
CREATE USER event_user WITH PASSWORD 'event_password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE event_management_db TO event_user;

-- Connect to the database and grant schema privileges
\c event_management_db;
GRANT ALL ON SCHEMA public TO event_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO event_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO event_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO event_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO event_user;

\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully!"
    echo ""
    echo "📋 Database Information:"
    echo "   Database: event_management_db"
    echo "   User: event_user"
    echo "   Password: event_password123"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo ""
    echo "🔗 Connection String:"
    echo "   postgresql://event_user:event_password123@localhost:5432/event_management_db"
else
    echo "❌ Failed to create database and user"
    exit 1
fi

# Update .env file with database credentials
echo "📝 Updating .env file with database credentials..."

# Backup original .env if it exists
if [ -f .env ]; then
    cp .env .env.backup
    echo "📋 Backed up original .env to .env.backup"
fi

# Update DATABASE_URL in .env
sed -i 's|DATABASE_URL="postgresql://username:password@localhost:5432/event_management_db"|DATABASE_URL="postgresql://event_user:event_password123@localhost:5432/event_management_db"|g' .env

echo "✅ .env file updated with database credentials"

# Test database connection
echo "🔍 Testing database connection..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Database connection test successful!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Run: npm run dev"
    echo "   2. Or run: ./scripts/start-dev.sh"
    echo "   3. API will be available at: http://localhost:3000"
else
    echo "❌ Database connection test failed"
    echo "   Please check your PostgreSQL installation and try again"
fi
