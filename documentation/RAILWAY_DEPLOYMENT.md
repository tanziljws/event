# Railway Deployment Guide

## Setup Railway

### 1. Buat Akun Railway
1. Pergi ke [railway.app](https://railway.app)
2. Sign up dengan GitHub account
3. Verifikasi email

### 2. Deploy Database PostgreSQL
1. Di Railway dashboard, klik "New Project"
2. Pilih "Database" → "PostgreSQL"
3. Tunggu hingga database selesai dibuat
4. Catat connection string dari tab "Connect"

### 3. Deploy Backend
1. Di project yang sama, klik "New Service"
2. Pilih "GitHub Repo"
3. Pilih repository `nusaevent`
4. Pilih folder `backend`
5. Railway akan otomatis detect sebagai Node.js app

### 4. Environment Variables
Di Railway dashboard, pergi ke tab "Variables" dan tambahkan:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=<dari PostgreSQL service>
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
DUITKU_MERCHANT_CODE=your-merchant-code
DUITKU_API_KEY=your-api-key
DUITKU_CALLBACK_URL=https://your-app.railway.app/api/payments/gateway/duitku/notification
DUITKU_RETURN_URL=https://your-app.railway.app/payment/success
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
ALLOWED_ORIGINS=https://your-frontend-domain.com
SENTRY_DSN=your-sentry-dsn
```

### 5. Database Migration
1. Di Railway dashboard, buka "Deployments" tab
2. Klik pada deployment terbaru
3. Buka "Logs" tab
4. Jalankan command:
```bash
npx prisma migrate deploy
npx prisma generate
```

### 6. Custom Domain (Optional)
1. Di service settings, pergi ke "Domains"
2. Tambahkan custom domain jika diperlukan

## Update Mobile App

Setelah backend ter-deploy, update URL di mobile app:

### 1. Update Network Config
File: `mobileapp/lib/core/network/network_config.dart`
```dart
static const String baseUrl = 'https://your-railway-app.railway.app/api';
```

### 2. Update WebSocket
File: `mobileapp/lib/core/services/websocket_service.dart`
```dart
final wsUrl = 'wss://your-railway-app.railway.app/ws?token=$_accessToken';
```

### 3. Update File URLs
File: `mobileapp/lib/core/constants/app_constants.dart`
```dart
static const String fileBaseUrl = 'https://your-railway-app.railway.app';
```

## Monitoring

Railway menyediakan monitoring built-in:
- Logs real-time
- Metrics (CPU, Memory, Network)
- Health checks
- Automatic deployments dari GitHub

## Troubleshooting

### Database Connection Issues
1. Pastikan `DATABASE_URL` sudah benar
2. Check PostgreSQL service status
3. Verify network connectivity

### Build Failures
1. Check Node.js version compatibility
2. Verify all dependencies ada di package.json
3. Check build logs untuk error details

### Runtime Errors
1. Check application logs
2. Verify environment variables
3. Test API endpoints secara manual
