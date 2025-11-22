#!/bin/bash

# Event Management System - Test Script

echo "🧪 Running Event Management System Tests..."

# Check if .env.test file exists
if [ ! -f .env.test ]; then
    echo "⚠️  .env.test file not found. Creating from env.example..."
    cp env.example .env.test
    echo "📝 Please edit .env.test file with your test configuration."
fi

# Set test environment
export NODE_ENV=test

# Run tests
echo "🔍 Running unit tests..."
npm run test

# Run tests with coverage
echo "📊 Running tests with coverage..."
npm run test:coverage

echo "✅ Tests completed!"
