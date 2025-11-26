# 🎯 Rencana Implementasi Sistem Payment & Payout

## 📊 Analisa Alur Payment Saat Ini

### Flow Payment Saat Ini:
```
1. Customer → Register Event → createPaymentOrder()
   ↓
2. Payment Record Created (status: PENDING)
   ↓
3. Customer → Bayar via Midtrans
   ↓
4. Midtrans → Webhook → handleWebhook()
   ↓
5. Payment Status Updated → PAID
   ↓
6. createEventRegistration() → registerForEventAfterPayment()
   ↓
7. EventRegistration Created
   ↓
8. ❌ Revenue Calculation: MANUAL (via API endpoint)
   ❌ Balance Update: TIDAK ADA
   ❌ Payout: TIDAK ADA
```

### Masalah yang Ditemukan:

1. **Revenue Calculation Manual**
   - `calculateEventRevenue()` hanya dipanggil via API endpoint `/events/:eventId/revenue` (admin only)
   - TIDAK otomatis dipanggil setelah payment sukses
   - OrganizerRevenue record dibuat manual, bukan otomatis

2. **Tidak Ada Balance System**
   - Tidak ada model `OrganizerBalance`
   - Saldo EO tidak tersimpan di database
   - Tidak ada history transaksi balance

3. **Tidak Ada Payout System**
   - Tidak ada model `PayoutAccount` (akun bank/e-wallet)
   - Tidak ada model `Disbursement` (request payout)
   - Tidak ada integrasi Xendit

---

## 🎯 Alur Payment yang Diinginkan

### Flow Baru:
```
1. Customer → Register Event → createPaymentOrder()
   ↓
2. Payment Record Created (status: PENDING)
   ↓
3. Customer → Bayar via Midtrans
   ↓
4. Midtrans → Webhook → handleWebhook()
   ↓
5. Payment Status Updated → PAID
   ↓
6. createEventRegistration() → registerForEventAfterPayment()
   ↓
7. EventRegistration Created
   ↓
8. ✅ AUTO: Calculate Revenue & Update Balance
   - Calculate platformFee (15%) dan organizerAmount (85%)
   - Create/Update OrganizerRevenue record
   - Update OrganizerBalance (balance += organizerAmount)
   - Create BalanceTransaction (CREDIT)
   ↓
9. EO → Request Payout (dari dashboard)
   ↓
10. ✅ Create Disbursement Request
    - Validate balance cukup
    - Create Disbursement record (status: PENDING)
    ↓
11. ✅ Call Xendit Disbursement API
    - Payout ke akun EO (bank/e-wallet)
    ↓
12. ✅ Xendit Webhook → Update Status
    - Update Disbursement status (COMPLETED/FAILED)
    - Update OrganizerBalance (balance -= amount)
    - Create BalanceTransaction (DEBIT)
```

---

## 📋 Database Schema yang Perlu Dibuat

### 1. OrganizerBalance
```prisma
model OrganizerBalance {
  id              String   @id @default(uuid())
  organizerId     String   @unique @map("organizer_id")
  balance         Decimal  @default(0) @db.Decimal(12, 2)  // Saldo saat ini
  pendingBalance  Decimal  @default(0) @db.Decimal(12, 2)  // Saldo yang sedang diproses payout
  totalEarned     Decimal  @default(0) @db.Decimal(12, 2)  // Total yang pernah diterima
  totalWithdrawn  Decimal  @default(0) @db.Decimal(12, 2)  // Total yang pernah dicairkan
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  organizer       User     @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  transactions    BalanceTransaction[]
  disbursements   Disbursement[]
  
  @@index([organizerId])
  @@map("organizer_balance")
}
```

### 2. BalanceTransaction
```prisma
model BalanceTransaction {
  id            String            @id @default(uuid())
  organizerId   String            @map("organizer_id")
  type          TransactionType
  amount        Decimal           @db.Decimal(12, 2)
  balanceBefore Decimal           @db.Decimal(12, 2) @map("balance_before")
  balanceAfter  Decimal           @db.Decimal(12, 2) @map("balance_after")
  referenceType String?           @map("reference_type")  // "ORGANIZER_REVENUE", "DISBURSEMENT", "ADJUSTMENT"
  referenceId   String?           @map("reference_id")    // ID dari OrganizerRevenue atau Disbursement
  description   String
  metadata      Json?
  createdAt     DateTime          @default(now()) @map("created_at")
  
  organizer     User              @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  
  @@index([organizerId])
  @@index([type])
  @@index([createdAt])
  @@map("balance_transactions")
}

enum TransactionType {
  CREDIT    // Dari revenue (payment sukses)
  DEBIT     // Dari payout (disbursement)
  ADJUSTMENT // Manual adjustment (admin)
  
  @@map("transaction_type")
}
```

### 3. PayoutAccount
```prisma
model PayoutAccount {
  id            String        @id @default(uuid())
  organizerId   String        @map("organizer_id")
  accountType   AccountType
  accountName   String        @map("account_name")
  accountNumber String        @map("account_number")
  bankCode      String?       @map("bank_code")      // Untuk bank account (BCA, BNI, dll)
  eWalletType   String?       @map("e_wallet_type")  // OVO, DANA, GOPAY, LINK_AJA
  isVerified    Boolean       @default(false) @map("is_verified")
  isDefault     Boolean       @default(false) @map("is_default")
  verifiedAt    DateTime?     @map("verified_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  
  organizer     User          @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  disbursements Disbursement[]
  
  @@index([organizerId])
  @@index([isDefault])
  @@map("payout_accounts")
}

enum AccountType {
  BANK_ACCOUNT
  E_WALLET
  
  @@map("account_type")
}
```

### 4. Disbursement
```prisma
model Disbursement {
  id              String              @id @default(uuid())
  organizerId     String              @map("organizer_id")
  payoutAccountId String              @map("payout_account_id")
  amount          Decimal             @db.Decimal(12, 2)
  status          DisbursementStatus  @default(PENDING)
  xenditId        String?             @map("xendit_id")        // ID dari Xendit
  xenditReference String?             @map("xendit_reference") // Reference dari Xendit
  failureReason   String?             @map("failure_reason")
  requestedAt     DateTime            @default(now()) @map("requested_at")
  processedAt     DateTime?           @map("processed_at")
  completedAt     DateTime?           @map("completed_at")
  metadata        Json?
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")
  
  organizer       User                @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  payoutAccount   PayoutAccount       @relation(fields: [payoutAccountId], references: [id])
  
  @@index([organizerId])
  @@index([status])
  @@index([xenditId])
  @@map("disbursements")
}

enum DisbursementStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  
  @@map("disbursement_status")
}
```

### 5. Update User Model
```prisma
model User {
  // ... existing fields ...
  organizerBalance    OrganizerBalance?
  balanceTransactions BalanceTransaction[]
  payoutAccounts      PayoutAccount[]
  disbursements       Disbursement[]
  // ... existing relations ...
}
```

---

## 🔧 Service yang Perlu Dibuat

### 1. balanceService.js
```javascript
class BalanceService {
  // Get organizer balance
  async getBalance(organizerId)
  
  // Update balance (credit/debit)
  async updateBalance(organizerId, amount, type, referenceType, referenceId, description)
  
  // Add credit from revenue
  async addRevenueCredit(organizerId, organizerRevenueId, amount, description)
  
  // Add debit from disbursement
  async addDisbursementDebit(organizerId, disbursementId, amount, description)
  
  // Get balance history
  async getBalanceHistory(organizerId, options)
  
  // Check if balance sufficient
  async hasSufficientBalance(organizerId, amount)
}
```

### 2. xenditService.js
```javascript
class XenditService {
  // Initialize Xendit client
  constructor()
  
  // Create disbursement
  async createDisbursement(disbursementData)
  
  // Get disbursement status
  async getDisbursementStatus(xenditId)
  
  // Handle webhook from Xendit
  async handleWebhook(webhookData)
  
  // Validate webhook signature
  async validateWebhookSignature(webhookData, signature)
}
```

### 3. disbursementService.js
```javascript
class DisbursementService {
  // Request payout
  async requestPayout(organizerId, payoutAccountId, amount)
  
  // Process disbursement (call Xendit)
  async processDisbursement(disbursementId)
  
  // Get disbursement history
  async getDisbursementHistory(organizerId, options)
  
  // Cancel disbursement
  async cancelDisbursement(disbursementId)
}
```

### 4. payoutAccountService.js
```javascript
class PayoutAccountService {
  // Create payout account
  async createAccount(organizerId, accountData)
  
  // Get organizer accounts
  async getAccounts(organizerId)
  
  // Update account
  async updateAccount(accountId, organizerId, accountData)
  
  // Delete account
  async deleteAccount(accountId, organizerId)
  
  // Set default account
  async setDefaultAccount(accountId, organizerId)
  
  // Verify account (optional)
  async verifyAccount(accountId)
}
```

---

## 🔄 Update Service yang Ada

### 1. paymentService.js
**Update `handleWebhook()` dan `createEventRegistration()`:**
```javascript
// Setelah payment PAID dan registration created
// Tambahkan:
const balanceService = require('./balanceService');
const eventService = require('./eventService');

// Calculate revenue
const revenue = await eventService.calculateEventRevenue(eventId);

// Update balance
await balanceService.addRevenueCredit(
  event.createdBy,
  revenue.organizerRevenueId,
  revenue.organizerAmount,
  `Revenue from event: ${event.title}`
);
```

### 2. eventService.js
**Update `registerForEventAfterPayment()`:**
```javascript
// Setelah registration created
// Tambahkan auto-calculate revenue dan update balance
const revenue = await calculateEventRevenue(eventId);
// Balance update sudah di handle di paymentService
```

**Update `calculateEventRevenue()`:**
```javascript
// Setelah create/update OrganizerRevenue
// Return organizerRevenueId untuk balance transaction
return {
  totalRevenue,
  platformFee: platformFeeTotal,
  organizerRevenue,
  feePercentage: event.platformFee,
  organizerRevenueId: organizerRevenueRecord.id  // NEW
};
```

---

## 📡 API Routes yang Perlu Dibuat

### 1. /api/balance
- `GET /` - Get organizer balance
- `GET /history` - Get balance transaction history
- `GET /stats` - Get balance statistics

### 2. /api/payout-accounts
- `GET /` - Get organizer payout accounts
- `POST /` - Create payout account
- `PUT /:id` - Update payout account
- `DELETE /:id` - Delete payout account
- `PATCH /:id/set-default` - Set default account
- `PATCH /:id/verify` - Verify account (optional)

### 3. /api/disbursements
- `GET /` - Get disbursement history
- `POST /request` - Request payout
- `GET /:id` - Get disbursement details
- `POST /:id/cancel` - Cancel disbursement
- `POST /webhook` - Xendit webhook handler

---

## 🎨 Frontend Pages yang Perlu Dibuat

### 1. /organizer/wallet
- Dashboard balance
- Total balance, pending balance
- Recent transactions
- Quick actions (request payout)

### 2. /organizer/wallet/payout-accounts
- List payout accounts
- Add new account (bank/e-wallet)
- Edit/Delete account
- Set default account

### 3. /organizer/wallet/withdraw
- Form request payout
- Select payout account
- Enter amount
- Validation (min amount, sufficient balance)
- History disbursement

### 4. /organizer/wallet/transactions
- List all balance transactions
- Filter by type (credit/debit)
- Filter by date
- Export to CSV

---

## 📦 Dependencies yang Perlu Diinstall

```bash
cd backend
npm install xendit-node
```

---

## 🚀 Implementasi Step-by-Step

### Phase 1: Database Schema ✅
1. Update `schema.prisma` dengan 4 model baru
2. Generate migration
3. Run migration

### Phase 2: Balance Service ✅
1. Create `balanceService.js`
2. Implement semua methods
3. Test dengan manual call

### Phase 3: Update Payment Flow ✅
1. Update `paymentService.js` - auto-update balance setelah payment sukses
2. Update `eventService.js` - return organizerRevenueId
3. Test flow lengkap

### Phase 4: Xendit Integration ✅
1. Install Xendit SDK
2. Create `xenditService.js`
3. Implement disbursement methods
4. Test dengan Xendit sandbox

### Phase 5: Payout Account Management ✅
1. Create `payoutAccountService.js`
2. Create routes `/api/payout-accounts`
3. Create controllers
4. Test CRUD operations

### Phase 6: Disbursement Service ✅
1. Create `disbursementService.js`
2. Create routes `/api/disbursements`
3. Create controllers
4. Integrate dengan Xendit
5. Test payout flow

### Phase 7: Frontend ✅
1. Create wallet dashboard page
2. Create payout accounts page
3. Create withdraw page
4. Create transactions page
5. Integrate dengan API

### Phase 8: Testing & Polish ✅
1. Test end-to-end flow
2. Test edge cases
3. Error handling
4. UI/UX improvements

---

## ⚠️ Catatan Penting

1. **Balance Update**: Harus atomic (transaction) untuk prevent race condition
2. **Xendit Webhook**: Perlu endpoint untuk handle status update dari Xendit
3. **Minimum Payout**: Set minimum amount untuk payout (misal: 50.000)
4. **Payout Fee**: Xendit charge fee, perlu diinformasikan ke EO
5. **Balance Lock**: Saat request payout, lock balance (pendingBalance)
6. **Error Handling**: Handle Xendit API errors dengan baik
7. **Logging**: Log semua balance transactions dan disbursements

---

## 🔐 Security Considerations

1. **Authorization**: Pastikan hanya organizer yang bisa akses balance mereka sendiri
2. **Validation**: Validate payout amount (min, max, sufficient balance)
3. **Webhook Security**: Verify Xendit webhook signature
4. **Rate Limiting**: Limit payout request frequency
5. **Audit Trail**: Log semua balance changes dan payout requests

---

## 📊 Testing Checklist

- [ ] Payment sukses → Balance otomatis bertambah
- [ ] Revenue calculation benar (platform fee 15%)
- [ ] Balance transaction created dengan benar
- [ ] Request payout → Balance berkurang
- [ ] Xendit disbursement berhasil
- [ ] Xendit webhook update status
- [ ] Error handling (insufficient balance, Xendit error, dll)
- [ ] Multiple concurrent payments
- [ ] Multiple concurrent payout requests

