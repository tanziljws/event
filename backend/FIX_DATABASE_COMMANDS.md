# Perintah Fix Database Production - Otomatis

## 🚀 Cara Paling Mudah (Otomatis)

Jalankan via Railway CLI:

```bash
railway run --service backend node scripts/fix-multiple-tickets-production.js
```

Atau langsung via SQL:

```bash
PGPASSWORD=AQBAWVQXZFxwgssCksLcOlKicSvAxniO psql -h nozomi.proxy.rlwy.net -U postgres -p 55832 -d railway -f backend/prisma/migrations/fix_multiple_tickets_production.sql
```

## 📋 Perintah Lengkap

### Fix Multiple Tickets

```bash
# Via Node.js Script
railway run --service backend npm run fix:tickets

# Via SQL langsung
PGPASSWORD=AQBAWVQXZFxwgssCksLcOlKicSvAxniO psql -h nozomi.proxy.rlwy.net -U postgres -p 55832 -d railway -f backend/prisma/migrations/fix_multiple_tickets_production.sql
```

### Fix Semua Database Issues

```bash
# Via Node.js Script
railway run --service backend npm run fix:all

# Atau satu per satu
railway run --service backend npm run fix:db
```

## 🔄 Integrasi Otomatis ke Startup

Untuk auto-fix setiap kali server start (opsional), tambahkan ke `backend/src/app.js` sebelum server start:

```javascript
// Auto-fix database on startup (production only)
if (process.env.NODE_ENV === 'production') {
  const { fixMultipleTicketsProduction } = require('../scripts/fix-multiple-tickets-production');
  fixMultipleTicketsProduction().catch(err => {
    logger.warn('Database fix warning:', err.message);
  });
}
```

## ✅ Verifikasi

Setelah fix berjalan, cek:

1. ✅ `ticket_types` table exists
2. ✅ `event_registrations.ticket_type_id` column exists  
3. ✅ `event_registrations.ticket_benefits` column exists
4. ✅ `events.has_multiple_ticket_types` column exists

## 📝 Catatan

- Script aman dijalankan berkali-kali (idempotent)
- Tidak akan menghapus data yang sudah ada
- Hanya menambahkan kolom/table yang belum ada

