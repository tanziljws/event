# 🎤 Quick Reference - Presentasi Teknis untuk Penguji

## 🎯 1. Apa Aplikasi Ini?

**Nusa Event Management System** - Platform untuk:
- **Organizer**: Buat, kelola, dan monetize event
- **Participant**: Cari, daftar, dan ikuti event
- **Admin**: Approve event, kelola user, monitor platform

**3 Aplikasi:**
1. **Web App** (Next.js) - untuk organizer & admin
2. **Mobile App** (Flutter) - untuk participant
3. **Backend API** (Node.js) - server & database

---

## 🏗️ 2. Arsitektur (Simple)

```
User (Browser/Mobile)
    ↓
API Backend (Node.js + Express)
    ├── Authentication (JWT)
    ├── Business Logic
    └── Database (PostgreSQL)
    ↓
External Services
    ├── Midtrans (Payment)
    ├── Xendit (Payout)
    └── Brevo (Email)
```

---

## 🛠️ 3. Teknologi Utama

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Prisma** - ORM (database access)
- **JWT** - Authentication
- **WebSocket** - Real-time updates

### Frontend Web
- **Next.js** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Mobile
- **Flutter** - Cross-platform
- **Dart** - Programming language

### External
- **Midtrans** - Payment gateway
- **Xendit** - Payout/disbursement
- **Brevo** - Email service

---

## 🔄 4. Flow Utama (Cara Kerja)

### A. User Registration & Login

```
1. User register → Input email, password
2. Sistem kirim OTP ke email (via Brevo)
3. User verifikasi OTP
4. User login → Dapat JWT token
5. Token digunakan untuk setiap request
```

**Teknologi:**
- JWT untuk token
- Brevo untuk email OTP
- bcrypt untuk hash password

---

### B. Organizer Buat Event

```
1. Organizer login
2. Buat event → Input detail, upload flyer
3. Set ticket types & harga
4. Submit untuk approval
5. Admin/Agent review
   ├── Approve → Event bisa dipublish
   └── Reject → Kembali ke organizer (dengan alasan)
6. Organizer publish → Event muncul di public
```

**Database:**
- `events` table - simpan data event
- `ticket_types` table - simpan jenis tiket
- `audit_logs` table - simpan history approval

---

### C. Participant Daftar Event

```
1. Participant browse event (public page)
2. Pilih event & ticket type
3. Isi form registrasi
4. Proses pembayaran
   ├── Hitung total (harga + platform fee)
   ├── Panggil Midtrans API
   └── Redirect ke payment gateway
5. User bayar di Midtrans
6. Midtrans kirim webhook ke backend
7. Backend update status → Generate QR ticket
8. Kirim email konfirmasi
```

**Payment Flow:**
```
User → Backend → Midtrans → Payment Gateway → Webhook → Backend → Update DB
```

**Database:**
- `event_registrations` - data registrasi
- `payments` - data pembayaran
- `tickets` - QR code ticket

---

### D. Payment Processing

```
1. User klik "Bayar"
2. Backend hitung total:
   - Ticket price: Rp 100,000
   - Platform fee (5%): Rp 5,000
   - Total: Rp 105,000
3. Backend panggil Midtrans API
   - Create payment token
   - Dapat payment URL
4. User redirect ke Midtrans
5. User pilih metode pembayaran (Bank/EWallet/Card)
6. User bayar
7. Midtrans kirim webhook ke backend
8. Backend:
   - Verify signature
   - Update payment status: PENDING → PAID
   - Generate QR ticket
   - Update organizer balance
   - Kirim email konfirmasi
```

**Payment Methods:**
- Credit Card
- Bank Transfer (Virtual Account)
- E-Wallet (GoPay, OVO, DANA)
- QR Code (QRIS)

---

### E. Wallet & Payout (Organizer)

```
1. Event selesai, payment masuk
2. Sistem hitung revenue split:
   - Total revenue: Rp 1,000,000
   - Platform fee (5%): Rp 50,000
   - Organizer revenue: Rp 950,000
3. Credit ke organizer balance
4. Organizer request payout:
   - Pilih rekening bank/e-wallet
   - Masukkan jumlah
   - Sistem hitung fee:
     * Base fee: Rp 5,000
     * PPN (11%): Rp 550
     * Total fee: Rp 5,550
5. Backend panggil Xendit API
6. Xendit transfer ke bank/e-wallet
7. Xendit kirim webhook → Update status
8. Organizer terima uang
```

**Payout Flow:**
```
Organizer → Backend → Xendit → Bank/E-Wallet → Organizer Account
```

**Database:**
- `organizer_balance` - saldo organizer
- `balance_transactions` - history transaksi
- `disbursements` - data payout

---

### F. Certificate Generation

```
1. Event selesai
2. Organizer scan QR ticket untuk attendance
3. Sistem mark registration sebagai "attended"
4. Sistem generate certificate:
   - Load template
   - Isi data participant
   - Generate PDF
   - Upload ke storage
5. Sistem kirim email: "Certificate ready"
6. Participant download certificate
```

**Teknologi:**
- PDFKit untuk generate PDF
- Template system untuk desain certificate

---

## 🔐 5. Security

### Authentication
- **JWT Token**: Access token (15 min) + Refresh token (7 days)
- **HTTP-only Cookies**: Refresh token aman
- **Password Hashing**: bcrypt (salt rounds: 10)

### API Security
- **Rate Limiting**: Prevent brute force
- **CORS**: Whitelist origins
- **Helmet**: Security headers
- **Input Validation**: Prevent injection attacks

### Payment Security
- **Webhook Signature**: Verify dari Midtrans/Xendit
- **Idempotency**: Prevent duplicate payments

---

## 💾 6. Database (Key Tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (organizer, participant, admin) |
| `events` | Event data |
| `event_registrations` | Participant registrations |
| `payments` | Payment transactions |
| `organizer_balance` | Organizer wallet balance |
| `balance_transactions` | Wallet transaction history |
| `disbursements` | Payout requests |
| `tickets` | QR code tickets |
| `certificates` | Generated certificates |

**Total**: ~30+ tables

---

## 🔌 7. Integrasi External Services

### Midtrans (Payment)
- **Fungsi**: Payment gateway
- **Methods**: Credit Card, Bank Transfer, E-Wallet, QR Code
- **Flow**: User bayar → Midtrans → Webhook → Backend update

### Xendit (Payout)
- **Fungsi**: Transfer uang ke organizer
- **Flow**: Backend → Xendit → Bank/E-Wallet → Organizer
- **Fee**: Rp 5,000 + PPN (11%) = Rp 5,550 per transaksi

### Brevo (Email)
- **Fungsi**: Email notifications
- **Types**: OTP, confirmation, payment, certificate, payout

### WebSocket
- **Fungsi**: Real-time updates
- **Events**: Notifications, payment updates, payout updates

---

## 📱 8. Mobile App

### Features
- Browse events
- Register to events
- QR code ticket
- Scan QR for attendance
- Real-time notifications (WebSocket)

### Architecture
- **BLoC Pattern**: State management
- **Dio**: HTTP client
- **Shared Preferences**: Local storage

---

## 🚀 9. Deployment

### Production (Railway)
- **Backend**: `https://backend-nasa.up.railway.app`
- **Frontend**: Deployed via Railway
- **Database**: PostgreSQL (Railway managed)
- **Environment**: Production config

### Development
- **Backend**: `http://localhost:3000`
- **Frontend**: `http://localhost:3001`
- **Database**: Local PostgreSQL

---

## 📊 10. Performance

### Optimizations
- **Lazy Loading**: Routes loaded on-demand
- **Caching**: Redis untuk cache data
- **Connection Pooling**: Database connections
- **Compression**: Gzip untuk responses
- **Code Splitting**: Frontend bundle optimization

---

## 🎓 Quick Answers untuk Pertanyaan Penguji

### Q: "Aplikasi ini pakai teknologi apa?"
**A:** 
- Backend: Node.js + Express + PostgreSQL
- Frontend: Next.js + React + TypeScript
- Mobile: Flutter
- Payment: Midtrans
- Payout: Xendit
- Email: Brevo

### Q: "Cara payment bekerja?"
**A:**
1. User pilih event & bayar
2. Backend panggil Midtrans API
3. User redirect ke Midtrans payment page
4. User bayar (Bank/EWallet/Card)
5. Midtrans kirim webhook ke backend
6. Backend update status & generate ticket

### Q: "Cara payout bekerja?"
**A:**
1. Organizer dapat revenue dari event
2. Revenue masuk ke wallet balance
3. Organizer request payout
4. Backend panggil Xendit API
5. Xendit transfer ke bank/e-wallet
6. Organizer terima uang

### Q: "Security-nya bagaimana?"
**A:**
- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- HTTPS encryption
- Webhook signature verification

### Q: "Database-nya apa?"
**A:**
- PostgreSQL (relational database)
- ~30+ tables
- Prisma ORM untuk akses database
- Indexes untuk optimasi query

### Q: "Real-time updates bagaimana?"
**A:**
- WebSocket connection
- Real-time notifications
- Payment status updates
- Payout status updates

### Q: "Mobile app bisa apa?"
**A:**
- Browse events
- Register to events
- QR code ticket
- Scan QR for attendance
- Real-time notifications

---

## 📝 Presentasi Tips

1. **Mulai dengan Overview**: Jelaskan apa aplikasi ini
2. **Arsitektur**: Gambar simple architecture
3. **Flow Utama**: Jelaskan 6 flow utama
4. **Demo**: Tunjukkan aplikasi berjalan
5. **Q&A**: Siapkan jawaban untuk pertanyaan umum

---

**File ini adalah quick reference untuk presentasi. Detail lengkap ada di `TECHNICAL_DOCUMENTATION.md`**

