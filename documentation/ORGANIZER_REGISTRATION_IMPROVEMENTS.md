# Organizer Registration Improvements - Summary

## ✅ Perubahan yang Telah Dilakukan

### 1. Database Schema - Simplified & Proper

**Sebelum**: Banyak field optional, tidak jelas mana yang wajib
**Sesudah**: Field required jelas, documents sebagai array PDF

#### IndividualProfile
- ✅ `nik` → **Required** (sebelumnya optional)
- ✅ `personalAddress` → **Required** (sebelumnya optional)
- ✅ `personalPhone` → **Required** (sebelumnya optional)
- ✅ `documents` → **Array of PDF URLs** (baru)
- ❌ Removed: `portfolio`, `socialMedia` (tidak perlu)

#### CommunityProfile
- ✅ `communityName` → **Required**
- ✅ `communityAddress` → **Required** (sebelumnya optional)
- ✅ `communityPhone` → **Required** (sebelumnya optional)
- ✅ `contactPerson` → **Required** (sebelumnya optional)
- ✅ `documents` → **Array of PDF URLs** (baru)
- ❌ Removed: `communityType`, `legalDocument`, `website`, `socialMedia`

#### BusinessProfile
- ✅ `businessName` → **Required**
- ✅ `businessAddress` → **Required** (sebelumnya optional)
- ✅ `businessPhone` → **Required** (sebelumnya optional)
- ✅ `npwp` → **Optional** (tetap optional untuk UMKM)
- ✅ `documents` → **Array of PDF URLs** (baru)
- ❌ Removed: `businessType`, `legalDocument`, `logo`, `socialMedia`, `portfolio`

#### InstitutionProfile
- ✅ `institutionName` → **Required**
- ✅ `institutionAddress` → **Required** (sebelumnya optional)
- ✅ `institutionPhone` → **Required** (sebelumnya optional)
- ✅ `contactPerson` → **Required** (sebelumnya optional)
- ✅ `documents` → **Array of PDF URLs** (baru)
- ❌ Removed: `institutionType`, `akta`, `siup`, `website`, `socialMedia`

### 2. Backend Route - Simplified Validation

**File**: `backend/src/routes/upgrade.js`

**Perubahan**:
- ✅ Validasi berdasarkan organizer type
- ✅ Field required jelas per tipe
- ✅ Documents sebagai array URL (dari upload endpoint)
- ✅ Error messages lebih jelas

**Validation Logic**:
```javascript
// INDIVIDUAL: nik, personalAddress, personalPhone required
// COMMUNITY: communityName, communityAddress, communityPhone, contactPerson required
// SMALL_BUSINESS: businessName, businessAddress, businessPhone required
// INSTITUTION: institutionName, institutionAddress, institutionPhone, contactPerson required
// Semua: documents array required (min 1)
```

### 3. Frontend UI - Step-by-Step Flow

**File**: `frontend/src/app/(auth)/upgrade-business/page.tsx`

**Perbaikan UI**:
- ✅ **Step 1**: Pilih tipe organizer (card selection dengan icon)
- ✅ **Step 2**: Isi informasi sesuai tipe (form yang relevan)
- ✅ **Step 3**: Upload dokumen PDF (drag & drop)
- ✅ Progress indicator (3 steps)
- ✅ Validasi per step
- ✅ Error handling yang jelas
- ✅ Design lebih clean dan modern

**Features**:
- Step-by-step wizard flow
- Visual progress indicator
- Card-based organizer type selection
- PDF-only document upload
- Real-time validation
- Better error messages

### 4. Document Requirements - Simplified

**Sebelum**: Banyak dokumen berbeda (legalDocument, akta, siup, dll)
**Sesudah**: Satu array documents, hanya PDF

**Dokumen yang Diperlukan**:
- **INDIVIDUAL**: KTP/NIK (1 PDF)
- **COMMUNITY**: Surat Keterangan Komunitas (1 PDF)
- **SMALL_BUSINESS**: NPWP atau SIUP (opsional, 1 PDF jika ada)
- **INSTITUTION**: Surat Keterangan Institusi (1 PDF)

## 📋 Langkah-Langkah Deployment

### 1. Database Migration

**PENTING**: Jalankan migration untuk update schema!

```bash
cd backend
npx prisma migrate dev --name simplify_organizer_profiles
```

**Atau jika sudah di production**:
```bash
npx prisma migrate deploy
```

**Migration akan**:
- Menambahkan field `documents` (String[]) ke semua profile tables
- Mengubah field optional menjadi required
- Menghapus field yang tidak diperlukan

### 2. Update Prisma Client

```bash
cd backend
npx prisma generate
```

### 3. Test Backend

```bash
cd backend
npm run dev
```

Test endpoint:
- `POST /api/upgrade/business` dengan data baru
- Pastikan validation bekerja
- Pastikan documents array tersimpan

### 4. Test Frontend

```bash
cd frontend
npm run dev
```

Test flow:
1. Pilih organizer type
2. Isi informasi
3. Upload PDF documents
4. Submit request

## 🔍 Perubahan Detail

### Database Schema Changes

**IndividualProfile**:
```prisma
// BEFORE
nik             String?
personalAddress String?
personalPhone   String?
portfolio       String[]
socialMedia     Json?

// AFTER
nik             String   // Required
personalAddress String   // Required
personalPhone   String   // Required
documents       String[] @default([]) // New
```

**CommunityProfile**:
```prisma
// BEFORE
communityName    String
communityType    String?
communityAddress String?
communityPhone   String?
contactPerson    String?
legalDocument    String?
website          String?
socialMedia      Json?

// AFTER
communityName    String   // Required
communityAddress String   // Required
communityPhone   String   // Required
contactPerson    String   // Required
documents        String[] @default([]) // New
```

**BusinessProfile**:
```prisma
// BEFORE
businessName    String
businessType    String?
businessAddress String?
businessPhone   String?
npwp            String?
legalDocument   String?
logo            String?
socialMedia     Json?
portfolio       String[]

// AFTER
businessName    String   // Required
businessAddress String   // Required
businessPhone   String   // Required
npwp            String? // Optional
documents       String[] @default([]) // New
```

**InstitutionProfile**:
```prisma
// BEFORE
institutionName    String
institutionType    String?
institutionAddress String?
institutionPhone   String?
contactPerson      String?
akta               String?
siup               String?
website            String?
socialMedia        Json?

// AFTER
institutionName    String   // Required
institutionAddress String   // Required
institutionPhone   String   // Required
contactPerson      String   // Required
documents          String[] @default([]) // New
```

## ⚠️ Breaking Changes

### Data Migration Needed

Jika ada data existing di database:

1. **Field yang dihapus** (`portfolio`, `socialMedia`, `legalDocument`, dll):
   - Data akan hilang setelah migration
   - Pastikan backup dulu jika perlu

2. **Field yang menjadi required**:
   - Data existing dengan NULL akan error
   - Perlu update data existing sebelum migration

**Script untuk update data existing** (jika perlu):
```sql
-- Update NULL values dengan default values sebelum migration
UPDATE individual_profiles 
SET nik = '0000000000000000', 
    personal_address = 'Alamat belum diisi',
    personal_phone = '0000000000'
WHERE nik IS NULL OR personal_address IS NULL OR personal_phone IS NULL;

-- Lakukan untuk semua profile types...
```

## 🎯 Benefits

1. **Simpler Database**: Field required jelas, tidak ada field yang tidak jelas kegunaannya
2. **Better UX**: Step-by-step flow lebih user-friendly
3. **Cleaner Code**: Validasi lebih sederhana dan jelas
4. **PDF Only**: Dokumen hanya PDF, lebih konsisten
5. **Less Confusion**: User tidak bingung field mana yang wajib

## 📝 Notes

- Documents disimpan sebagai array URL (dari `/api/upload/documents`)
- Upload endpoint sudah ada di `backend/src/routes/upload.js`
- Frontend menggunakan fetch langsung untuk upload (bisa diubah ke ApiService jika perlu)
- Validasi dilakukan di frontend (step-by-step) dan backend (final validation)

## 🚀 Next Steps

1. ✅ Run database migration
2. ✅ Test backend endpoint
3. ✅ Test frontend flow
4. ✅ Update operations dashboard jika perlu (untuk review documents)
5. ✅ Update email templates jika perlu

---

**Last Updated**: Based on improvements made
**Status**: Ready for testing

