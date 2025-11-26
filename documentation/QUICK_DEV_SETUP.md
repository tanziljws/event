# 🚀 Quick Development Setup

## Setup Cepat (5 Menit)

### 1. Buat Environment Files

**Backend:**
```bash
cd backend
cat > .env.local << 'EOF'
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/nusaevent_local"
REDIS_URL="redis://localhost:6379"
PORT=5000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000/api
DEBUG=true
LOG_LEVEL=debug
ENABLE_DEBUG_ROUTES=true
JWT_SECRET=local_dev_secret_change_in_production_min_32_chars
JWT_REFRESH_SECRET=local_dev_refresh_secret_change_in_production_min_32_chars
EOF
```

**Frontend:**
```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_DEBUG=true
EOF
```

### 2. Setup Database

```bash
# Create database
createdb nusaevent_local

# Run migrations
cd backend
npx prisma migrate dev

# Create test user
node create_organizer_test.js
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev:debug
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Test Debug Routes

```bash
# Environment info
curl http://localhost:5000/api/debug/info

# Database status
curl http://localhost:5000/api/debug/db/status

# User count
curl http://localhost:5000/api/debug/users/count
```

## 🔄 Workflow

1. **Develop** → Buat fitur di local
2. **Test** → Test di local dengan debug tools
3. **Verify** → Pastikan semua jalan
4. **Deploy** → Deploy ke Railway (hanya setelah test passed)

## ⚠️ Important

- ✅ `.env.local` files are gitignored
- ✅ Debug routes hanya aktif di development
- ❌ JANGAN push `.env` files
- ❌ JANGAN push debug code ke production

## 📚 Full Documentation

Lihat `DEVELOPMENT_WORKFLOW.md` untuk dokumentasi lengkap.

