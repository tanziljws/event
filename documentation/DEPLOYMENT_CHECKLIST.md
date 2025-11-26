# Deployment Checklist untuk Railway

## ✅ Yang Sudah Dikonfigurasi

1. **Backend Configuration:**
   - ✅ `backend/env.example` - Database URL dan API base URL sudah diupdate ke Railway
   - ✅ `backend/src/middlewares/security.js` - CORS dan CSP sudah dikonfigurasi untuk Railway
   - ✅ Security headers sudah include Railway URL

2. **Frontend Configuration:**
   - ✅ `frontend/next.config.js` - Sudah menggunakan `NEXT_PUBLIC_API_URL` dari environment variable
   - ✅ Semua file frontend sudah menggunakan environment variable untuk API URL

3. **Dokumentasi:**
   - ✅ `RAILWAY_SETUP.md` - Panduan lengkap setup Railway

## 📋 Langkah Selanjutnya

### 1. Update File .env Lokal (Opsional - untuk testing)

**Backend (`backend/.env`):**
```bash
DATABASE_URL="postgresql://postgres:AQBAWVQXZFxwgssCksLcOlKicSvAxniO@nozomi.proxy.rlwy.net:55832/railway"
NODE_ENV="production"
API_BASE_URL="https://web-production-38c7.up.railway.app/api"
FRONTEND_URL="https://web-production-38c7.up.railway.app"
```

**Frontend (`frontend/.env.local`):**
```bash
NEXT_PUBLIC_API_URL=https://web-production-38c7.up.railway.app/api
NODE_ENV=production
```

### 2. Commit dan Push Perubahan

```bash
# Add semua perubahan
git add .

# Commit dengan message
git commit -m "feat: configure Railway deployment settings"

# Push ke branch saat ini
git push origin feat/frontend-image-fixes

# Atau merge ke main dulu (jika perlu)
git checkout main
git merge feat/frontend-image-fixes
git push origin main
```

### 3. Set Environment Variables di Railway Dashboard

#### Backend Service:
1. Buka Railway Dashboard > Backend Service > Variables
2. Tambahkan semua environment variables dari `RAILWAY_SETUP.md` section "Backend Configuration"
3. Pastikan:
   - `DATABASE_URL` = `postgresql://postgres:AQBAWVQXZFxwgssCksLcOlKicSvAxniO@nozomi.proxy.rlwy.net:55832/railway`
   - `API_BASE_URL` = `https://web-production-38c7.up.railway.app/api`
   - `FRONTEND_URL` = `https://web-production-38c7.up.railway.app`
   - `NODE_ENV` = `production`

#### Frontend Service:
1. Buka Railway Dashboard > Frontend Service > Variables
2. Tambahkan:
   - `NEXT_PUBLIC_API_URL` = `https://web-production-38c7.up.railway.app/api`
   - `NODE_ENV` = `production`

### 4. Konfigurasi Service di Railway

#### Backend Service:
- **Root Directory:** `backend`
- **Start Command:** `npm start`
- **Build Command:** `npm run build` (akan run `npx prisma migrate deploy`)

#### Frontend Service:
- **Root Directory:** `frontend`
- **Start Command:** `npm start`
- **Build Command:** `npm run build`

### 5. Deploy

1. **Automatic Deploy:**
   - Railway akan otomatis deploy saat push ke GitHub
   - Cek status di Railway Dashboard > Deployments

2. **Manual Deploy:**
   - Klik "Deploy" di Railway Dashboard
   - Atau trigger deploy via Railway CLI

### 6. Verifikasi Deployment

1. **Test Backend API:**
   ```bash
   curl https://web-production-38c7.up.railway.app/api/health
   ```

2. **Test Frontend:**
   - Buka: `https://web-production-38c7.up.railway.app`
   - Pastikan bisa load dan tidak ada error di console

3. **Test Database:**
   - Login ke aplikasi
   - Pastikan data bisa di-load dari database

4. **Test File Upload:**
   - Upload gambar di aplikasi
   - Pastikan file bisa diakses via URL

## 🔍 Troubleshooting

### Backend tidak start:
- Cek logs di Railway Dashboard > Deployments > View Logs
- Pastikan semua environment variables sudah di-set
- Pastikan `DATABASE_URL` benar

### Frontend tidak load:
- Cek `NEXT_PUBLIC_API_URL` di environment variables
- Cek browser console untuk error
- Pastikan backend sudah running

### CORS Error:
- Pastikan `FRONTEND_URL` di-set di backend environment variables
- Cek CORS configuration di `backend/src/middlewares/security.js`

### Database Connection Error:
- Pastikan `DATABASE_URL` benar
- Cek apakah database service aktif di Railway
- Run migrations manual jika perlu: `npx prisma migrate deploy`

## 📝 Catatan Penting

⚠️ **PENTING:**
- File `.env` lokal TIDAK akan digunakan di Railway
- Semua konfigurasi harus di-set di Railway Dashboard > Variables
- Database migrations akan otomatis run saat backend deploy (via `npm run build`)
- Pastikan persistent storage di Railway untuk file uploads (`backend/uploads/`)

