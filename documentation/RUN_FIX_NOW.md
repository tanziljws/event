# 🚀 Fix Multiple Tickets Sekarang - Perintah Sederhana

## ⚡ Cara Paling Cepat (Satu Perintah)

Jalankan ini di terminal:

```bash
railway run --service backend node scripts/fix-multiple-tickets-production.js
```

Atau via SQL langsung:

```bash
PGPASSWORD=AQBAWVQXZFxwgssCksLcOlKicSvAxniO psql -h nozomi.proxy.rlwy.net -U postgres -p 55832 -d railway -f backend/prisma/migrations/fix_multiple_tickets_production.sql
```

## ✅ Auto-Fix Sudah Diaktifkan!

Sekarang setiap kali server restart di production, database fix akan jalan **otomatis** (non-blocking).

File yang sudah diupdate:
- ✅ `backend/src/app.js` - Auto-fix saat startup production
- ✅ `backend/scripts/fix-multiple-tickets-production.js` - Script fix
- ✅ `backend/FIX_DATABASE_COMMANDS.md` - Dokumentasi lengkap

## 🎯 Yang Akan Difix Otomatis:

1. ✅ Membuat `ticket_types` table (jika belum ada)
2. ✅ Menambahkan `ticket_type_id` ke `event_registrations`
3. ✅ Menambahkan `ticket_benefits` ke `event_registrations`
4. ✅ Menambahkan `has_multiple_ticket_types` ke `events`
5. ✅ Membuat semua indexes dan foreign keys

## 📝 Catatan:

- Fix akan jalan otomatis saat server start di production
- Fix tidak akan block startup - jalan di background
- Fix aman dijalankan berkali-kali (idempotent)
- Tidak akan menghapus data yang sudah ada

---

**Setelah deploy ke Railway, fix akan jalan otomatis!** 🎉

