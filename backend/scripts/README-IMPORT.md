# Database Import Guide

## Import dari Local DB ke Railway PostgreSQL

### Quick Import (Recommended)

```bash
cd backend/scripts
./import-all-tables.sh
```

Script ini akan:
1. Test koneksi ke local DB dan Railway DB
2. Export semua table dari local DB
3. Import ke Railway DB
4. Verify import

### Manual Import

#### 1. Export dari Local DB

```bash
# Export schema + data
PGPASSWORD=your_local_password pg_dump \
  -h localhost \
  -p 5432 \
  -U postgres \
  -d event_management \
  --no-owner \
  --no-privileges \
  > local_backup.sql
```

#### 2. Import ke Railway

```bash
# Import ke Railway
PGPASSWORD=fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq psql \
  -h hopper.proxy.rlwy.net \
  -p 22183 \
  -U postgres \
  -d railway \
  -f local_backup.sql
```

### Railway Connection Details

```
Host: hopper.proxy.rlwy.net
Port: 22183
Database: railway
User: postgres
Password: fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq
```

### Environment Variables

Set di Railway:
```
DATABASE_URL=postgresql://postgres:fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq@hopper.proxy.rlwy.net:22183/railway
```

### Troubleshooting

1. **Connection refused**: Pastikan Railway DB sudah running
2. **Permission denied**: Pastikan credentials benar
3. **Table already exists**: Gunakan `--clean` flag atau drop tables dulu

### After Import

1. Update `DATABASE_URL` di Railway environment variables
2. Run Prisma migrations jika perlu: `npx prisma migrate deploy`
3. Verify data dengan query sederhana

