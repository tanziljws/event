# 🔍 Payout Failure Diagnostics Guide

## Kenapa Payout Request Failed?

Berdasarkan analisis kode, berikut adalah kemungkinan penyebab payout request gagal:

---

## 🔴 Common Failure Reasons

### 1. **Xendit Client Not Initialized**
**Error Message**: `"Xendit client not initialized"`

**Penyebab**:
- Environment variable `XENDIT_SECRET_KEY` tidak di-set
- Xendit service gagal initialize

**Solusi**:
```bash
# Cek environment variable
echo $XENDIT_SECRET_KEY

# Atau di .env file
XENDIT_SECRET_KEY=your_secret_key_here
XENDIT_IS_PRODUCTION=false  # atau true untuk production
```

**Cek di Backend Logs**:
```
⚠️ Xendit secret key not found. Disbursement features will not work.
```

---

### 2. **Missing Required Fields**
**Error Message**: `"Missing required fields: amount, bankCode, accountHolderName, accountNumber"`

**Untuk Bank Account**:
- `bankCode` - Kode bank (BCA, BNI, BRI, dll)
- `accountHolderName` - Nama pemilik rekening
- `accountNumber` - Nomor rekening

**Untuk E-Wallet**:
- `eWalletType` - Tipe e-wallet (OVO, DANA, GOPAY, LINK_AJA)
- `phoneNumber` - Nomor telepon (disimpan di accountNumber)

**Solusi**:
- Pastikan payout account sudah lengkap datanya
- Cek di database: `payout_accounts` table
- Pastikan `bankCode` atau `eWalletType` sudah di-set

---

### 3. **Xendit API Error**
**Error Message**: Error dari Xendit API (bisa berbagai macam)

**Penyebab**:
- Invalid bank code
- Invalid account number format
- Account number tidak valid
- Network error ke Xendit
- Xendit API rate limit
- Invalid amount (terlalu kecil/besar)

**Cek di Backend Logs**:
```
❌ Error creating Xendit disbursement: [error details]
```

**Solusi**:
- Cek Xendit dashboard untuk error details
- Validasi format account number sesuai bank
- Pastikan network connection ke Xendit API
- Cek Xendit API documentation untuk validasi

---

### 4. **Insufficient Balance**
**Error Message**: `"Insufficient balance"`

**Penyebab**:
- Available balance kurang dari amount yang diminta
- Balance sudah di-lock untuk payout lain

**Solusi**:
- Cek available balance: `balance - pendingBalance`
- Tunggu payout lain selesai
- Request amount yang lebih kecil

---

### 5. **Payout Account Not Found**
**Error Message**: `"Payout account not found"`

**Penyebab**:
- Payout account ID tidak ada
- Payout account tidak belong ke organizer
- Payout account sudah dihapus

**Solusi**:
- Cek payout account masih ada di database
- Pastikan `organizerId` match dengan user yang request

---

## 🔍 How to Debug

### Step 1: Cek Backend Logs

Cari log dengan pattern:
```
💰 DISBURSEMENT SERVICE: Request payout started
❌ DISBURSEMENT SERVICE: [error message]
Error processing disbursement [id]: [error details]
```

**Contoh log yang bagus**:
```
💰 DISBURSEMENT SERVICE: Request payout started - Organizer: xxx, Account: yyy, Amount: 100000
💰 DISBURSEMENT SERVICE: Amount validated: 100000
✅ DISBURSEMENT SERVICE: Balance check passed
✅ DISBURSEMENT SERVICE: Payout account found: BANK_ACCOUNT - John Doe
✅ DISBURSEMENT SERVICE: Balance locked: 100000
Disbursement requested: [id] for organizer [id], amount: 100000
Processing disbursement [id] via Xendit...
❌ Error processing disbursement [id]: [error details]
```

### Step 2: Cek Database

**Cek disbursement record**:
```sql
SELECT 
  id,
  status,
  amount,
  failureReason,
  xenditId,
  xenditReference,
  metadata,
  requestedAt,
  processedAt
FROM disbursements
WHERE id = '[disbursement_id]'
ORDER BY requestedAt DESC;
```

**Cek payout account**:
```sql
SELECT 
  id,
  accountType,
  accountName,
  accountNumber,
  bankCode,
  eWalletType
FROM payout_accounts
WHERE id = '[payout_account_id]';
```

**Cek organizer balance**:
```sql
SELECT 
  balance,
  pendingBalance,
  availableBalance
FROM organizer_balances
WHERE organizerId = '[organizer_id]';
```

### Step 3: Cek Environment Variables

```bash
# Di backend server
echo $XENDIT_SECRET_KEY
echo $XENDIT_IS_PRODUCTION
```

Atau cek di `.env` file:
```env
XENDIT_SECRET_KEY=your_secret_key
XENDIT_IS_PRODUCTION=false
XENDIT_WEBHOOK_TOKEN=your_webhook_token
```

### Step 4: Test Xendit Connection

Buat test script untuk cek Xendit connection:

```javascript
// test-xendit.js
const { Xendit } = require('xendit-node');
require('dotenv').config();

const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY,
});

const Payout = xendit.Payout;

// Test get available banks (if API supports)
console.log('Testing Xendit connection...');
console.log('Secret key exists:', !!process.env.XENDIT_SECRET_KEY);
console.log('Payout client:', !!Payout);
```

---

## 📊 Failure Flow Diagram

```
Request Payout
    ↓
Validate Amount (min 50.000)
    ↓
Check Balance (hasSufficientBalance)
    ↓
Get Payout Account
    ↓
Lock Balance (add to pendingBalance)
    ↓
Create Disbursement Record (status: PENDING)
    ↓
Process Disbursement (async)
    ↓
Update Status to PROCESSING
    ↓
Call Xendit API
    ↓
❌ ERROR? → Update Status to FAILED
    ↓         ↓
    ↓      Unlock Balance
    ↓      Set failureReason
    ↓
✅ SUCCESS → Update with xenditId
    ↓
Wait for Webhook
    ↓
Webhook Updates Status (COMPLETED/FAILED)
```

---

## 🛠️ Common Fixes

### Fix 1: Xendit Not Initialized

**Problem**: `Xendit client not initialized`

**Fix**:
1. Set `XENDIT_SECRET_KEY` di environment
2. Restart backend server
3. Cek log: `Xendit service initialized`

### Fix 2: Missing Bank Code

**Problem**: `bankCode is required for BANK_ACCOUNT`

**Fix**:
1. Update payout account dengan bank code:
```sql
UPDATE payout_accounts
SET bankCode = 'BCA'  -- atau bank code lain
WHERE id = '[account_id]';
```

2. Atau via API: Update payout account dengan bank code

### Fix 3: Invalid Account Number

**Problem**: Xendit API error tentang account number

**Fix**:
1. Validasi format account number sesuai bank
2. Pastikan account number valid (tidak ada karakter khusus)
3. Cek di Xendit dashboard untuk error details

### Fix 4: Balance Already Locked

**Problem**: Balance tidak cukup karena sudah di-lock

**Fix**:
1. Cek pending disbursements:
```sql
SELECT * FROM disbursements
WHERE organizerId = '[organizer_id]'
AND status IN ('PENDING', 'PROCESSING')
ORDER BY requestedAt DESC;
```

2. Cancel atau tunggu disbursement selesai
3. Atau request amount yang lebih kecil

---

## 📝 Checklist untuk Debug

- [ ] Cek backend logs untuk error message
- [ ] Cek `XENDIT_SECRET_KEY` sudah di-set
- [ ] Cek payout account data lengkap (bankCode/eWalletType)
- [ ] Cek balance cukup (availableBalance >= amount)
- [ ] Cek disbursement record di database
- [ ] Cek Xendit dashboard untuk error details
- [ ] Test Xendit connection dengan test script
- [ ] Cek network connection ke Xendit API

---

## 🔗 Related Files

- **Service**: `backend/src/services/disbursementService.js`
- **Service**: `backend/src/services/xenditService.js`
- **Controller**: `backend/src/controllers/disbursementController.js`
- **Route**: `backend/src/routes/disbursements.js`
- **Service**: `backend/src/services/balanceService.js`

---

## 💡 Tips

1. **Selalu cek backend logs pertama** - error message biasanya jelas
2. **Cek database** - disbursement record punya `failureReason` field
3. **Test dengan amount kecil** - untuk memastikan flow berjalan
4. **Cek Xendit dashboard** - untuk melihat error dari Xendit side
5. **Monitor webhook** - pastikan webhook dari Xendit diterima

---

Jika masih gagal setelah cek semua di atas, share:
1. Error message dari backend logs
2. Disbursement record dari database
3. Payout account data
4. Environment variables (tanpa expose secret key)

