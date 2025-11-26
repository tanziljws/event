# 📚 Panduan Membuat Database PostgreSQL

## 🖥️ Cara 1: Menggunakan Command Line (psql)

### Langkah 1: Connect ke PostgreSQL Server

```bash
# Menggunakan connection string langsung
psql "postgresql://postgres:fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq@hopper.proxy.rlwy.net:22183/railway"

# Atau menggunakan parameter terpisah
psql -h hopper.proxy.rlwy.net -p 22183 -U postgres -d railway
```

### Langkah 2: Buat Database Baru

Setelah terhubung, jalankan perintah SQL:

```sql
-- Buat database baru
CREATE DATABASE nama_database;

-- Contoh: buat database untuk development
CREATE DATABASE event_management_dev;

-- Atau database untuk testing
CREATE DATABASE event_management_test;
```

### Langkah 3: Berikan Permission (Opsional)

```sql
-- Berikan semua permission ke user postgres
GRANT ALL PRIVILEGES ON DATABASE nama_database TO postgres;

-- Atau buat user baru
CREATE USER nama_user WITH PASSWORD 'password_anda';
GRANT ALL PRIVILEGES ON DATABASE nama_database TO nama_user;
```

### Langkah 4: Verifikasi Database

```sql
-- List semua database
\l

-- Atau
\list

-- Connect ke database yang baru dibuat
\c nama_database

-- Keluar dari psql
\q
```

---

## 🖱️ Cara 2: Menggunakan pgAdmin (GUI)

### Langkah 1: Connect ke Server

1. Buka pgAdmin
2. Klik kanan pada **Servers** → **Register** → **Server**
3. Isi form connection:
   - **Name**: Railway Database (atau nama apapun)
   - **Host**: `hopper.proxy.rlwy.net`
   - **Port**: `22183`
   - **Maintenance database**: `railway` atau `postgres`
   - **Username**: `postgres`
   - **Password**: `fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq`
   - **Save password**: ✅ (centang)
4. Klik **Save**

### Langkah 2: Buat Database Baru

1. Klik kanan pada **Databases** → **Create** → **Database...**
2. Isi form:
   - **Database name**: `nama_database` (contoh: `event_management_dev`)
   - **Owner**: `postgres` (default)
   - **Encoding**: `UTF8` (default)
   - **Template**: `template0` atau `template1`
3. Klik **Save**

### Langkah 3: Verifikasi

- Database baru akan muncul di list **Databases**
- Klik kanan database → **Properties** untuk melihat detail

---

## 🔧 Cara 3: Menggunakan Command Line dengan Script

### Buat file script: `create-db.sh`

```bash
#!/bin/bash

# Connection details
HOST="hopper.proxy.rlwy.net"
PORT="22183"
USER="postgres"
PASSWORD="fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq"
MAINTENANCE_DB="railway"
NEW_DB="event_management_dev"

# Export password untuk psql
export PGPASSWORD="$PASSWORD"

# Buat database
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$MAINTENANCE_DB" -c "CREATE DATABASE $NEW_DB;"

# Verifikasi
echo "Database '$NEW_DB' berhasil dibuat!"
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$MAINTENANCE_DB" -c "\l $NEW_DB"
```

### Jalankan script:

```bash
chmod +x create-db.sh
./create-db.sh
```

---

## 📝 Contoh Lengkap: Membuat Database untuk Project

### 1. Connect ke Railway PostgreSQL

```bash
psql "postgresql://postgres:fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq@hopper.proxy.rlwy.net:22183/railway"
```

### 2. Buat Database

```sql
-- Development database
CREATE DATABASE event_management_dev;

-- Production database (jika belum ada)
CREATE DATABASE event_management_prod;

-- Test database
CREATE DATABASE event_management_test;
```

### 3. Update .env File

Setelah database dibuat, update file `.env`:

```env
# Development
DATABASE_URL="postgresql://postgres:fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq@hopper.proxy.rlwy.net:22183/event_management_dev"

# Production
DATABASE_URL="postgresql://postgres:fYSYAUHsTJvZkCGsegpyqWEIcIvYiDTq@hopper.proxy.rlwy.net:22183/event_management_prod"
```

### 4. Run Prisma Migrations

```bash
cd backend
npx prisma migrate dev
```

---

## 🛠️ Command Line Commands yang Berguna

### Connect ke Database

```bash
# Connect dengan connection string
psql "postgresql://user:password@host:port/database"

# Connect dengan parameter
psql -h host -p port -U user -d database
```

### List Databases

```sql
\l
-- atau
\list
```

### Switch Database

```sql
\c nama_database
```

### List Tables

```sql
\dt
```

### Describe Table

```sql
\d nama_tabel
```

### Exit psql

```sql
\q
```

### Help

```sql
\?
```

---

## ⚠️ Troubleshooting

### Error: "database does not exist"

```sql
-- Cek database yang ada
\l

-- Buat database jika belum ada
CREATE DATABASE nama_database;
```

### Error: "permission denied"

```sql
-- Berikan permission
GRANT ALL PRIVILEGES ON DATABASE nama_database TO postgres;
```

### Error: "connection refused"

- Cek host dan port
- Pastikan Railway database sudah running
- Cek firewall/network settings

---

## 📌 Tips

1. **Gunakan template0** untuk database kosong yang benar-benar fresh
2. **Gunakan template1** untuk database dengan default settings
3. **Backup database** sebelum melakukan perubahan besar
4. **Gunakan environment variables** untuk connection string (jangan hardcode password)

---

## 🔐 Security Best Practices

1. ✅ Jangan commit `.env` file ke Git
2. ✅ Gunakan password yang kuat
3. ✅ Rotate password secara berkala
4. ✅ Gunakan connection pooling untuk production
5. ✅ Enable SSL jika memungkinkan

