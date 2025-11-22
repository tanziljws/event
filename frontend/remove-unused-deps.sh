#!/bin/bash

echo "🧹 Removing unused dependencies..."

# Remove unused dependencies
echo "Removing react-signature-canvas..."
npm uninstall react-signature-canvas

echo "Removing react-qr-scanner..."
npm uninstall react-qr-scanner

echo "Removing simple-icons..."
npm uninstall simple-icons

echo "Removing sonner..."
npm uninstall sonner

echo ""
echo "⚠️  Prisma CLI - Evaluating..."
echo "Prisma CLI is usually only needed in backend for migrations."
echo "If you don't need migrations in frontend, you can remove it:"
echo "  npm uninstall prisma"
echo ""
echo "If you still need it for migrations, move to devDependencies:"
echo "  npm uninstall prisma"
echo "  npm install --save-dev prisma"
echo ""

echo "✅ Unused dependencies removed!"
echo "📦 Run 'npm install' to update lock file"
echo "🧪 Test with: npm run dev"

