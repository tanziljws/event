# 🚀 Quick Start - Local Development

## 1. Start Backend

```bash
cd backend
npm install  # Jika belum install dependencies
npm run dev
```

Backend akan berjalan di: **http://localhost:5001**

## 2. Start Frontend

```bash
cd frontend
npm install  # Jika belum install dependencies
npm run dev
```

Frontend akan berjalan di: **http://localhost:3000**

## 3. Login

1. Buka browser: **http://localhost:3000/login**
2. Masukkan credentials:
   - **Email**: `admin@nusaevent.com`
   - **Password**: `admin123`
3. Klik "Login"

## ✅ Configuration

### Backend
- **Port**: `5001` (configured in `.env`)
- **Database**: PostgreSQL (configured in `.env`)
- **API URL**: `http://localhost:5001/api`

### Frontend
- **Port**: `3000` (Next.js default)
- **API URL**: `http://localhost:5001/api` (configured in `.env.local`)

## 🔧 Troubleshooting

### Backend tidak bisa start
```bash
# Check port 5001
lsof -ti:5001

# Kill process jika ada
kill -9 $(lsof -ti:5001)

# Start lagi
cd backend
npm run dev
```

### Frontend tidak bisa connect
```bash
# Pastikan .env.local ada
cd frontend
cat .env.local
# Should show: NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Restart frontend
npm run dev
```

### Login error 404
- Pastikan backend berjalan di port 5001
- Check browser console untuk error details
- Test backend langsung: `curl http://localhost:5001/api/auth/login`

### Login error 401
- Pastikan credentials benar: `admin@nusaevent.com` / `admin123`
- Create admin baru: `cd backend && npm run create-admin`

## 📝 Notes

- Semua koneksi menggunakan **localhost** untuk development
- CORS sudah di-configure untuk allow localhost
- Hot reload aktif untuk backend dan frontend
- Database harus berjalan dan accessible

## 🎯 Next: Deploy ke Railway

Setelah local development berjalan dengan baik:
1. Test semua fitur
2. Fix semua bugs
3. Deploy backend ke Railway
4. Update `NEXT_PUBLIC_API_URL` di frontend untuk menggunakan Railway URL
5. Deploy frontend

