#!/bin/bash

echo "🧹 Clearing Next.js cache..."

# Kill any running Next.js processes
echo "Killing existing Next.js processes..."
pkill -f "next dev" 2>/dev/null || true

# Remove Next.js build cache
echo "Removing .next directory..."
rm -rf .next

# Remove Turbopack cache
echo "Removing .turbo directory..."
rm -rf .turbo

# Remove node_modules cache
echo "Removing node_modules cache..."
rm -rf node_modules/.cache

# Remove TypeScript cache
echo "Removing TypeScript cache..."
rm -rf .tsbuildinfo

# Remove webpack cache
echo "Removing webpack cache..."
rm -rf .next/cache/webpack 2>/dev/null || true

echo ""
echo "✅ Cache cleared successfully!"
echo "🚀 Now run: npm run dev:fast"

