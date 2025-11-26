# 🔧 Xendit Client Initialization Fix

## Error: "Xendit client not initialized"

Error ini terjadi ketika `Disbursement` service tidak berhasil di-initialize. Berikut adalah langkah-langkah untuk memperbaikinya.

---

## 🔍 Diagnosa Masalah

### Step 1: Cek Environment Variable

Pastikan `XENDIT_SECRET_KEY` sudah di-set:

```bash
# Di terminal backend
echo $XENDIT_SECRET_KEY

# Atau cek di .env file
cat backend/.env | grep XENDIT
```

**Jika tidak ada**, tambahkan di `.env`:
```env
XENDIT_SECRET_KEY=your_secret_key_here
XENDIT_IS_PRODUCTION=false  # atau true untuk production
```

### Step 2: Cek Backend Logs

Saat server start, cari log ini:

**✅ Jika berhasil:**
```
✅ Xendit client created. Available services: [...]
✅ Disbursement instance created successfully
✅ Xendit service initialized (Development/Production)
Xendit Disbursement available: true
Has create method: true
```

**❌ Jika gagal:**
```
⚠️ Xendit secret key not found. Disbursement features will not work.
⚠️ Set XENDIT_SECRET_KEY in environment variables to enable disbursement.
```

atau

```
❌ Disbursement service not available in Xendit client
Available services: [...]
```

### Step 3: Cek xendit-node Version

```bash
cd backend
npm list xendit-node
```

Pastikan menggunakan versi yang kompatibel (v7.0.0 atau lebih baru).

---

## 🛠️ Solusi

### Fix 1: Set Environment Variable

**Jika `XENDIT_SECRET_KEY` tidak ada:**

1. Dapatkan secret key dari Xendit Dashboard
2. Tambahkan ke `.env` file:
   ```env
   XENDIT_SECRET_KEY=xnd_development_xxxxxxxxxxxxx
   XENDIT_IS_PRODUCTION=false
   ```

3. **Restart backend server**

### Fix 2: Reinstall xendit-node

Jika ada masalah dengan package:

```bash
cd backend
npm uninstall xendit-node
npm install xendit-node@latest
```

### Fix 3: Cek Xendit Client Initialization

Jika masih error setelah set environment variable, cek:

1. **Backend logs saat startup** - cari error saat initialize
2. **Available services** - pastikan `Disbursement` ada di list
3. **Error saat create instance** - cek apakah ada error saat `new Disbursement()`

---

## 📝 Code Changes

Kode sudah diperbaiki dengan:

1. **Better Error Handling**:
   - Try-catch saat initialize
   - Logging yang lebih detail
   - Error message yang lebih informatif

2. **Better Logging**:
   - Log semua available services
   - Log saat create instance
   - Log available methods
   - Log error details jika gagal

3. **Better Error Messages**:
   - Memberitahu jika secret key tidak di-set
   - Memberitahu jika service tidak available
   - Memberitahu untuk cek backend logs

---

## 🧪 Testing

Setelah fix, test dengan:

1. **Restart backend server**
2. **Cek logs** - pastikan tidak ada error
3. **Coba request payout** - seharusnya tidak error "not initialized"

---

## 🔍 Debug Checklist

- [ ] `XENDIT_SECRET_KEY` sudah di-set di `.env`
- [ ] Backend server sudah di-restart setelah set env var
- [ ] Backend logs menunjukkan "Disbursement instance created successfully"
- [ ] `xendit-node` versi terbaru terinstall
- [ ] Tidak ada error saat server startup

---

## 📞 Jika Masih Error

Jika masih error setelah semua fix di atas, share:

1. **Backend logs saat startup** (cari bagian Xendit initialization)
2. **Output dari**: `echo $XENDIT_SECRET_KEY` (tanpa expose secret key, cukup cek apakah ada)
3. **xendit-node version**: `npm list xendit-node`
4. **Error message lengkap** dari logs

---

## 💡 Notes

- Xendit secret key berbeda untuk development dan production
- Pastikan menggunakan secret key yang sesuai dengan environment
- Secret key biasanya dimulai dengan `xnd_development_` atau `xnd_production_`

