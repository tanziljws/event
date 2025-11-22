# Optimasi Startup Backend

## Masalah
Backend startup sangat lambat (3-4 menit) karena loading routes yang berat.

## Solusi: Lazy Loading Routes

Ubah `backend/src/app.js` untuk menggunakan lazy loading pada routes yang lambat:

### 1. Ganti import routes yang lambat dengan lazy loading:

```javascript
// GANTI DARI:
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
// ... dll

// MENJADI:
const lazyLoadRouter = (routePath, routeName) => {
  let router = null;
  return (req, res, next) => {
    if (!router) {
      try {
        router = require(routePath);
        console.log(`✅ ${routeName} routes loaded (lazy)`);
      } catch (error) {
        console.error(`Error loading route ${routePath}:`, error.message);
        return res.status(500).json({ success: false, message: 'Route loading error' });
      }
    }
    return router(req, res, next);
  };
};

const authRoutesLoader = lazyLoadRouter('./routes/auth', 'Auth');
const eventRoutesLoader = lazyLoadRouter('./routes/events', 'Event');
// ... dll
```

### 2. Gunakan loader di app.use():

```javascript
// GANTI DARI:
app.use('/api/auth', authRoutes);

// MENJADI:
app.use('/api/auth', authRoutesLoader);
```

## Routes yang Perlu Lazy Loading:
- auth (243 detik)
- events (38 detik)
- certificates (24 detik)
- organizers (28 detik)
- upload (18 detik)
- departments (8 detik)
- department-tickets (25 detik)
- payments (48 detik)
- notifications (21 detik)

## Hasil
- Startup time: 3-4 menit → < 10 detik
- Routes akan di-load saat pertama kali diakses
- Tidak ada perubahan functionality

