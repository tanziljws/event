# Local Development Setup Guide

## 📋 Prerequisites

1. **Node.js** (v20.0.0 or higher)
2. **PostgreSQL** database running locally or accessible
3. **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
# Make sure .env file has:
#   PORT=5001
#   NODE_ENV=development
#   DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Start backend server
npm run dev
# or
./scripts/start-local.sh
```

Backend akan berjalan di: `http://localhost:5001`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
# File .env.local sudah dibuat dengan:
#   NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Start frontend server
npm run dev
```

Frontend akan berjalan di: `http://localhost:3000`

### 3. Create Admin User

```bash
cd backend

# Create default admin
npm run create-admin

# atau dengan custom credentials
npm run create-admin admin@example.com password123 "Admin Name" SUPER_ADMIN
```

Default admin credentials:
- **Email**: `admin@nusaevent.com`
- **Password**: `admin123`

## 🔑 Login

1. Buka browser: `http://localhost:3000/login`
2. Masukkan credentials admin:
   - Email: `admin@nusaevent.com`
   - Password: `admin123`
3. Klik "Login"

## ⚙️ Configuration

### Backend (.env)

```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## 🔧 Troubleshooting

### Backend tidak bisa start

1. **Check database connection**:
   ```bash
   cd backend
   node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('OK')).catch(e => console.error('Error:', e.message));"
   ```

2. **Check port availability**:
   ```bash
   lsof -ti:5001
   # If process found, kill it:
   kill -9 $(lsof -ti:5001)
   ```

3. **Check logs**:
   ```bash
   npm run dev
   # Look for error messages
   ```

### Frontend tidak bisa connect ke backend

1. **Check API URL**:
   ```bash
   cd frontend
   cat .env.local
   # Should show: NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

2. **Check backend is running**:
   ```bash
   curl http://localhost:5001/api/auth/login
   # Should not return 404
   ```

3. **Check CORS**:
   - Backend CORS sudah di-configure untuk allow localhost:3000
   - Jika masih error, check browser console untuk CORS error

### Login error 404

1. **Backend tidak berjalan**: Start backend dengan `npm run dev` di folder backend
2. **Wrong API URL**: Pastikan `.env.local` di frontend menggunakan `http://localhost:5001/api`
3. **Port conflict**: Pastikan port 5001 tidak digunakan oleh aplikasi lain

### Login error 401

1. **Wrong credentials**: Gunakan email dan password yang benar
2. **User tidak ada**: Create admin user dengan `npm run create-admin`
3. **Password salah**: Reset password atau create user baru

## 📝 Notes

- **Development mode**: CORS sudah di-configure untuk allow all origins di development
- **Hot reload**: Backend menggunakan `nodemon` untuk auto-reload
- **Database**: Pastikan database PostgreSQL berjalan dan accessible
- **Ports**: 
  - Backend: `5001`
  - Frontend: `3000`
  - Database: `5432` (default PostgreSQL)

## 🎯 Next Steps

Setelah local development berjalan dengan baik:

1. Test semua fitur di localhost
2. Fix semua bugs
3. Test dengan multiple users
4. Deploy ke Railway:
   - Update `NEXT_PUBLIC_API_URL` di frontend untuk menggunakan Railway URL
   - Deploy backend ke Railway
   - Update CORS di backend untuk allow Railway frontend URL

