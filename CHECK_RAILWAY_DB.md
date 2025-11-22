# 🔍 Cek Database Railway - Cara Mudah

## ⚡ Cara 1: Pakai DATABASE_URL Langsung (Paling Mudah)

```bash
cd backend

# Set DATABASE_URL dari Railway
export DATABASE_URL="postgresql://postgres:AQBAWVQXZFxwgssCksLcOlKicSvAxniO@nozomi.proxy.rlwy.net:55832/railway"

# Cek database
node scripts/check-railway-direct.js
```

## ⚡ Cara 2: Via Railway CLI (Tanpa Service Name)

```bash
cd backend

# Link ke Railway project (jika belum)
railway link

# Cek database (Railway CLI akan load DATABASE_URL otomatis)
railway run node scripts/check-railway-direct.js
```

## ⚡ Cara 3: Cek Service Name Dulu

```bash
# List semua service di Railway project
railway service

# Atau cek di Railway dashboard untuk service name yang benar
# Kemudian jalankan:
railway run --service <service-name> node scripts/check-railway-direct.js
```

## ⚡ Cara 4: Langsung via psql (Paling Cepat)

```bash
# Connect langsung ke Railway database
PGPASSWORD=AQBAWVQXZFxwgssCksLcOlKicSvAxniO psql -h nozomi.proxy.rlwy.net -U postgres -p 55832 -d railway

# Lalu jalankan query:
\dt ticket_types
\d event_registrations
\d events
\d individual_profiles
```

## 📋 Query SQL Langsung untuk Cek

```sql
-- Cek ticket_types table
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'ticket_types'
);

-- Cek columns di event_registrations
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event_registrations' 
AND column_name IN ('ticket_type_id', 'ticket_benefits');

-- Cek columns di events
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('has_multiple_ticket_types', 'event_end_date', 'event_end_time');

-- Cek individual_profiles.documents
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'individual_profiles' 
AND column_name = 'documents';
```

## 🛠️ Fix Database Railway (Jika Ada yang Missing)

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres:AQBAWVQXZFxwgssCksLcOlKicSvAxniO@nozomi.proxy.rlwy.net:55832/railway"

# Fix semua database issues
node scripts/fix-multiple-tickets-production.js
node scripts/fix-production-database.js

# Atau sekaligus
npm run fix:all
```

## ✅ Output yang Diharapkan

Jika semua lengkap, akan muncul:

```
✅ SUMMARY: All required tables and columns exist!
✅ Railway database is up to date with Prisma schema
✅ Database matches local database structure

📊 Database Records:
   ticket_types: X records
   event_registrations: X records
   events: X records
```

Jika ada yang missing, akan muncul list apa saja yang missing dan cara fix-nya.

