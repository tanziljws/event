#!/bin/bash

# Development Setup Script
# Setup local development environment

set -e

echo "🛠️  Setting up local development environment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f "backend/.env.local" ]; then
    echo "${YELLOW}⚠️  backend/.env.local not found${NC}"
    echo "📝 Creating from .env.local.example..."
    cp backend/.env.local.example backend/.env.local
    echo "${GREEN}✅ Created backend/.env.local${NC}"
    echo "${YELLOW}⚠️  Please edit backend/.env.local and fill in your values${NC}"
else
    echo "${GREEN}✅ backend/.env.local already exists${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "${YELLOW}⚠️  frontend/.env.local not found${NC}"
    echo "📝 Creating from .env.local.example..."
    cp frontend/.env.local.example frontend/.env.local
    echo "${GREEN}✅ Created frontend/.env.local${NC}"
    echo "${YELLOW}⚠️  Please edit frontend/.env.local and fill in your values${NC}"
else
    echo "${GREEN}✅ frontend/.env.local already exists${NC}"
fi

echo ""
echo "📦 Installing dependencies..."

# Backend
if [ -d "backend" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "${GREEN}✅ Backend dependencies installed${NC}"
fi

# Frontend
if [ -d "frontend" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "${GREEN}✅ Frontend dependencies installed${NC}"
fi

echo ""
echo "${GREEN}✅ Development environment setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Edit backend/.env.local and fill in your database credentials"
echo "  2. Edit frontend/.env.local if needed"
echo "  3. Setup local database:"
echo "     createdb nusaevent_local"
echo "     cd backend && npx prisma migrate dev"
echo "  4. Start development servers:"
echo "     cd backend && npm run dev"
echo "     cd frontend && npm run dev"

