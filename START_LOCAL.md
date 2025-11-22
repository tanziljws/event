# 🚀 Start Local Development

## ✅ Configuration Sudah Selesai

### Frontend
- ✅ `.env.local` sudah dibuat dengan `NEXT_PUBLIC_API_URL=http://localhost:5001/api`
- ✅ `next.config.js` sudah diupdate untuk menggunakan localhost sebagai default
- ✅ `api.ts` sudah diupdate untuk menggunakan localhost sebagai default

### Backend
- ✅ CORS sudah di-configure untuk allow all origins di development mode
- ✅ Port: `5001` (configured in `.env`)
- ✅ Database: Connected ✅

## 🎯 Cara Start

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

Backend akan berjalan di: **http://localhost:5001**

**Tunggu sampai muncul:**
```
✅ Server running on port 5001
✅ Environment: development
✅ Accessible via: http://localhost:5001
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di: **http://localhost:3000**

**Tunggu sampai muncul:**
```
▲ Next.js 14.2.18
- Local:        http://localhost:3000
```

## 🔑 Login

1. Buka browser: **http://localhost:3000/login**
2. Masukkan credentials:
   - **Email**: `admin@nusaevent.com`
   - **Password**: `admin123`
3. Klik "Login"

## ✅ Test Backend

Test apakah backend berjalan dengan benar:

```bash
# Test login endpoint
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nusaevent.com","password":"admin123"}'
```

Jika berhasil, akan return:
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {...}
  }
}
```

## 🔧 Troubleshooting

### Backend tidak bisa start

1. **Check port 5001**:
   ```bash
   lsof -ti:5001
   # Jika ada process, kill it:
   kill -9 $(lsof -ti:5001)
   ```

2. **Check database**:
   ```bash
   cd backend
   node -e "require('dotenv').config(); const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('OK')).catch(e => console.error('Error:', e.message));"
   ```

3. **Check logs**:
   ```bash
   cd backend
   npm run dev
   # Lihat error messages
   ```

### Frontend tidak bisa connect

1. **Pastikan backend berjalan**:
   ```bash
   curl http://localhost:5001/api/auth/login
   # Should not return 404
   ```

2. **Check .env.local**:
   ```bash
   cd frontend
   cat .env.local
   # Should show: NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

3. **Restart frontend**:
   ```bash
   # Stop frontend (Ctrl+C)
   # Start again
   npm run dev
   ```

### Login error 404

- **Backend tidak berjalan**: Start backend dengan `npm run dev` di folder backend
- **Wrong port**: Pastikan backend berjalan di port 5001
- **Wrong API URL**: Pastikan `.env.local` menggunakan `http://localhost:5001/api`

### Login error 401

- **Wrong credentials**: Gunakan `admin@nusaevent.com` / `admin123`
- **User tidak ada**: Create admin dengan `cd backend && npm run create-admin`
- **Password salah**: Reset password atau create user baru

### CORS error

- CORS sudah di-configure untuk allow all origins di development mode
- Jika masih error, check browser console untuk detail
- Pastikan backend berjalan dengan `NODE_ENV=development`

## 📝 Notes

- **Development mode**: Semua koneksi menggunakan localhost
- **Hot reload**: Backend dan frontend auto-reload saat file berubah
- **Database**: PostgreSQL harus berjalan dan accessible
- **Ports**: 
  - Backend: `5001`
  - Frontend: `3000`
  - Database: `5432` (default PostgreSQL)

## 🎯 Next: Switch to Railway

Setelah local development berjalan dengan baik:

1. Test semua fitur di localhost
2. Fix semua bugs
3. Deploy backend ke Railway
4. Update `NEXT_PUBLIC_API_URL` di frontend untuk menggunakan Railway URL
5. Update CORS di backend untuk allow Railway frontend URL
6. Deploy frontend

## 🔄 Switch ke Railway

### Backend
1. Deploy backend ke Railway
2. Update CORS di `backend/src/middlewares/security.js` untuk allow Railway frontend URL
3. Update environment variables di Railway

### Frontend
1. Update `.env.local` atau environment variables:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   ```
2. Rebuild frontend:
   ```bash
   npm run build
   npm start
   ```

