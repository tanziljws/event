# 🔍 Cek Database Local vs Railway

## 📋 Cara Cek Database

### 1. Cek Database Local

```bash
cd backend
npm run check:local
```

atau langsung:

```bash
node scripts/check-local-database.js
```

### 2. Cek Database Railway Production

```bash
cd backend
npm run check:railway
```

atau via Railway CLI:

```bash
railway run --service backend node scripts/check-railway-database.js
```

## 🔄 Compare Local vs Railway

Untuk compare, jalankan kedua script dan bandingkan output:

```bash
# Check local
echo "=== LOCAL DATABASE ===" && npm run check:local

# Check Railway (via Railway CLI)
echo "=== RAILWAY DATABASE ===" && railway run --service backend npm run check:railway
```

## ✅ Yang Dicek

Script akan cek:

1. **ticket_types table** - Table untuk multiple ticket types
2. **event_registrations.ticket_type_id** - Kolom untuk link ke ticket type
3. **event_registrations.ticket_benefits** - Kolom untuk ticket benefits
4. **events.has_multiple_ticket_types** - Flag untuk multiple tickets
5. **events.event_end_date** - Kolom untuk end date
6. **events.event_end_time** - Kolom untuk end time
7. **individual_profiles.documents** - Kolom untuk documents array
8. **Indexes** - Semua index yang diperlukan
9. **Foreign Keys** - Semua foreign key yang diperlukan

## 🛠️ Fix Database Railway

Jika ada yang missing di Railway:

```bash
# Fix semua database issues
railway run --service backend npm run fix:all

# Atau satu per satu
railway run --service backend npm run fix:tickets
railway run --service backend npm run fix:db
```

## 📊 Output Example

```
✅ SUMMARY: All required tables and columns exist!
✅ Railway database is up to date with Prisma schema
✅ Database matches local database structure

📊 Database Records:
   ticket_types: 5 records
   event_registrations: 11 records
   events: 2 records
```

atau jika ada yang missing:

```
❌ SUMMARY: Some components are missing:
   ❌ ticket_types table
   ❌ event_registrations.ticket_type_id

💡 To fix, run one of these:
   npm run fix:all
```

