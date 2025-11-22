# Railway Setup Guide

## Backend Configuration

### 1. Environment Variables di Railway Dashboard

Tambahkan environment variables berikut di Railway Dashboard untuk backend service:

```bash
# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:AQBAWVQXZFxwgssCksLcOlKicSvAxniO@nozomi.proxy.rlwy.net:55832/railway

# Server
NODE_ENV=production
PORT=5000

# API Base URL
API_BASE_URL=https://web-production-38c7.up.railway.app/api
FRONTEND_URL=https://web-production-38c7.up.railway.app

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email (gunakan service seperti SendGrid)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Event Management System <noreply@eventmanagement.com>

# Session
SESSION_SECRET=your-session-secret-key

# File Upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OTP
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6

# Session
SESSION_TIMEOUT_MINUTES=5

# Sentry (optional)
SENTRY_DSN=
SENTRY_RELEASE=1.0.0
```

## Frontend Configuration

### 1. Environment Variables di Railway Dashboard

Tambahkan environment variables berikut di Railway Dashboard untuk frontend service:

```bash
NEXT_PUBLIC_API_URL=https://web-production-38c7.up.railway.app/api
NODE_ENV=production
```

### 2. Update next.config.js

File `next.config.js` sudah dikonfigurasi untuk menggunakan `NEXT_PUBLIC_API_URL` dari environment variable.

## CORS Configuration

Backend sudah dikonfigurasi untuk:
- Mengizinkan origin dari Railway: `https://web-production-38c7.up.railway.app`
- Mengizinkan request tanpa origin (mobile apps)
- Menggunakan environment variable `FRONTEND_URL` jika tersedia

## File Uploads

File uploads akan disimpan di:
- Local: `backend/uploads/`
- Railway: `backend/uploads/` (persistent storage)

Untuk mengakses file di Railway:
- URL: `https://web-production-38c7.up.railway.app/uploads/...`

## Mobile App

Mobile app tetap menggunakan localhost untuk development:
- Base URL: `http://10.0.2.2:5002/api` (untuk Android emulator)
- Untuk production, update ke Railway URL di `api_constants.dart`

## Deployment Steps

### 1. Backend Service

1. **Di Railway Dashboard:**
   - Buat service baru atau gunakan service yang sudah ada
   - Connect ke GitHub repository
   - Set **Root Directory** ke `backend`
   - Set **Start Command** ke `npm start`
   - Set **Build Command** ke `npm run build` (akan run `npx prisma migrate deploy`)

2. **Set Environment Variables:**
   - Copy semua environment variables dari section "Backend Configuration" di atas
   - Paste ke Railway Dashboard > Variables tab

3. **Deploy:**
   - Railway akan otomatis deploy saat push ke GitHub
   - Atau klik "Deploy" manual di Railway Dashboard

### 2. Frontend Service

1. **Di Railway Dashboard:**
   - Buat service baru atau gunakan service yang sudah ada
   - Connect ke GitHub repository
   - Set **Root Directory** ke `frontend`
   - Set **Start Command** ke `npm start`
   - Set **Build Command** ke `npm run build`

2. **Set Environment Variables:**
   - Copy semua environment variables dari section "Frontend Configuration" di atas
   - Paste ke Railway Dashboard > Variables tab

3. **Deploy:**
   - Railway akan otomatis deploy saat push ke GitHub
   - Atau klik "Deploy" manual di Railway Dashboard

### 3. Database

1. **Railway PostgreSQL:**
   - Database sudah tersedia di Railway
   - Connection string: `postgresql://postgres:AQBAWVQXZFxwgssCksLcOlKicSvAxniO@nozomi.proxy.rlwy.net:55832/railway`
   - Migrations akan otomatis run saat backend deploy (via `npm run build`)

### 4. Verify Deployment

1. **Test Backend API:**
   ```bash
   curl https://web-production-38c7.up.railway.app/api/health
   ```

2. **Test Frontend:**
   - Buka: `https://web-production-38c7.up.railway.app`
   - Pastikan bisa load dan API calls berfungsi

3. **Test Database:**
   - Login ke aplikasi
   - Pastikan data bisa di-load dari database

## Important Notes

⚠️ **PENTING:**
- Pastikan semua environment variables sudah di-set di Railway Dashboard
- Database URL harus sesuai dengan Railway PostgreSQL
- CORS sudah dikonfigurasi untuk Railway URL
- File uploads akan disimpan di `backend/uploads/` (pastikan persistent storage di Railway)

## Troubleshooting

1. **Backend tidak start:**
   - Cek environment variables di Railway Dashboard
   - Cek logs di Railway Dashboard > Deployments > View Logs
   - Pastikan `DATABASE_URL` benar

2. **Frontend tidak load:**
   - Cek `NEXT_PUBLIC_API_URL` di environment variables
   - Cek browser console untuk error
   - Pastikan backend sudah running

3. **CORS Error:**
   - Pastikan `FRONTEND_URL` di-set di backend environment variables
   - Cek CORS configuration di `backend/src/middlewares/security.js`

4. **Database Connection Error:**
   - Pastikan `DATABASE_URL` benar
   - Cek apakah database service aktif di Railway
   - Run migrations manual jika perlu: `npx prisma migrate deploy`

