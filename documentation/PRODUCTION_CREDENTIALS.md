# 🔐 Production Railway - Credentials Semua Role

## 🌐 Production URL
- **Backend API**: `https://backend-nasa.up.railway.app/api`
- **Frontend**: (sesuai deployment frontend)
- **WebSocket**: `wss://backend-nasa.up.railway.app/ws`

---

## 👥 Credentials untuk Semua Role

### 🔴 SUPER_ADMIN (Super Administrator)

#### Account 1 (create_admin_users.js)
- **Email**: `superadmin@nusaevent.com`
- **Password**: `SuperAdmin123!`
- **Role**: `SUPER_ADMIN`
- **Status**: Email Verified, Approved
- **Akses**: Full access ke semua fitur admin

#### Account 2 (create_superadmin_organizer.js)
- **Email**: `superadmin@nusaevent.com`
- **Password**: `password123`
- **Role**: `SUPER_ADMIN`
- **Status**: Email Verified
- **Note**: Mungkin overwrite account 1 jika script ini dijalankan setelahnya

---

### 🟡 OPS_AGENT (Operations Agent)

#### Account 1
- **Email**: `operations@nusaevent.com`
- **Password**: `Operations123!`
- **Role**: `OPS_AGENT`
- **Status**: Email Verified, Approved
- **Akses**: Manage events, approve/reject organizers

---

### 🟢 ORGANIZER (Event Organizer)

#### Account 1 (create_admin_users.js)
- **Email**: `organizer@nusaevent.com`
- **Password**: `Organizer123!`
- **Role**: `ORGANIZER`
- **Organizer Type**: `INSTITUTION`
- **Status**: Email Verified, Approved

#### Account 2 (create_superadmin_organizer.js)
- **Email**: `organizer@nusaevent.com`
- **Password**: `password123`
- **Role**: `ORGANIZER`
- **Status**: Email Verified, Approved
- **Note**: Mungkin overwrite account 1 jika script ini dijalankan setelahnya

#### Account 3 (create_organizer_test.js)
- **Email**: `organizer@1test.com`
- **Password**: `Test123!`
- **Role**: `ORGANIZER`
- **Organizer Type**: `INDIVIDUAL`
- **Status**: Email Verified, Approved

#### Account 4 (create_test_users.js)
- **Email**: `organizer1@test.com`
- **Password**: `Password123!`
- **Role**: `ORGANIZER`
- **Organizer Type**: `COMMUNITY`
- **Status**: Email Verified, Approved

#### Account 5 (create_test_users.js)
- **Email**: `organizer2@test.com`
- **Password**: `Password123!`
- **Role**: `ORGANIZER`
- **Organizer Type**: `SMALL_BUSINESS`
- **Status**: Email Verified, Approved

---

### 🔵 PARTICIPANT (Regular User)

#### Account 1 (create_superadmin_organizer.js)
- **Email**: `user@nusaevent.com`
- **Password**: `password123`
- **Role**: `PARTICIPANT`
- **Status**: Email Verified, Approved

#### Account 2 (create_test_users.js)
- **Email**: `user1@test.com`
- **Password**: `Password123!`
- **Role**: `PARTICIPANT`
- **Status**: Email Verified, Approved

#### Account 3 (create_test_users.js)
- **Email**: `user2@test.com`
- **Password**: `Password123!`
- **Role**: `PARTICIPANT`
- **Status**: Email Verified, Approved

---

## 📋 Summary Table

| Role | Email | Password | Status | Notes |
|------|-------|----------|--------|-------|
| **SUPER_ADMIN** | `superadmin@nusaevent.com` | `SuperAdmin123!` | ✅ Verified, Approved | Primary admin account |
| **SUPER_ADMIN** | `superadmin@nusaevent.com` | `password123` | ✅ Verified | Alternative (mungkin overwrite) |
| **OPS_AGENT** | `operations@nusaevent.com` | `Operations123!` | ✅ Verified, Approved | Operations team |
| **ORGANIZER** | `organizer@nusaevent.com` | `Organizer123!` | ✅ Verified, Approved | Primary organizer |
| **ORGANIZER** | `organizer@nusaevent.com` | `password123` | ✅ Verified, Approved | Alternative (mungkin overwrite) |
| **ORGANIZER** | `organizer@1test.com` | `Test123!` | ✅ Verified, Approved | Test organizer |
| **ORGANIZER** | `organizer1@test.com` | `Password123!` | ✅ Verified, Approved | Test organizer 1 |
| **ORGANIZER** | `organizer2@test.com` | `Password123!` | ✅ Verified, Approved | Test organizer 2 |
| **PARTICIPANT** | `user@nusaevent.com` | `password123` | ✅ Verified, Approved | Primary participant |
| **PARTICIPANT** | `user1@test.com` | `Password123!` | ✅ Verified, Approved | Test participant 1 |
| **PARTICIPANT** | `user2@test.com` | `Password123!` | ✅ Verified, Approved | Test participant 2 |

---

## 🎯 Recommended Credentials untuk Testing

### Untuk Demo/Presentasi

#### 1. Super Admin
```
Email: superadmin@nusaevent.com
Password: SuperAdmin123!
```
**Akses**: Full admin dashboard, approve events, manage users

#### 2. Organizer
```
Email: organizer@nusaevent.com
Password: Organizer123!
```
**Akses**: Create events, manage events, wallet, payout

#### 3. Participant
```
Email: user@nusaevent.com
Password: password123
```
**Akses**: Browse events, register, view tickets, certificates

---

## 🔧 Cara Verifikasi Credentials di Production

### 1. Test Login via API

```bash
# Test Super Admin
curl -X POST https://backend-nasa.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@nusaevent.com",
    "password": "SuperAdmin123!"
  }'

# Test Organizer
curl -X POST https://backend-nasa.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organizer@nusaevent.com",
    "password": "Organizer123!"
  }'

# Test Participant
curl -X POST https://backend-nasa.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@nusaevent.com",
    "password": "password123"
  }'
```

### 2. Test Login via Frontend

1. Buka frontend URL
2. Klik "Login"
3. Masukkan email & password
4. Klik "Sign In"

---

## ⚠️ Important Notes

1. **Password Security**: 
   - Semua password di atas adalah untuk development/testing
   - Untuk production sebenarnya, sebaiknya ganti password yang lebih kuat
   - Jangan share credentials ini ke public

2. **Email Verification**:
   - Semua account sudah email verified
   - Tidak perlu verifikasi email lagi untuk login

3. **Account Duplication**:
   - Beberapa email mungkin duplicate (misal: `organizer@nusaevent.com` ada 2 password berbeda)
   - Ini karena beberapa script create user dijalankan
   - Gunakan password yang terakhir di-set

4. **Database**:
   - Credentials ini ada di database PostgreSQL Railway
   - Database: Railway managed PostgreSQL
   - Connection: via `DATABASE_URL` environment variable

---

## 🔄 Cara Reset Password (Jika Lupa)

### Via API (Admin Only)

```bash
# Admin reset password user
curl -X PATCH https://backend-nasa.up.railway.app/api/admin/users/{userId}/reset-password \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewPassword123!"
  }'
```

### Via Frontend

1. Klik "Forgot Password"
2. Masukkan email
3. Check email untuk reset link
4. Klik link & set password baru

---

## 📝 Script untuk Create User Baru

Jika perlu create user baru di production, gunakan script:

```bash
# Connect ke Railway database
cd backend
node create_admin_users.js
# atau
node create_test_users.js
# atau
node create_organizer_test.js
```

**Note**: Pastikan `DATABASE_URL` di `.env` mengarah ke Railway database.

---

## 🎯 Quick Reference

### Super Admin
- Email: `superadmin@nusaevent.com`
- Password: `SuperAdmin123!`

### Organizer
- Email: `organizer@nusaevent.com`
- Password: `Organizer123!`

### Participant
- Email: `user@nusaevent.com`
- Password: `password123`

---

**Last Updated**: November 2024  
**Environment**: Production Railway  
**Database**: PostgreSQL (Railway Managed)

