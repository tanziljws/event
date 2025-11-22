# Fix Production Database - Missing Columns Error

## 🔴 Error

```
The column `events.event_end_date` does not exist in the current database.
```

## 🔍 Root Cause

Schema Prisma sudah diupdate untuk menambahkan field `eventEndDate` dan `eventEndTime`, tapi migration belum dijalankan di database production (Railway).

## ✅ Solution

### **Opsi 1: Run Migration Script di Railway (Recommended)**

1. **Via Railway CLI:**
   ```bash
   # Login ke Railway
   railway login
   
   # Connect ke project
   railway link
   
   # Run migration script
   cd backend
   railway run node scripts/fix-production-database.js
   ```

2. **Via Railway Dashboard:**
   - Buka Railway dashboard
   - Pilih service backend
   - Buka "Settings" → "Variables"
   - Pastikan `DATABASE_URL` sudah di-set
   - Buka "Deployments" tab
   - Jalankan command:
     ```bash
     node scripts/fix-production-database.js
     ```

### **Opsi 2: Run SQL Migration Langsung**

1. **Connect ke Railway Database:**
   - Buka Railway dashboard
   - Pilih database service
   - Buka "Data" tab atau "Connect" tab
   - Copy connection string

2. **Run SQL:**
   ```sql
   -- Add event_end_date column
   ALTER TABLE "events" 
   ADD COLUMN IF NOT EXISTS "event_end_date" TIMESTAMP(3);

   -- Add event_end_time column  
   ALTER TABLE "events" 
   ADD COLUMN IF NOT EXISTS "event_end_time" TEXT;
   ```

### **Opsi 3: Via Prisma Migrate (Jika Ada Akses)**

```bash
cd backend

# Generate migration
npx prisma migrate dev --name add_event_end_date_time

# Apply to production (via Railway)
railway run npx prisma migrate deploy
```

## 📋 Script yang Tersedia

### `scripts/fix-production-database.js`
Script Node.js yang:
- ✅ Check apakah kolom sudah ada
- ✅ Tambah kolom jika belum ada
- ✅ Regenerate Prisma Client
- ✅ Verify hasil

**Cara Pakai:**
```bash
cd backend
node scripts/fix-production-database.js
```

## 🎯 Quick Fix (Temporary)

Jika butuh fix cepat sementara migration belum jalan, bisa temporary remove field dari query:

**File: `backend/src/services/eventService.js`**

Tapi ini **TIDAK DISARANKAN** karena akan kehilangan fungsionalitas. Lebih baik jalankan migration.

## ✅ Verification

Setelah migration, verify dengan:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('event_end_date', 'event_end_time');
```

Atau test API:
```bash
curl https://web-production-38c7.up.railway.app/api/events?page=1&limit=5
```

## 🚀 Steps

1. **Run migration script** (pilih salah satu opsi di atas)
2. **Verify** kolom sudah ditambahkan
3. **Test API** - error seharusnya sudah hilang
4. **Redeploy** jika perlu untuk regenerate Prisma Client

## 📝 Notes

- Migration ini **safe** - menggunakan `IF NOT EXISTS` jadi tidak akan error jika kolom sudah ada
- Kolom `event_end_date` dan `event_end_time` adalah **nullable** (optional)
- Setelah migration, API akan berfungsi normal kembali

## 🆘 Jika Masih Error

1. Check database connection
2. Verify `DATABASE_URL` di Railway environment variables
3. Check Prisma Client sudah regenerated
4. Restart Railway service setelah migration

---

**Status:** ✅ Script dan migration ready
**Action Required:** Run migration di Railway production database

