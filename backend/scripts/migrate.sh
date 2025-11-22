#!/bin/bash

# Event Management System - Database Migration Script

echo "🗄️  Running Database Migrations..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your database configuration before running again."
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate dev --name init

# Push schema to database (for development)
echo "🚀 Pushing schema to database..."
npx prisma db push

echo "✅ Database migration completed!"
