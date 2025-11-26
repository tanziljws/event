# 💰 Wallet System Guide untuk Organizer

## 📋 Akses Organizer

### Halaman yang Bisa Diakses:
1. **Dashboard** (`/organizer`) - Overview events, stats
2. **My Events** (`/organizer/events`) - List semua event yang dibuat
3. **Create Event** (`/organizer/events/create`) - Buat event baru
4. **Analytics** (`/organizer/analytics`) - Analytics per event
5. **Attendance** (`/organizer/attendance`) - Manage attendance
6. **Wallet** (`/organizer/wallet`) - ⭐ **NEW!** Wallet management

### Wallet Features:
- **Wallet Dashboard** - Lihat balance, total earned, total withdrawn
- **Payout Accounts** - Manage bank/e-wallet accounts untuk payout
- **Withdraw** - Request payout ke akun bank/e-wallet
- **Transactions** - History semua transaksi balance

---

## 🔄 Cara Kerja Sistem

### 1. **Earning Balance (Otomatis)**
```
Customer Bayar Event → Payment PAID → Auto Calculate Revenue → Auto Update Balance
```

**Detail:**
- Platform fee: 15% (untuk organizer)
- Organizer revenue: 85% dari payment
- Balance otomatis bertambah setelah payment sukses
- Tidak perlu action manual dari organizer

### 2. **Withdraw Process**
```
Organizer Request Payout → Lock Balance → Process via Xendit → Update Status → Debit Balance
```

**Steps:**
1. Organizer buka `/organizer/wallet/withdraw`
2. Pilih payout account (bank/e-wallet)
3. Masukkan amount (min: Rp 50.000)
4. Submit request
5. System lock balance (pendingBalance)
6. System call Xendit API untuk process payout
7. Xendit process ke bank/e-wallet organizer
8. Webhook dari Xendit update status
9. Balance di-debit setelah completed

### 3. **Payout Accounts**
- Organizer bisa add multiple accounts (bank atau e-wallet)
- Set 1 account sebagai default
- Account harus verified (optional, bisa manual verify)
- Account digunakan untuk receive payout

---

## 🚀 Quick Start untuk Organizer

### Step 1: Cek Balance
1. Login sebagai organizer
2. Buka `/organizer/wallet`
3. Lihat available balance

### Step 2: Add Payout Account (Pertama Kali)
1. Buka `/organizer/wallet/payout-accounts`
2. Klik "Add Account"
3. Pilih type: Bank Account atau E-Wallet
4. Isi data:
   - **Bank Account**: Bank, Account Name, Account Number
   - **E-Wallet**: E-Wallet Type (OVO/DANA/GOPAY/LINK_AJA), Phone Number
5. Save

### Step 3: Request Payout
1. Buka `/organizer/wallet/withdraw`
2. Pilih payout account
3. Masukkan amount (min: Rp 50.000)
4. Submit
5. Tunggu processing (1-3 business days)

### Step 4: Cek Status
1. Buka `/organizer/wallet/transactions`
2. Lihat history semua transaksi
3. Filter by type, date range

---

## ⚠️ Important Notes

### Minimum Payout
- **Rp 50.000** - Minimum amount untuk request payout

### Balance Types
- **Available Balance** = Balance - Pending Balance
- **Pending Balance** = Amount yang sedang diproses payout
- **Total Earned** = Total semua revenue yang pernah diterima
- **Total Withdrawn** = Total semua payout yang pernah dilakukan

### Processing Time
- Payout diproses dalam **1-3 business days**
- Status update via Xendit webhook
- Organizer akan dapat notification saat completed

### Fees
- Platform fee: **15%** dari payment (otomatis)
- Xendit fee: Check dengan Xendit (biasanya ada fee per transaction)

---

## 🔍 Troubleshooting

### Q: Balance masih 0 padahal sudah ada payment sukses?
**A:** 
- Cek apakah payment status sudah `PAID`
- Cek apakah event sudah published
- Balance auto-update setelah payment PAID via webhook atau manual sync

### Q: Tidak bisa request payout?
**A:**
- Pastikan available balance >= Rp 50.000
- Pastikan sudah ada payout account
- Pastikan payout account sudah verified (jika required)

### Q: Payout stuck di PENDING?
**A:**
- Check Xendit dashboard untuk status
- Check webhook dari Xendit
- Contact admin jika perlu manual intervention

---

## 📊 Example Flow

### Scenario: Event dengan 10 peserta, harga Rp 100.000

1. **10 peserta bayar** → Total payment: Rp 1.000.000
2. **Platform fee (15%)** → Rp 150.000
3. **Organizer revenue (85%)** → Rp 850.000
4. **Balance organizer** → +Rp 850.000
5. **Organizer request payout** → Rp 500.000
6. **Pending balance** → +Rp 500.000
7. **Available balance** → Rp 350.000
8. **Payout completed** → Balance: Rp 350.000, Total Withdrawn: +Rp 500.000

---

## 🎯 Next Steps

1. **Test dengan event real** - Buat event, dapat payment, cek balance update
2. **Add payout account** - Tambah bank/e-wallet account
3. **Request payout** - Test withdraw flow
4. **Monitor transactions** - Cek history semua transaksi

