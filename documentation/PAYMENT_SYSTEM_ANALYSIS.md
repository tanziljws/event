# 📊 Analisis Sistem Payment Saat Ini

## ✅ Yang SUDAH ADA

### 1. Payment Flow (Customer → Platform)
- ✅ **Midtrans Integration**: Customer bayar melalui Midtrans Snap
- ✅ **Payment Model**: Tersimpan di database dengan status (PENDING, PAID, FAILED, EXPIRED, REFUNDED)
- ✅ **Payment Service**: `paymentService.js` menangani pembuatan payment order
- ✅ **Webhook Handler**: Update payment status dari Midtrans
- ✅ **Registration After Payment**: Auto-create registration setelah payment sukses

### 2. Revenue Calculation
- ✅ **Perhitungan Bagi Hasil**: 
  - Platform fee: 15% untuk organizer (default)
  - Organizer revenue: Total - Platform fee
- ✅ **OrganizerRevenue Model**: 
  - Tracking revenue per event
  - Fields: `totalRevenue`, `platformFee`, `organizerAmount`, `feePercentage`
  - Status: `settlementStatus` (PENDING, PROCESSING, COMPLETED, FAILED)
- ✅ **calculateEventRevenue()**: Function untuk menghitung revenue setelah payment sukses
- ✅ **API Endpoint**: `/organizers/:organizerId/revenue` untuk melihat revenue

### 3. Database Schema
```prisma
model OrganizerRevenue {
  id               String           @id @default(uuid())
  organizerId      String
  eventId          String
  totalRevenue     Decimal
  platformFee      Decimal
  organizerAmount  Decimal          // Jumlah yang harus dibayar ke EO
  feePercentage    Decimal
  settlementStatus SettlementStatus @default(PENDING)
  settledAt        DateTime?
  // ...
}
```

---

## ❌ Yang BELUM ADA

### 1. Saldo EO (Balance/Wallet)
- ❌ **Model OrganizerBalance**: Belum ada model untuk menyimpan saldo EO
- ❌ **Auto-update Balance**: Saat payment sukses, saldo EO tidak otomatis bertambah
- ❌ **Balance History**: Tidak ada tracking perubahan saldo

**Yang Perlu Dibuat:**
```prisma
model OrganizerBalance {
  id            String   @id @default(uuid())
  organizerId   String   @unique
  balance       Decimal  @default(0)  // Saldo saat ini
  pendingBalance Decimal @default(0)  // Saldo yang sedang diproses
  totalEarned   Decimal  @default(0)  // Total yang pernah diterima
  totalWithdrawn Decimal @default(0)  // Total yang pernah dicairkan
  // ...
}

model BalanceTransaction {
  id            String   @id @default(uuid())
  organizerId   String
  type          TransactionType  // CREDIT (dari revenue), DEBIT (payout), ADJUSTMENT
  amount        Decimal
  balanceBefore Decimal
  balanceAfter  Decimal
  referenceId   String?  // ID dari OrganizerRevenue atau Disbursement
  description   String
  // ...
}
```

### 2. Akun Payout EO (E-Wallet/Rekening)
- ❌ **Model PayoutAccount**: Belum ada model untuk menyimpan akun payout
- ❌ **Form Tambah Akun**: EO belum bisa tambah akun e-wallet/rekening
- ❌ **Verifikasi Akun**: Belum ada sistem verifikasi akun

**Yang Perlu Dibuat:**
```prisma
model PayoutAccount {
  id            String   @id @default(uuid())
  organizerId   String
  accountType   AccountType  // BANK_ACCOUNT, E_WALLET
  accountName   String
  accountNumber String
  bankCode      String?  // Untuk bank account
  eWalletType   String?  // OVO, DANA, GOPAY, LINK_AJA
  isVerified    Boolean  @default(false)
  isDefault     Boolean  @default(false)
  verifiedAt    DateTime?
  // ...
}
```

### 3. Sistem Payout/Disbursement
- ❌ **Model Disbursement**: Belum ada model untuk request payout
- ❌ **Request Payout**: EO belum bisa request pencairan saldo
- ❌ **Xendit Integration**: Belum ada integrasi dengan Xendit Disbursement API
- ❌ **Auto Payout**: Belum ada sistem payout otomatis

**Yang Perlu Dibuat:**
```prisma
model Disbursement {
  id              String   @id @default(uuid())
  organizerId     String
  payoutAccountId String
  amount          Decimal
  status          DisbursementStatus  // PENDING, PROCESSING, COMPLETED, FAILED
  xenditId        String?  // ID dari Xendit
  failureReason   String?
  requestedAt     DateTime @default(now())
  processedAt     DateTime?
  completedAt     DateTime?
  // ...
}
```

### 4. Auto-Update Balance Saat Payment
- ❌ **Trigger Balance Update**: Saat payment sukses, saldo EO tidak otomatis bertambah
- ❌ **Link ke OrganizerRevenue**: Balance transaction belum terhubung dengan OrganizerRevenue

---

## 🔄 Alur Payment Saat Ini

```
1. Customer → Register Event
2. Customer → Bayar via Midtrans
3. Midtrans → Webhook → Update Payment Status (PAID)
4. System → Create Registration
5. System → Calculate Revenue (calculateEventRevenue)
6. System → Create OrganizerRevenue Record
   - totalRevenue: 100.000
   - platformFee: 15.000 (15%)
   - organizerAmount: 85.000
   - settlementStatus: PENDING
```

**Masalah:** 
- Saldo EO tidak otomatis bertambah
- EO tidak bisa request payout
- Tidak ada integrasi Xendit

---

## 🎯 Alur Payment yang Diinginkan

```
1. Customer → Register Event
2. Customer → Bayar via Midtrans (ke akun platform)
3. Midtrans → Webhook → Update Payment Status (PAID)
4. System → Create Registration
5. System → Calculate Revenue
6. System → Create OrganizerRevenue Record
7. System → Auto-Update OrganizerBalance
   - balance += organizerAmount
   - Create BalanceTransaction (CREDIT)
8. EO → Request Payout (dari dashboard)
9. System → Create Disbursement Request
10. System → Call Xendit Disbursement API
11. Xendit → Payout ke akun EO (bank/e-wallet)
12. System → Update Disbursement Status
13. System → Update OrganizerBalance
    - balance -= amount
    - Create BalanceTransaction (DEBIT)
```

---

## 📋 Checklist Implementasi

### Phase 1: Database Schema
- [ ] Buat model `OrganizerBalance`
- [ ] Buat model `BalanceTransaction`
- [ ] Buat model `PayoutAccount`
- [ ] Buat model `Disbursement`
- [ ] Migration database

### Phase 2: Balance Management
- [ ] Service untuk update balance saat payment sukses
- [ ] Service untuk get balance organizer
- [ ] API endpoint untuk get balance
- [ ] Auto-update balance di payment webhook

### Phase 3: Payout Account Management
- [ ] Form tambah akun payout (bank/e-wallet)
- [ ] API untuk CRUD payout account
- [ ] Verifikasi akun (optional)
- [ ] Set default account

### Phase 4: Xendit Integration
- [ ] Install Xendit SDK
- [ ] Setup Xendit service
- [ ] Create disbursement function
- [ ] Handle webhook dari Xendit

### Phase 5: Payout Request
- [ ] Form request payout (dari dashboard EO)
- [ ] Validasi saldo cukup
- [ ] Create disbursement request
- [ ] Call Xendit API
- [ ] Update status

### Phase 6: Frontend
- [ ] Halaman Balance/Wallet di dashboard EO
- [ ] Form tambah akun payout
- [ ] Form request payout
- [ ] History transaksi balance
- [ ] History disbursement

---

## 🔧 File yang Perlu Dibuat/Diupdate

### Backend
1. **Schema**: `backend/prisma/schema.prisma`
   - Tambah model OrganizerBalance, BalanceTransaction, PayoutAccount, Disbursement

2. **Service**: 
   - `backend/src/services/balanceService.js` (baru)
   - `backend/src/services/disbursementService.js` (baru)
   - `backend/src/services/xenditService.js` (baru)
   - Update `backend/src/services/paymentService.js` (tambah auto-update balance)

3. **Routes**:
   - `backend/src/routes/balance.js` (baru)
   - `backend/src/routes/payout-accounts.js` (baru)
   - `backend/src/routes/disbursements.js` (baru)

4. **Controller**:
   - `backend/src/controllers/balanceController.js` (baru)
   - `backend/src/controllers/disbursementController.js` (baru)

### Frontend
1. **Pages**:
   - `frontend/src/app/(organizer)/organizer/wallet/page.tsx` (baru)
   - `frontend/src/app/(organizer)/organizer/wallet/payout-accounts/page.tsx` (baru)
   - `frontend/src/app/(organizer)/organizer/wallet/withdraw/page.tsx` (baru)

2. **API**:
   - Update `frontend/src/lib/api.ts` (tambah API methods)

---

## 📝 Catatan Penting

1. **Midtrans**: Digunakan untuk menerima pembayaran dari customer (ke akun platform)
2. **Xendit**: Digunakan untuk payout ke EO (dari platform ke akun EO)
3. **Balance**: Disimpan di database, bukan dari Midtrans
4. **Settlement Status**: Di OrganizerRevenue hanya tracking, tidak otomatis payout
5. **Auto Payout**: Bisa dibuat otomatis atau manual (request dari EO)

---

## 🚀 Next Steps

1. Buat database schema untuk balance, payout account, dan disbursement
2. Buat service untuk balance management
3. Update payment service untuk auto-update balance
4. Integrasi Xendit Disbursement API
5. Buat UI untuk EO manage balance dan request payout

