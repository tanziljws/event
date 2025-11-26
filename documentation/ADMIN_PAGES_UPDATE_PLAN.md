# 📋 Plan Update Halaman Admin - Ganti Mock Data dengan API Real

## 🎯 Tujuan
Mengganti semua mock data di halaman admin dengan API real dari backend.

---

## 📊 Status Saat Ini

### ✅ Sudah Terintegrasi
- Dashboard (`/admin/dashboard`) - 100%
- Events (`/admin/events`) - 100%

### ❌ Masih Mock Data
- Organizers (`/admin/organizers`) - 0%
- Analytics (`/admin/analytics`) - 0%
- Settings (`/admin/settings`) - 0%

### ⚠️ Perlu Tambah Fitur
- Users (`/admin/users`) - 50% (perlu reset password, suspend, change role)

---

## 🗂️ Block Pengerjaan

### **BLOCK 1: Organizers Page** 🔴 PRIORITAS TINGGI
**File:** `frontend/src/app/(admin)/admin/organizers/page.tsx`

**Tugas:**
1. Ganti `fetchOrganizers()` - gunakan `ApiService.getAdminOrganizers()`
2. Update `handleApprove()` - gunakan `ApiService.approveOrganizer(id)`
3. Update `handleReject()` - tambah dialog untuk reason, gunakan `ApiService.rejectOrganizer(id, reason)`
4. Tambah error handling dan success notification
5. Handle loading states
6. Test approve/reject flow

**Estimasi:** 30-45 menit

---

### **BLOCK 2: Analytics Page** 🔴 PRIORITAS TINGGI
**File:** `frontend/src/app/(admin)/admin/analytics/page.tsx`

**Tugas:**
1. Ganti `fetchAnalytics()` - gunakan `ApiService.getMonthlyAnalytics(year, timeRange)`
2. Map response API ke struktur data yang dibutuhkan UI
3. Handle date range filter (7d, 30d, 90d, 1y)
4. Update chart data dengan data real
5. Tambah error handling
6. Test dengan berbagai time range

**Estimasi:** 45-60 menit

---

### **BLOCK 3: Settings Page** 🔴 PRIORITAS TINGGI
**File:** `frontend/src/app/(admin)/admin/settings/page.tsx`

**Tugas:**
1. Ganti `fetchSettings()` - gunakan `ApiService.getSystemSettings()`
2. Map response API (JSON format) ke struktur settings UI
3. Update `handleSave()` - loop untuk update semua settings dengan `ApiService.updateSystemSetting(key, value, description)`
4. Handle error dan success notification
5. Optimistic update (update UI sebelum API response)
6. Test save functionality

**Estimasi:** 60-75 menit

---

### **BLOCK 4: Users Page - Tambah Fitur** 🟡 PRIORITAS SEDANG
**File:** `frontend/src/app/(admin)/admin/users/page.tsx` dan `users/[id]/page.tsx`

**Tugas:**
1. Tambah button "Reset Password" dengan dialog input password baru
2. Tambah toggle/button "Suspend/Unsuspend" user
3. Tambah dropdown "Change Role" dengan semua role options
4. Tambah tab/section "Activity Logs" yang menampilkan `getUserActivity()`
5. Integrate semua dengan API yang sudah ada
6. Test semua fitur baru

**Estimasi:** 60-75 menit

---

### **BLOCK 5: Payment Monitoring Page** 🟡 PRIORITAS SEDANG
**File:** `frontend/src/app/(admin)/admin/payments/page.tsx` (BARU)

**Tugas:**
1. Buat halaman baru untuk payment monitoring
2. List semua payments dengan filter (status, method, date range, search)
3. Tampilkan payment statistics dashboard
4. Summary cards (total, paid, pending, by method, by status)
5. Table dengan pagination
6. Export functionality (optional)

**Estimasi:** 90-120 menit

---

### **BLOCK 6: Activity Logs Page** 🟡 PRIORITAS SEDANG
**File:** `frontend/src/app/(admin)/admin/activity-logs/page.tsx` (BARU)

**Tugas:**
1. Buat halaman baru untuk activity logs
2. List semua activity logs dengan filter (user, action, date range)
3. Table dengan pagination
4. Filter by user, action, date range
5. View user-specific activity logs
6. Export functionality (optional)

**Estimasi:** 60-75 menit

---

## 🚀 Urutan Pengerjaan

### Phase 1: Fix Mock Data (PRIORITAS TINGGI)
1. ✅ **BLOCK 1:** Organizers Page
2. ✅ **BLOCK 2:** Analytics Page
3. ✅ **BLOCK 3:** Settings Page

### Phase 2: Tambah Fitur (PRIORITAS SEDANG)
4. ✅ **BLOCK 4:** Users Page - Tambah Fitur
5. ✅ **BLOCK 5:** Payment Monitoring Page
6. ✅ **BLOCK 6:** Activity Logs Page

---

## 📝 Checklist Per Block

### Block 1: Organizers
- [ ] Update `fetchOrganizers()` dengan API
- [ ] Update `handleApprove()` dengan API
- [ ] Update `handleReject()` dengan dialog reason + API
- [ ] Tambah error handling
- [ ] Tambah success notification
- [ ] Test approve flow
- [ ] Test reject flow
- [ ] Test error cases

### Block 2: Analytics
- [ ] Update `fetchAnalytics()` dengan API
- [ ] Map API response ke struktur UI
- [ ] Handle date range filter
- [ ] Update chart data
- [ ] Tambah error handling
- [ ] Test dengan berbagai time range
- [ ] Test dengan data kosong

### Block 3: Settings
- [ ] Update `fetchSettings()` dengan API
- [ ] Map API response (JSON) ke struktur UI
- [ ] Update `handleSave()` dengan loop API calls
- [ ] Tambah error handling
- [ ] Tambah success notification
- [ ] Test save functionality
- [ ] Test dengan settings kosong

### Block 4: Users - Tambah Fitur
- [ ] Tambah reset password dialog
- [ ] Tambah suspend/unsuspend toggle
- [ ] Tambah change role dropdown
- [ ] Tambah activity logs tab
- [ ] Integrate semua dengan API
- [ ] Test semua fitur

### Block 5: Payment Monitoring
- [ ] Buat halaman baru
- [ ] List payments dengan filter
- [ ] Payment statistics dashboard
- [ ] Summary cards
- [ ] Table dengan pagination
- [ ] Test semua filter

### Block 6: Activity Logs
- [ ] Buat halaman baru
- [ ] List activity logs dengan filter
- [ ] Table dengan pagination
- [ ] Filter functionality
- [ ] Test semua filter

---

## 🎯 Success Criteria

### Block 1 (Organizers)
- ✅ Tidak ada mock data
- ✅ Approve/reject menggunakan API real
- ✅ Error handling lengkap
- ✅ Success notification muncul

### Block 2 (Analytics)
- ✅ Tidak ada mock data
- ✅ Semua chart menggunakan data real
- ✅ Date range filter berfungsi
- ✅ Error handling lengkap

### Block 3 (Settings)
- ✅ Tidak ada mock data
- ✅ Save menggunakan API real
- ✅ Settings tersimpan dengan benar
- ✅ Error handling lengkap

### Block 4 (Users)
- ✅ Reset password berfungsi
- ✅ Suspend/unsuspend berfungsi
- ✅ Change role berfungsi
- ✅ Activity logs ditampilkan

### Block 5 (Payments)
- ✅ Halaman payment monitoring ada
- ✅ List payments dengan filter
- ✅ Statistics ditampilkan
- ✅ Semua fitur berfungsi

### Block 6 (Activity Logs)
- ✅ Halaman activity logs ada
- ✅ List logs dengan filter
- ✅ Semua fitur berfungsi

---

## ⏱️ Estimasi Total Waktu

- **Phase 1 (Fix Mock Data):** ~2.5-3 jam
- **Phase 2 (Tambah Fitur):** ~3.5-4.5 jam
- **Total:** ~6-7.5 jam

---

## 🔧 Tools & Dependencies

**Sudah Tersedia:**
- ✅ ApiService dengan semua method yang diperlukan
- ✅ UI Components (Dialog, Button, Input, dll)
- ✅ Toast notification system
- ✅ Loading spinner
- ✅ Error handling utilities

**Perlu Ditambahkan (jika belum ada):**
- Dialog component untuk reject reason
- Dialog component untuk reset password

---

## 📚 Referensi

- Backend API: `backend/ADMIN_API_DOCUMENTATION.md`
- Frontend Integration Status: `FRONTEND_ADMIN_INTEGRATION_STATUS.md`
- Admin Pages Analysis: `ADMIN_PAGES_ANALYSIS.md`

---

**Plan Created:** 2024-12-19
**Status:** Ready to Start
**Next Step:** Begin with BLOCK 1 - Organizers Page

