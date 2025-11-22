#!/bin/bash

# Railway Deployment Script
echo "🚀 Starting Railway Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI ready"

# Create Railway project (if not exists)
echo "📦 Creating Railway project..."
railway project create nusa-event-management || echo "Project already exists"

# Deploy database
echo "🗄️ Setting up PostgreSQL database..."
railway add postgresql

# Deploy backend
echo "🚀 Deploying backend..."
cd backend
railway up --service backend

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Railway dashboard to configure environment variables"
echo "2. Run database migrations: railway run npx prisma migrate deploy"
echo "3. Generate Prisma client: railway run npx prisma generate"
echo "4. Update mobile app URLs with Railway domain"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"
