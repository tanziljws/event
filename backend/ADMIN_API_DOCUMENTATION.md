# 📋 Dokumentasi Lengkap Admin API Backend

## 🎯 Overview

Dokumentasi ini mencakup semua endpoint admin yang tersedia di sistem NusaEvent. Semua endpoint memerlukan autentikasi dan akses admin (SUPER_ADMIN, CS_HEAD, CS_AGENT, OPS_HEAD, OPS_AGENT, FINANCE_HEAD, FINANCE_AGENT).

**Base URL**: `/api/admin`

**Authentication**: Bearer Token (JWT)

---

## 📊 1. Dashboard & Analytics

### 1.1 Get Admin Dashboard
**GET** `/dashboard`

Mendapatkan statistik dashboard admin secara keseluruhan.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalEvents": 150,
      "publishedEvents": 120,
      "totalParticipants": 5000,
      "totalRegistrations": 8000,
      "totalRevenue": 50000000,
      "eventsThisMonth": 15,
      "eventsThisYear": 120,
      "upcomingEvents": 25,
      "recentRegistrations": 150,
      "topEvents": [...]
    }
  }
}
```

### 1.2 Get Department Dashboard
**GET** `/dashboard/:department`

Mendapatkan dashboard spesifik untuk department (CUSTOMER_SERVICE, OPERATIONS, FINANCE).

**Parameters:**
- `department` (path): Nama department

### 1.3 Get Analytics
**GET** `/analytics?year=2024&timeRange=year`

Mendapatkan data analitik platform.

**Query Parameters:**
- `year` (optional): Tahun (default: tahun saat ini)
- `timeRange` (optional): Rentang waktu

### 1.4 Get Monthly Analytics
**GET** `/dashboard/analytics/monthly?year=2024`

Mendapatkan data analitik bulanan.

---

## 👥 2. Manajemen User

### 2.1 Get All Users
**GET** `/users?page=1&limit=12&role=PARTICIPANT&search=john`

Mendapatkan daftar semua user dengan pagination dan filter.

**Query Parameters:**
- `page` (optional): Halaman (default: 1)
- `limit` (optional): Jumlah per halaman (default: 12)
- `role` (optional): Filter berdasarkan role
- `search` (optional): Pencarian nama/email
- `sortBy` (optional): Field untuk sorting (default: createdAt)
- `sortOrder` (optional): asc/desc (default: desc)

### 2.2 Get User Details
**GET** `/users/:id`

Mendapatkan detail user berdasarkan ID.

### 2.3 Update User
**PUT** `/users/:id`

Update informasi user.

**Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+6281234567890",
  "address": "Jakarta",
  "role": "PARTICIPANT",
  "isEmailVerified": true,
  "organizerType": "INDIVIDUAL",
  "businessName": "Business Name",
  "businessAddress": "Business Address",
  "businessPhone": "+6281234567890"
}
```

### 2.4 Delete User
**DELETE** `/users/:id`

Menghapus user dari sistem (hard delete).

**Note:** Tidak bisa menghapus akun sendiri.

### 2.5 Reset User Password
**POST** `/users/:id/reset-password`

Reset password user (admin override).

**Body:**
```json
{
  "newPassword": "NewPassword123!"
}
```

**Validation:** Password minimal 6 karakter.

### 2.6 Suspend/Unsuspend User
**PATCH** `/users/:id/suspend`

Menangguhkan atau mengaktifkan kembali akun user.

**Body:**
```json
{
  "isSuspended": true
}
```

**Note:** Tidak bisa suspend akun sendiri.

### 2.7 Change User Role
**PATCH** `/users/:id/role`

Mengubah role user.

**Body:**
```json
{
  "role": "ORGANIZER"
}
```

**Valid Roles:** SUPER_ADMIN, CS_HEAD, CS_AGENT, OPS_HEAD, OPS_AGENT, FINANCE_HEAD, FINANCE_AGENT, ORGANIZER, PARTICIPANT

**Note:** Tidak bisa mengubah role sendiri.

### 2.8 Get User Activity
**GET** `/users/:id/activity?limit=50`

Mendapatkan log aktivitas user tertentu.

---

## 🎫 3. Kontrol Event

### 3.1 Get All Events
**GET** `/events?page=1&limit=12&isPublished=true&search=workshop&location=Jakarta&eventDate=2024-01-01&sortBy=createdAt&sortOrder=desc`

Mendapatkan daftar semua event dengan filter dan pagination.

**Query Parameters:**
- `page` (optional): Halaman
- `limit` (optional): Jumlah per halaman
- `isPublished` (optional): Filter published (true/false)
- `search` (optional): Pencarian judul/deskripsi
- `location` (optional): Filter lokasi
- `eventDate` (optional): Filter tanggal event
- `sortBy` (optional): Field sorting
- `sortOrder` (optional): asc/desc

### 3.2 Create Event (Admin)
**POST** `/events`

Membuat event baru sebagai admin (auto-approved).

**Body:**
```json
{
  "title": "Workshop Technology",
  "eventDate": "2024-12-31T10:00:00Z",
  "eventTime": "10:00",
  "location": "Jakarta",
  "description": "Workshop description",
  "maxParticipants": 100,
  "registrationDeadline": "2024-12-30T23:59:59Z",
  "category": "TECHNOLOGY",
  "price": "50000",
  "isFree": false,
  "thumbnailUrl": "https://...",
  "galleryUrls": ["https://..."],
  "flyerUrl": "https://..."
}
```

### 3.3 Update Event
**PUT** `/events/:id`

Update detail event (admin override).

**Body:** (sama seperti create event)

### 3.4 Delete Event
**DELETE** `/events/:id`

Menghapus event dari sistem (hard delete).

---

## 🏢 4. Manajemen Organizer

### 4.1 Get All Organizers
**GET** `/organizers`

Mendapatkan daftar semua organizer.

### 4.2 Get Organizer Details
**GET** `/organizers/:id`

Mendapatkan detail organizer.

### 4.3 Approve Organizer
**PATCH** `/organizers/:id/approve`

Menyetujui verifikasi organizer.

### 4.4 Reject Organizer
**PATCH** `/organizers/:id/reject`

Menolak verifikasi organizer dengan alasan.

**Body:**
```json
{
  "reason": "Dokumen tidak lengkap"
}
```

---

## 👨‍💼 5. Manajemen Staff

### 5.1 Create Staff
**POST** `/create-staff`

Membuat akun staff baru (Super Admin only).

**Body:**
```json
{
  "fullName": "John Staff",
  "email": "staff@example.com",
  "phoneNumber": "+6281234567890",
  "address": "Jakarta",
  "lastEducation": "Bachelor",
  "role": "CS_AGENT",
  "department": "CUSTOMER_SERVICE",
  "userPosition": "AGENT",
  "managerId": "manager-uuid"
}
```

**Valid Departments:** CUSTOMER_SERVICE, OPERATIONS, FINANCE

**Valid Roles per Department:**
- CUSTOMER_SERVICE: CS_HEAD, CS_AGENT
- OPERATIONS: OPS_HEAD, OPS_AGENT
- FINANCE: FINANCE_HEAD, FINANCE_AGENT

### 5.2 Get Staff Details
**GET** `/staff/:id`

Mendapatkan detail staff.

### 5.3 Update Staff
**PUT** `/staff/:id`

Update informasi staff.

**Body:** (sama seperti create staff)

### 5.4 Delete Staff
**DELETE** `/staff/:id`

Menghapus staff dari department (reset ke PARTICIPANT).

---

## 💳 6. Monitoring Transaksi & Payment

### 6.1 Get All Payments
**GET** `/payments?page=1&limit=20&status=PAID&paymentMethod=BANK_TRANSFER&startDate=2024-01-01&endDate=2024-12-31&search=john`

Mendapatkan daftar semua payment dengan filter.

**Query Parameters:**
- `page` (optional): Halaman
- `limit` (optional): Jumlah per halaman
- `status` (optional): PENDING, PAID, FAILED, EXPIRED, REFUNDED
- `paymentMethod` (optional): BANK_TRANSFER, E_WALLET, CREDIT_CARD, QR_CODE, CASH, CRYPTO, GATEWAY
- `startDate` (optional): Filter tanggal mulai
- `endDate` (optional): Filter tanggal akhir
- `search` (optional): Pencarian reference/email/nama

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "pagination": {...},
    "summary": {
      "totalAmount": 100000000,
      "paidAmount": 80000000,
      "pendingAmount": 20000000,
      "totalCount": 500,
      "paidCount": 400,
      "pendingCount": 100
    }
  }
}
```

### 6.2 Get Payment Statistics
**GET** `/payments/stats?startDate=2024-01-01&endDate=2024-12-31`

Mendapatkan statistik payment.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 500,
      "totalAmount": 100000000,
      "paid": 400,
      "paidAmount": 80000000,
      "pending": 100,
      "pendingAmount": 20000000,
      "failed": 0,
      "failedAmount": 0,
      "byMethod": {
        "BANK_TRANSFER": { "count": 200, "amount": 40000000 },
        "E_WALLET": { "count": 200, "amount": 40000000 }
      },
      "byStatus": {
        "PAID": { "count": 400, "amount": 80000000 },
        "PENDING": { "count": 100, "amount": 20000000 }
      }
    }
  }
}
```

---

## 📝 7. Activity Logs & Audit

### 7.1 Get Activity Logs
**GET** `/activity-logs?page=1&limit=50&userId=user-id&action=LOGIN&startDate=2024-01-01&endDate=2024-12-31&sortBy=createdAt&sortOrder=desc`

Mendapatkan log aktivitas semua user.

**Query Parameters:**
- `page` (optional): Halaman
- `limit` (optional): Jumlah per halaman
- `userId` (optional): Filter user tertentu
- `action` (optional): Filter aksi
- `startDate` (optional): Filter tanggal mulai
- `endDate` (optional): Filter tanggal akhir
- `sortBy` (optional): Field sorting
- `sortOrder` (optional): asc/desc

### 7.2 Get User Activity
**GET** `/users/:id/activity?limit=50`

Mendapatkan log aktivitas user tertentu.

**Note:** Untuk audit logs lengkap, gunakan endpoint `/api/audit/logs` (memerlukan OPS_HEAD atau SUPER_ADMIN).

---

## ⚙️ 8. Pengaturan Sistem

### 8.1 Get System Settings
**GET** `/settings`

Mendapatkan semua pengaturan sistem.

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": [
      {
        "id": "uuid",
        "key": "payment_config",
        "value": {...},
        "description": "Payment gateway configuration",
        "updatedBy": "admin-uuid",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

### 8.2 Update System Setting
**PUT** `/settings/:key`

Update atau create pengaturan sistem.

**Body:**
```json
{
  "value": {
    "midtrans_enabled": true,
    "duitku_enabled": false
  },
  "description": "Payment gateway configuration"
}
```

**Common Settings Keys:**
- `payment_config`: Konfigurasi payment gateway
- `email_config`: Konfigurasi email
- `event_categories`: Kategori event
- `platform_fee`: Platform fee percentage
- `notification_config`: Konfigurasi notifikasi

---

## 🔒 9. Security & Authorization

### 9.1 Required Roles

Semua endpoint admin memerlukan salah satu role berikut:
- `SUPER_ADMIN`: Akses penuh
- `CS_HEAD`, `CS_AGENT`: Customer Service
- `OPS_HEAD`, `OPS_AGENT`: Operations
- `FINANCE_HEAD`, `FINANCE_AGENT`: Finance

### 9.2 Middleware

- `authenticate`: Memverifikasi JWT token
- `requireAdmin`: Memverifikasi role admin

### 9.3 Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "messageId": "auth.unauthorized",
  "statusCode": 401
}
```

**404 Not Found (Security):**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "NOT_FOUND"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to...",
  "error": "INTERNAL_SERVER_ERROR"
}
```

---

## 📊 10. Summary Endpoint

| Kategori | Endpoint | Method | Deskripsi |
|----------|----------|--------|-----------|
| Dashboard | `/dashboard` | GET | Statistik dashboard |
| Dashboard | `/dashboard/:department` | GET | Dashboard department |
| Analytics | `/analytics` | GET | Data analitik |
| Analytics | `/dashboard/analytics/monthly` | GET | Analitik bulanan |
| User | `/users` | GET | Daftar user |
| User | `/users/:id` | GET | Detail user |
| User | `/users/:id` | PUT | Update user |
| User | `/users/:id` | DELETE | Hapus user |
| User | `/users/:id/reset-password` | POST | Reset password |
| User | `/users/:id/suspend` | PATCH | Suspend/unsuspend |
| User | `/users/:id/role` | PATCH | Ubah role |
| User | `/users/:id/activity` | GET | Aktivitas user |
| Event | `/events` | GET | Daftar event |
| Event | `/events` | POST | Buat event |
| Event | `/events/:id` | PUT | Update event |
| Event | `/events/:id` | DELETE | Hapus event |
| Organizer | `/organizers` | GET | Daftar organizer |
| Organizer | `/organizers/:id` | GET | Detail organizer |
| Organizer | `/organizers/:id/approve` | PATCH | Approve organizer |
| Organizer | `/organizers/:id/reject` | PATCH | Reject organizer |
| Staff | `/create-staff` | POST | Buat staff |
| Staff | `/staff/:id` | GET | Detail staff |
| Staff | `/staff/:id` | PUT | Update staff |
| Staff | `/staff/:id` | DELETE | Hapus staff |
| Payment | `/payments` | GET | Daftar payment |
| Payment | `/payments/stats` | GET | Statistik payment |
| Activity | `/activity-logs` | GET | Log aktivitas |
| Settings | `/settings` | GET | Pengaturan sistem |
| Settings | `/settings/:key` | PUT | Update pengaturan |

---

## ✅ Checklist Fitur Admin

### ✅ Manajemen User
- [x] Buat, hapus, edit account organizer dan super admin lain
- [x] Reset password
- [x] Suspend akun
- [x] Ubah role

### ✅ Kontrol Event
- [x] Lihat semua event
- [x] Modifikasi event
- [x] Hapus event bermasalah

### ✅ Monitoring & Laporan
- [x] Statistik seluruh platform
- [x] Pantau transaksi/payment
- [x] Pantau peserta
- [x] Pantau aktivitas user

### ✅ Pengaturan Sistem
- [x] Konfigurasi setting platform
- [x] Maintenance data (via settings)

### ✅ Keamanan & Audit
- [x] Log aktivitas semua user
- [x] Intervensi masalah (suspend, delete, reject)

---

## 🚀 Testing

Semua endpoint dapat diuji menggunakan:
- Postman
- cURL
- Frontend admin panel

**Example cURL:**
```bash
curl -X GET "http://localhost:5000/api/admin/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

**Last Updated:** 2024-12-19
**Version:** 1.0.0

