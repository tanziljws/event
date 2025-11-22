#!/bin/bash

# Script to remove unused dependencies
# IMPORTANT: Review UNUSED_DEPENDENCIES.md before running this script

echo "🗑️  Removing unused dependencies..."
echo ""

# Dependencies to remove
dependencies=(
  "bull"
  "canvas"
  "html2canvas"
  "jspdf"
  "socket.io"
  "swiper"
  "swagger-jsdoc"
  "swagger-ui-express"
  "xlsx"
  "pdf-poppler"
  "moment"
  "@types/nodemailer"
)

# DevDependencies to remove
devDependencies=(
  "autoprefixer"
  "postcss"
  "tailwindcss"
)

echo "📦 Removing dependencies..."
npm uninstall "${dependencies[@]}"

echo ""
echo "📦 Removing devDependencies..."
npm uninstall -D "${devDependencies[@]}"

echo ""
echo "✅ Done! Dependencies removed."
echo ""
echo "📊 Next steps:"
echo "1. Run 'npm install' to update package-lock.json"
echo "2. Run 'npm start' to test the application"
echo "3. Test all features (certificate generation, PDF export, Excel export, WebSocket)"
echo ""
echo "⚠️  If you encounter any errors, check if any service needs these dependencies"

