# Organizer Registration & Approval Flow Verification

## ✅ Flow Lengkap yang Sudah Diperbaiki

### 1. **User Register sebagai Organizer**
   - **Endpoint**: `POST /api/auth/register-organizer`
   - **Frontend**: `/register-organizer`
   - **Proses**:
     - User mengisi form registrasi organizer (4 step)
     - Upload dokumen sesuai tipe organizer
     - Submit data ke backend
     - Backend membuat user dengan:
       - `role: 'ORGANIZER'`
       - `verificationStatus: 'PENDING'` ✅
       - Profile sesuai tipe (IndividualProfile, CommunityProfile, BusinessProfile, atau InstitutionProfile)
     - Auto-assign ke agent (jika ada)
     - Email OTP untuk verifikasi email dikirim

### 2. **Organizer Muncul di Admin List**
   - **Endpoint**: `GET /api/admin/organizers`
   - **Frontend**: `/admin/organizers`
   - **Query**: Mengambil semua user dengan `role: 'ORGANIZER'` (termasuk yang PENDING) ✅
   - **Data yang ditampilkan**:
     - Full name, email, phone
     - Organizer type
     - Verification status (PENDING/APPROVED/REJECTED)
     - Business/Organization info dari profile
     - Portfolio (dokumen pertama)
     - Created date

### 3. **Admin View Detail Organizer**
   - **Endpoint**: `GET /api/admin/organizers/:id`
   - **Frontend**: `/admin/organizers/[id]`
   - **Data yang ditampilkan**:
     - Personal information
     - Business/Organization information (dari profile sesuai tipe)
     - Portfolio & Social Media
     - Verification status
     - Rejection reason (jika rejected)
   - **Actions tersedia** (jika status PENDING):
     - Approve button
     - Reject button (dengan dialog untuk reason)

### 4. **Admin Approve Organizer**
   - **Endpoint**: `PATCH /api/admin/organizers/:id/approve`
   - **Proses**:
     - Validasi organizer exists dan belum approved
     - Update database:
       - `verificationStatus: 'APPROVED'` ✅
       - `verifiedAt: new Date()` ✅
     - **Email notification dikirim** ✅
       - Menggunakan `emailTemplates.sendOrganizerApprovalEmail()`
       - Subject: "🎉 Selamat! Akun Organizer Anda Telah Disetujui"
     - Log activity
     - Return updated organizer data

### 5. **Admin Reject Organizer**
   - **Endpoint**: `PATCH /api/admin/organizers/:id/reject`
   - **Body**: `{ reason: string }`
   - **Proses**:
     - Validasi reason tidak kosong
     - Validasi organizer exists dan belum rejected
     - Update database:
       - `verificationStatus: 'REJECTED'` ✅
       - `rejectedReason: reason` ✅
     - **Email notification dikirim** ✅
       - Menggunakan `emailTemplates.sendOrganizerRejectionEmail()`
       - Subject: "❌ Status Organizer Anda"
       - Include rejection reason
     - Log activity
     - Return updated organizer data

## ✅ Perbaikan yang Dilakukan

1. **Email Notification**:
   - ✅ Menambahkan import `emailTemplates` dari `config/email.js`
   - ✅ Menambahkan email notification di endpoint approve
   - ✅ Menambahkan email notification di endpoint reject
   - ✅ Email tidak akan gagal operasi utama jika gagal dikirim

2. **Data Fetching**:
   - ✅ Query `/organizers` sudah benar mengambil semua organizer (termasuk PENDING)
   - ✅ Mapping data dari profile models sudah benar
   - ✅ Detail organizer endpoint sudah benar

3. **Frontend Integration**:
   - ✅ Halaman list organizer sudah terintegrasi dengan API
   - ✅ Halaman detail organizer sudah dibuat dan terintegrasi
   - ✅ Approve/Reject actions sudah terintegrasi dengan API
   - ✅ Dialog untuk reject reason sudah ada

## 🔄 Flow Lengkap

```
User Register Organizer
    ↓
verificationStatus: 'PENDING'
    ↓
Admin melihat di /admin/organizers
    ↓
Admin klik view detail
    ↓
Admin approve/reject
    ↓
Database updated + Email sent
    ↓
Organizer menerima email notification
```

## ✅ Testing Checklist

- [ ] User bisa register sebagai organizer
- [ ] Organizer baru muncul di admin list dengan status PENDING
- [ ] Admin bisa view detail organizer
- [ ] Admin bisa approve organizer
- [ ] Email approval dikirim ke organizer
- [ ] Admin bisa reject organizer dengan reason
- [ ] Email rejection dikirim ke organizer dengan reason
- [ ] Status update di database benar
- [ ] Frontend menampilkan status yang benar setelah approve/reject

## 📝 Catatan

- Email notification menggunakan template dari `config/email.js`
- Jika email gagal dikirim, operasi utama tetap berhasil (tidak throw error)
- Semua organizer (PENDING, APPROVED, REJECTED) muncul di list
- Filter berdasarkan status bisa ditambahkan di frontend jika diperlukan

