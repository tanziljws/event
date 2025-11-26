# 📚 Dokumentasi Teknis - Sistem Manajemen Event

## 🎯 Overview Aplikasi

**Nusa Event Management System** adalah platform komprehensif untuk manajemen event yang menghubungkan **Organizer** (penyelenggara event) dengan **Participant** (peserta event). Sistem ini terdiri dari 3 aplikasi utama:

1. **Backend API** (Node.js/Express)
2. **Frontend Web** (Next.js/React)
3. **Mobile App** (Flutter)

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Web Browser │  │  Mobile App   │  │  Admin Panel │    │
│  │  (Next.js)   │  │  (Flutter)    │  │  (Next.js)   │    │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘    │
│         │                 │                   │            │
└─────────┼─────────────────┼───────────────────┼────────────┘
          │                 │                   │
          │         HTTPS/REST API              │
          │         WebSocket (Real-time)       │
          │                                     │
┌─────────▼─────────────────────────────────────▼────────────┐
│                    API GATEWAY LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Express.js Backend (Node.js)                 │  │
│  │  • Authentication & Authorization                     │  │
│  │  • Rate Limiting & Security                           │  │
│  │  • Request Validation                                 │  │
│  │  • Error Handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Event Service│  │Payment Service│  │Email Service │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Wallet Service│  │Cert Service   │  │Notif Service │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
└─────────┬───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │    Redis     │  │   File Store │    │
│  │  (Database)  │  │   (Cache)    │  │   (Uploads)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Xendit     │  │   Midtrans    │  │    Brevo     │    │
│  │ (Payout)     │  │  (Payment)    │  │   (Email)    │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Teknologi yang Digunakan

### Backend (API Server)

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Node.js** | 20+ | Runtime environment |
| **Express.js** | 4.18+ | Web framework |
| **PostgreSQL** | 13+ | Relational database |
| **Prisma ORM** | 5.22+ | Database ORM & migrations |
| **Redis** | 6+ | Caching & session storage |
| **JWT** | 9.0+ | Authentication tokens |
| **WebSocket (ws)** | 8.18+ | Real-time communication |
| **Xendit SDK** | 7.0+ | Payout/disbursement API |
| **Midtrans SDK** | 1.4+ | Payment gateway |
| **Brevo SDK** | 3.0+ | Email service |
| **Winston** | 3.11+ | Logging |
| **Helmet** | 7.1+ | Security headers |
| **Multer** | 1.4+ | File upload handling |

### Frontend (Web Application)

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 14.2+ | React framework (SSR/SSG) |
| **React** | 18.3+ | UI library |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3.3+ | Styling |
| **Axios** | 1.6+ | HTTP client |
| **React Query** | 5.8+ | Data fetching & caching |
| **Zustand** | 4.4+ | State management |
| **React Hook Form** | 7.48+ | Form handling |
| **Zod** | 3.22+ | Schema validation |

### Mobile App

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Flutter** | 3.0+ | Cross-platform framework |
| **Dart** | 3.0+ | Programming language |
| **Dio** | 5.3+ | HTTP client |
| **BLoC** | 8.1+ | State management |
| **Shared Preferences** | 2.2+ | Local storage |
| **WebSocket Channel** | 2.4+ | Real-time updates |
| **QR Flutter** | 4.1+ | QR code generation |
| **Mobile Scanner** | 5.0+ | QR code scanning |

---

## 🔄 Flow Aplikasi

### 1. Authentication Flow

```
User Registration
    ↓
Email Verification (OTP via Brevo)
    ↓
Login (Email + Password)
    ↓
JWT Token Generated
    ├── Access Token (15 min expiry)
    └── Refresh Token (7 days, HTTP-only cookie)
    ↓
Token digunakan untuk setiap API request
    ↓
Auto-refresh jika access token expired
```

**Teknologi:**
- **JWT** untuk token generation
- **bcryptjs** untuk password hashing
- **Brevo API** untuk email OTP
- **HTTP-only cookies** untuk refresh token security

### 2. Event Creation Flow (Organizer)

```
Organizer Login
    ↓
Create Event Form
    ├── Event Details (title, date, location)
    ├── Upload Flyer/Thumbnail
    ├── Set Ticket Types & Pricing
    └── Configure Certificate Template
    ↓
Submit for Approval
    ↓
Status: DRAFT → UNDER_REVIEW
    ↓
Admin/Agent Review
    ├── Approve → Status: APPROVED
    └── Reject → Status: REJECTED (with reason)
    ↓
Organizer Publishes
    ↓
Status: PUBLISHED → Available to Public
```

**Database Tables:**
- `events` - Event data
- `ticket_types` - Ticket configurations
- `certificate_templates` - Certificate design
- `audit_logs` - Approval history

### 3. Event Registration Flow (Participant)

```
Participant Browse Events
    ↓
Select Event & Ticket Type
    ↓
Fill Registration Form
    ↓
Payment Process
    ├── Calculate Total (Ticket Price + Platform Fee)
    ├── Create Payment via Midtrans
    └── Redirect to Payment Gateway
    ↓
Payment Webhook (Midtrans)
    ├── Payment Success → Status: PAID
    └── Payment Failed → Status: FAILED
    ↓
Registration Confirmed
    ├── Generate QR Code Ticket
    ├── Send Confirmation Email
    └── Create Event Registration Record
```

**Database Tables:**
- `event_registrations` - Registration records
- `payments` - Payment transactions
- `tickets` - QR code tickets
- `notifications` - Email notifications

### 4. Payment Flow

```
User Initiates Payment
    ↓
Backend Creates Payment Record
    ├── Calculate Amount
    ├── Generate Payment Reference
    └── Status: PENDING
    ↓
Call Midtrans API
    ├── Create Snap Token
    └── Get Payment URL
    ↓
User Redirected to Midtrans
    ├── Select Payment Method
    └── Complete Payment
    ↓
Midtrans Webhook
    ├── Verify Signature
    ├── Update Payment Status
    └── Update Registration Status
    ↓
Backend Processes Webhook
    ├── Update Payment: PENDING → PAID
    ├── Generate Ticket & QR Code
    ├── Send Confirmation Email
    └── Update Organizer Balance
```

**Payment Gateways:**
- **Midtrans** - Primary payment gateway (Credit Card, Bank Transfer, E-Wallet)
- **Duitku** - Alternative payment gateway (optional)

**Database Tables:**
- `payments` - Payment records
- `balance_transactions` - Wallet transactions
- `organizer_balance` - Organizer wallet balance

### 5. Wallet & Payout Flow (Organizer)

```
Event Registration Completed
    ↓
Payment Received
    ↓
Calculate Revenue Split
    ├── Total Revenue (from ticket sales)
    ├── Platform Fee (5-10%)
    └── Organizer Revenue (90-95%)
    ↓
Credit to Organizer Balance
    ├── Update organizer_balance.balance
    └── Create balance_transaction (CREDIT)
    ↓
Organizer Requests Payout
    ├── Select Payout Account
    ├── Enter Amount
    └── Calculate Fees (Base Fee + PPN)
    ↓
Create Disbursement Request
    ├── Status: PENDING
    ├── Lock Balance
    └── Call Xendit API
    ↓
Xendit Processes Payout
    ├── Status: PROCESSING
    └── Transfer to Bank/E-Wallet
    ↓
Xendit Webhook
    ├── Success → Status: COMPLETED
    └── Failed → Status: FAILED (unlock balance)
    ↓
Update Organizer Balance
    └── Create balance_transaction (DEBIT)
```

**Payout Service:**
- **Xendit** - Disbursement API untuk transfer ke bank/e-wallet

**Database Tables:**
- `organizer_balance` - Current balance
- `balance_transactions` - Transaction history
- `payout_accounts` - Bank/e-wallet accounts
- `disbursements` - Payout requests

### 6. Certificate Generation Flow

```
Event Completed
    ↓
Organizer Marks Attendance
    ├── Scan QR Code Ticket
    └── Verify Registration
    ↓
Mark Registration as Attended
    ├── hasAttended: true
    └── attendanceTime: now()
    ↓
Generate Certificate
    ├── Load Certificate Template
    ├── Fill Participant Data
    ├── Generate PDF (PDFKit)
    └── Upload to Storage
    ↓
Create Certificate Record
    ├── certificate_url
    └── certificate_number
    ↓
Send Email Notification
    └── Certificate Ready Email
```

**Technologies:**
- **PDFKit** - PDF generation
- **Puppeteer** - HTML to PDF (alternative)
- **Sharp** - Image processing

**Database Tables:**
- `certificates` - Certificate records
- `certificate_templates` - Template designs

---

## 🗄️ Database Schema (Key Tables)

### Core Tables

#### `users`
- **Purpose**: User accounts (Organizers, Participants, Admins)
- **Key Fields**:
  - `id` (UUID)
  - `email` (unique)
  - `role` (SUPER_ADMIN, ORGANIZER, PARTICIPANT, CS_AGENT, etc.)
  - `verificationStatus` (PENDING, APPROVED, REJECTED)
  - `password` (hashed with bcrypt)

#### `events`
- **Purpose**: Event information
- **Key Fields**:
  - `id` (UUID)
  - `title`, `eventDate`, `location`
  - `status` (DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, etc.)
  - `createdBy` (organizer ID)
  - `approvedBy` (admin ID)

#### `event_registrations`
- **Purpose**: Participant registrations
- **Key Fields**:
  - `id` (UUID)
  - `eventId`, `participantId`
  - `registrationToken` (unique)
  - `hasAttended` (boolean)
  - `status` (ACTIVE, CANCELLED, REFUNDED)

#### `payments`
- **Purpose**: Payment transactions
- **Key Fields**:
  - `id` (UUID)
  - `registrationId`, `eventId`, `userId`
  - `amount`, `currency`
  - `paymentMethod` (BANK_TRANSFER, E_WALLET, CREDIT_CARD, etc.)
  - `paymentStatus` (PENDING, PAID, FAILED, EXPIRED)
  - `paymentReference` (Midtrans order ID)

#### `organizer_balance`
- **Purpose**: Organizer wallet balance
- **Key Fields**:
  - `organizerId` (unique)
  - `balance` (available balance)
  - `pendingBalance` (locked for payout)
  - `totalEarned`, `totalWithdrawn`

#### `balance_transactions`
- **Purpose**: Wallet transaction history
- **Key Fields**:
  - `organizerId`
  - `type` (CREDIT, DEBIT, ADJUSTMENT)
  - `amount`, `balanceBefore`, `balanceAfter`
  - `referenceType`, `referenceId` (links to payment/disbursement)

#### `disbursements`
- **Purpose**: Payout requests
- **Key Fields**:
  - `id` (UUID)
  - `organizerId`, `payoutAccountId`
  - `amount`, `status` (PENDING, PROCESSING, COMPLETED, FAILED)
  - `xenditId`, `xenditReference`

---

## 🔐 Security Features

### 1. Authentication & Authorization

- **JWT Tokens**: Access token (15 min) + Refresh token (7 days)
- **HTTP-only Cookies**: Refresh token stored securely
- **Token Versioning**: Invalidate tokens on password change
- **Role-Based Access Control (RBAC)**: 8 user roles with different permissions

### 2. API Security

- **Helmet.js**: Security headers (XSS, CSRF protection)
- **CORS**: Whitelist origins
- **Rate Limiting**: Prevent brute force attacks
- **Request Size Limiting**: Prevent DoS attacks
- **Input Validation**: Joi & express-validator
- **XSS Protection**: DOMPurify for sanitization

### 3. Data Security

- **Password Hashing**: bcryptjs (salt rounds: 10)
- **SQL Injection Prevention**: Prisma ORM (parameterized queries)
- **Sensitive Data**: Environment variables (never in code)
- **HTTPS**: Enforced in production

### 4. Payment Security

- **Webhook Signature Verification**: Midtrans & Xendit
- **Payment Reference Validation**: Unique order IDs
- **Idempotency**: Prevent duplicate payments

---

## 🔌 Integrasi Third-Party Services

### 1. Xendit (Payout/Disbursement)

**Purpose**: Transfer uang dari platform ke organizer

**API Endpoints Used:**
- `POST /disbursements` - Create payout
- `GET /disbursements/{id}` - Check status
- Webhook: Status updates

**Flow:**
```
Backend → Xendit API → Bank/E-Wallet → Organizer Account
```

**Fees:**
- Base fee: Rp 5,000 per transaction
- PPN: 11% dari base fee
- Total: Rp 5,550 per payout

### 2. Midtrans (Payment Gateway)

**Purpose**: Payment processing untuk event registration

**API Endpoints Used:**
- `POST /v2/charge` - Create payment
- `GET /v2/{order_id}/status` - Check status
- Webhook: Payment notifications

**Payment Methods:**
- Credit Card
- Bank Transfer (VA)
- E-Wallet (GoPay, OVO, DANA)
- QR Code (QRIS)

### 3. Brevo (Email Service)

**Purpose**: Email notifications

**Features:**
- Email verification (OTP)
- Password reset
- Event registration confirmation
- Payment notifications
- Certificate ready notifications
- Payout notifications

**Templates:**
- Handlebars (.hbs) templates
- Dynamic content injection

### 4. WebSocket (Real-time Updates)

**Purpose**: Real-time notifications & updates

**Connection:**
```
wss://backend-nasa.up.railway.app/ws?token={JWT_TOKEN}
```

**Events:**
- `connection` - Connection established
- `notification` - New notification
- `payment_update` - Payment status change
- `payout_update` - Payout status change

---

## 📱 Mobile App Architecture

### State Management (BLoC Pattern)

```
UI Layer (Flutter Widgets)
    ↓
BLoC (Business Logic Component)
    ├── Events (User Actions)
    └── States (UI States)
    ↓
Repository Layer
    ├── API Calls (Dio)
    └── Local Storage (Shared Preferences)
    ↓
Data Sources
    ├── Remote (Backend API)
    └── Local (Cache)
```

### Key Features

1. **Authentication**
   - JWT token storage (Secure Storage)
   - Auto-refresh tokens
   - Biometric login (optional)

2. **Event Browsing**
   - List events with filters
   - Event details
   - Registration

3. **QR Code**
   - Generate ticket QR
   - Scan for attendance
   - Mobile Scanner integration

4. **Real-time Updates**
   - WebSocket connection
   - Push notifications (Firebase - optional)

---

## 🚀 Deployment Architecture

### Production Environment (Railway)

```
┌─────────────────────────────────────────┐
│         Railway Platform                 │
├─────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend     │   │
│  │  (Next.js)     │  │  (Express)   │   │
│  │  Port: 3001    │  │  Port: 3000  │   │
│  └───────┬───────┘  └───────┬──────┘   │
│          │                  │           │
│          └──────────┬───────┘           │
│                     │                   │
│          ┌──────────▼──────────┐       │
│          │   PostgreSQL DB      │       │
│          │   (Railway Managed)   │       │
│          └──────────────────────┘       │
└─────────────────────────────────────────┘
```

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
XENDIT_SECRET_KEY=...
MIDTRANS_SERVER_KEY=...
BREVO_API_KEY=...
NODE_ENV=production
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://backend-nasa.up.railway.app/api
```

**Mobile App:**
- Hardcoded API URL: `https://backend-nasa.up.railway.app/api`
- WebSocket URL: `wss://backend-nasa.up.railway.app/ws`

---

## 📊 Performance Optimizations

### Backend

1. **Lazy Loading Routes**: Routes loaded on-demand
2. **Connection Pooling**: Prisma connection pool
3. **Redis Caching**: Cache frequently accessed data
4. **Compression**: Gzip compression for responses
5. **Deferred Initialization**: Heavy services load after server starts

### Frontend

1. **Next.js SSR/SSG**: Server-side rendering for SEO
2. **Code Splitting**: Automatic route-based splitting
3. **Image Optimization**: Next.js Image component
4. **React Query**: Data caching & refetching
5. **Lazy Loading**: Dynamic imports for heavy components

### Database

1. **Indexes**: Optimized queries with indexes
2. **Pagination**: Limit results per page
3. **Selective Fields**: Only fetch needed columns

---

## 🔍 Monitoring & Logging

### Backend Logging (Winston)

- **Log Levels**: error, warn, info, debug
- **Log Files**: `logs/error.log`, `logs/combined.log`
- **Request Logging**: Morgan middleware

### Error Tracking (Production)

- **Sentry**: Error monitoring & tracking
- **Error Notifications**: Real-time alerts

### Metrics (Prometheus)

- **Endpoint**: `/metrics`
- **Metrics**: HTTP request duration, error rates

---

## 🧪 Testing

### Backend Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Frontend Tests
```bash
npm test              # Run tests
npm run type-check    # TypeScript validation
```

---

## 📝 API Documentation

### Base URL
```
Production: https://backend-nasa.up.railway.app/api
Development: http://localhost:3000/api
```

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc..."
  }
}
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/events` | GET | List events |
| `/api/events/:id` | GET | Event details |
| `/api/events/:id/register` | POST | Register to event |
| `/api/payments/create` | POST | Create payment |
| `/api/payments/webhook` | POST | Payment webhook |
| `/api/balance` | GET | Get wallet balance |
| `/api/disbursements` | POST | Request payout |
| `/api/certificates/:id` | GET | Download certificate |

---

## 🎓 Summary untuk Penguji

### Cara Aplikasi Bekerja:

1. **User Registration & Login**
   - User register → Email verification (OTP) → Login → JWT token

2. **Event Management**
   - Organizer buat event → Admin approve → Publish → Public bisa lihat

3. **Event Registration**
   - Participant pilih event → Bayar via Midtrans → Dapat QR ticket → Scan untuk attendance

4. **Payment Processing**
   - Payment via Midtrans → Webhook update status → Generate ticket → Update organizer balance

5. **Wallet & Payout**
   - Organizer dapat revenue → Request payout → Xendit transfer → Uang masuk ke bank/e-wallet

6. **Certificate Generation**
   - Event selesai → Scan QR → Mark attendance → Generate certificate → Email notification

### Teknologi Utama:

- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Frontend**: Next.js + React + TypeScript
- **Mobile**: Flutter + Dart
- **Payment**: Midtrans (payment), Xendit (payout)
- **Email**: Brevo
- **Real-time**: WebSocket

### Keamanan:

- JWT authentication
- HTTPS encryption
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

---

**Dokumentasi ini menjelaskan arsitektur, teknologi, dan flow aplikasi secara lengkap untuk keperluan pengujian dan evaluasi.**

