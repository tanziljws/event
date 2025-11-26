# 🛠️ Development Workflow Guide

## 📋 Overview

Workflow untuk development local → test → deploy ke hosting.

## 🎯 Prinsip

1. **Develop di Local** - Semua development dan testing dilakukan di local
2. **Test Thoroughly** - Pastikan semua fitur jalan sebelum deploy
3. **Deploy ke Hosting** - Hanya deploy setelah semua test passed
4. **Jangan Push Development Code** - Development code tetap di local

## 📁 Environment Setup

### Backend

**File: `backend/.env.local`** (untuk development)
```env
# Development Environment
NODE_ENV=development

# Local Database
DATABASE_URL="postgresql://user:password@localhost:5432/nusaevent_local"

# Local Redis (optional)
REDIS_URL="redis://localhost:6379"

# Local URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000/api

# Debug Mode
DEBUG=true
LOG_LEVEL=debug
ENABLE_DEBUG_ROUTES=true

# Payment Gateways (Sandbox/Test Mode)
MIDTRANS_SERVER_KEY=your_sandbox_key
MIDTRANS_CLIENT_KEY=your_sandbox_key
MIDTRANS_IS_PRODUCTION=false

DUITKU_MERCHANT_CODE=your_test_merchant
DUITKU_API_KEY=your_test_key
DUITKU_MODE=sandbox

XENDIT_SECRET_KEY=your_test_key

# Email (Test Mode)
BREVO_API_KEY=your_test_key
EMAIL_FROM=noreply@local.test

# JWT (Development)
JWT_SECRET=local_dev_secret_change_in_production
JWT_REFRESH_SECRET=local_dev_refresh_secret_change_in_production

# CORS (Development - allow all)
CORS_ALLOW_ALL=true
```

**File: `backend/.env`** (untuk production - JANGAN COMMIT!)
```env
# Production Environment (Railway)
NODE_ENV=production
DATABASE_URL=your_railway_db_url
# ... production configs
```

### Frontend

**File: `frontend/.env.local`** (untuk development)
```env
# Development Environment
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG=true
```

**File: `frontend/.env.production.local`** (untuk production - JANGAN COMMIT!)
```env
# Production Environment
NEXT_PUBLIC_API_URL=https://backend-nasa.up.railway.app/api
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_DEBUG=false
```

### Mobile App

**File: `mobileapp/lib/core/config/env_config.dart`** (akan dibuat)
- Auto-detect development vs production
- Switch URL berdasarkan build mode

## 🔧 Development Tools

### 1. Debug Mode

**Backend:**
- Enable debug routes: `ENABLE_DEBUG_ROUTES=true`
- Verbose logging: `LOG_LEVEL=debug`
- Database query logging: `DEBUG_DB=true`

**Frontend:**
- React DevTools
- Next.js debug mode: `NEXT_PUBLIC_DEBUG=true`
- Console logging enabled

### 2. Local Database

```bash
# Start local PostgreSQL
# macOS
brew services start postgresql

# Create local database
createdb nusaevent_local

# Run migrations
cd backend
npx prisma migrate dev

# Seed test data
node create_test_users.js
```

### 3. Development Scripts

**Backend:**
```bash
# Start dengan debug mode
npm run dev:debug

# Start dengan hot reload
npm run dev:watch

# Test API
npm run test:api
```

**Frontend:**
```bash
# Development mode
npm run dev

# Build untuk test
npm run build:test
```

## 🔄 Workflow Steps

### Step 1: Setup Local Environment

```bash
# 1. Copy environment files
cp backend/.env.local.example backend/.env.local
cp frontend/.env.local.example frontend/.env.local

# 2. Setup local database
cd backend
createdb nusaevent_local
npx prisma migrate dev

# 3. Seed test data
node create_test_users.js

# 4. Start services
npm run dev  # Backend
cd ../frontend && npm run dev  # Frontend
```

### Step 2: Develop & Test

1. **Buat fitur baru di local**
2. **Test di local** - Pastikan semua jalan
3. **Debug jika perlu** - Gunakan debug tools
4. **Commit ke local git** (JANGAN PUSH!)

### Step 3: Test Thoroughly

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration
```

### Step 4: Deploy ke Hosting

**Hanya setelah semua test passed:**

1. **Update production configs** (Railway variables)
2. **Build & Deploy**
3. **Test di production**
4. **Monitor logs**

## 🚫 Jangan Lakukan Ini!

❌ **JANGAN commit `.env` files**
❌ **JANGAN push development code langsung**
❌ **JANGAN deploy tanpa test**
❌ **JANGAN push debug code ke production**

## ✅ Best Practices

1. **Gunakan Git Branches**
   ```bash
   git checkout -b feature/new-feature
   # Develop di branch ini
   # Merge ke main setelah test passed
   ```

2. **Environment Variables**
   - `.env.local` untuk development (gitignored)
   - Railway variables untuk production
   - Jangan hardcode credentials

3. **Debug Tools**
   - Gunakan hanya di development
   - Disable di production
   - Jangan log sensitive data

4. **Testing**
   - Test di local dulu
   - Test semua edge cases
   - Test dengan real data (anonymized)

## 📝 Checklist Sebelum Deploy

- [ ] Semua test passed di local
- [ ] Environment variables sudah di-set di Railway
- [ ] Database migrations sudah di-run
- [ ] No debug code di production
- [ ] Logs tidak expose sensitive data
- [ ] CORS sudah di-configure dengan benar
- [ ] Error handling sudah proper
- [ ] Performance sudah acceptable

## 🐛 Debug Commands

```bash
# Backend debug
cd backend
DEBUG=true npm run dev

# Frontend debug
cd frontend
NEXT_PUBLIC_DEBUG=true npm run dev

# Database debug
cd backend
DEBUG_DB=true npm run dev

# Check logs
tail -f backend/logs/combined.log
```

## 📚 Additional Resources

- Backend API Docs: `backend/ADMIN_API_DOCUMENTATION.md`
- Frontend Setup: `frontend/README.md`
- Mobile App Build: `mobileapp/BUILD_INSTRUCTIONS.md`

