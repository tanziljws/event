#!/bin/bash

# Event Management System - Development Start Script

echo "🚀 Starting Event Management System in Development Mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from env.example..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Prisma client is generated
if [ ! -d "node_modules/@prisma/client" ]; then
    echo "🔧 Generating Prisma client..."
    npx prisma generate
fi

# Check database connection
echo "🔍 Checking database connection..."
npx prisma db push --accept-data-loss

# Start the development server
echo "🌟 Starting development server..."
npm run dev
