# 🎤 Panduan File untuk Presentasi - Tunjuk File Spesifik

## 📍 File-file Penting yang Bisa Ditunjuk

### 🎯 1. Entry Point - Server Start

**File:** `backend/src/app.js`

**Apa yang ada di sini:**
- Setup Express server
- Registrasi semua routes
- Middleware configuration
- Server start

**Tunjukin ke penguji:**
```javascript
// Line 203-206: Registrasi routes
app.use('/api/events', lazyRoute('./routes/events'));
app.use('/api/payments', lazyRoute('./routes/payments'));
app.use('/api/auth', lazyRoute('./routes/auth'));
```

**Jelaskan:**
"Ini adalah entry point server. Semua route diregistrasi di sini. Misalnya `/api/events` akan handle semua request ke endpoint events."

---

### 🎯 2. Route Definition - URL Endpoints

**File:** `backend/src/routes/payments.js`

**Apa yang ada di sini:**
- Definisi URL endpoints untuk payment
- Middleware yang digunakan
- Controller yang dipanggil

**Tunjukin ke penguji:**
```javascript
// Line 18-31: Route untuk create payment
router.post('/create-order', 
  generalRateLimitMiddleware,  // Cegah spam
  authenticate,                 // Cek token
  requireParticipant,           // Cek role
  paymentController.createPaymentOrder  // Handler
);
```

**Jelaskan:**
"Ini adalah route definition. Ketika user POST ke `/api/payments/create-order`, sistem akan:
1. Cek rate limit (cegah spam)
2. Cek authentication (user sudah login)
3. Cek role (harus participant)
4. Panggil controller untuk handle request"

**File lain yang bisa ditunjuk:**
- `backend/src/routes/events.js` - Event endpoints
- `backend/src/routes/auth.js` - Authentication endpoints
- `backend/src/routes/balance.js` - Wallet endpoints

---

### 🎯 3. Controller - Request Handler

**File:** `backend/src/controllers/paymentController.js`

**Apa yang ada di sini:**
- Fungsi untuk handle request
- Extract data dari request
- Validasi data
- Panggil service
- Return response

**Tunjukin ke penguji:**
```javascript
// Line 6-70: Controller function
async createPaymentOrder(req, res) {
  try {
    // 1. Extract data dari request body
    const { eventId, amount, customerName, customerEmail } = req.body;

    // 2. Validasi
    if (!eventId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // 3. Panggil SERVICE
    const result = await paymentService.createPaymentOrder({
      userId: req.user.id,
      eventId,
      amount: parseFloat(amount),
      customerName,
      customerEmail
    });

    // 4. Return response
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
```

**Jelaskan:**
"Ini adalah controller. Fungsinya:
1. Terima request dari route
2. Extract dan validasi data
3. Panggil service untuk business logic
4. Return response ke frontend"

**File lain yang bisa ditunjuk:**
- `backend/src/controllers/eventController.js` - Event controller
- `backend/src/controllers/authController.js` - Auth controller

---

### 🎯 4. Service - Business Logic

**File:** `backend/src/services/paymentService.js`

**Apa yang ada di sini:**
- Business logic untuk payment
- Akses database (Prisma)
- Integrasi dengan Midtrans API
- Data processing

**Tunjukin ke penguji:**
```javascript
// Line 17-100: Service function
async createPaymentOrder({ userId, eventId, amount, ... }) {
  // 1. Validasi event exists
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });

  // 2. Generate payment reference
  const paymentReference = `PAY_${Date.now()}_${Math.random()...}`;

  // 3. Create payment di database
  const payment = await prisma.payment.create({
    data: {
      userId,
      eventId,
      amount: parseFloat(amount),
      paymentStatus: 'PENDING',
      paymentReference
    }
  });

  // 4. Panggil Midtrans API
  const midtransResponse = await snap.createTransaction({
    transaction_details: {
      order_id: paymentReference,
      gross_amount: parseFloat(amount)
    }
  });

  // 5. Update payment dengan URL
  await prisma.payment.update({
    where: { id: payment.id },
    data: { paymentUrl: midtransResponse.redirect_url }
  });

  return {
    paymentId: payment.id,
    paymentUrl: midtransResponse.redirect_url
  };
}
```

**Jelaskan:**
"Ini adalah service layer. Di sini semua business logic:
1. Validasi data
2. Akses database (create payment record)
3. Panggil external API (Midtrans untuk payment)
4. Update database dengan hasil dari API
5. Return data ke controller"

**File lain yang bisa ditunjuk:**
- `backend/src/services/eventService.js` - Event business logic
- `backend/src/services/xenditService.js` - Xendit integration
- `backend/src/services/emailService.js` - Email sending

---

### 🎯 5. Middleware - Authentication

**File:** `backend/src/middlewares/auth.js`

**Apa yang ada di sini:**
- Authentication middleware (cek JWT token)
- Authorization middleware (cek role)
- Token verification

**Tunjukin ke penguji:**
```javascript
// Line 39-80: Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token dari header
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer '

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    // 4. Attach user to request
    req.user = user;
    next(); // Lanjut ke controller
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};
```

**Jelaskan:**
"Ini adalah authentication middleware. Setiap request yang butuh auth akan:
1. Cek apakah ada token di header
2. Verify token menggunakan JWT
3. Cek user di database
4. Attach user ke request (req.user)
5. Lanjut ke controller jika valid"

---

### 🎯 6. Database Connection

**File:** `backend/src/config/database.js`

**Apa yang ada di sini:**
- Prisma client setup
- Database connection configuration
- Connection testing

**Tunjukin ke penguji:**
```javascript
// Prisma client setup
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL  // PostgreSQL connection string
    }
  }
});
```

**Jelaskan:**
"Ini adalah database connection. Menggunakan Prisma ORM untuk akses PostgreSQL. Semua service menggunakan `prisma` ini untuk query database."

---

### 🎯 7. External API Integration - Midtrans

**File:** `backend/src/services/paymentService.js`

**Tunjukin ke penguji:**
```javascript
// Line 8-13: Midtrans initialization
const Midtrans = require('midtrans-client');

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Line 200-230: Panggil Midtrans API
const midtransResponse = await snap.createTransaction({
  transaction_details: {
    order_id: paymentReference,
    gross_amount: parseFloat(amount)
  },
  customer_details: {
    first_name: customerName,
    email: customerEmail
  }
});
```

**Jelaskan:**
"Ini adalah integrasi dengan Midtrans. Kita initialize Midtrans client dengan API key, lalu panggil `createTransaction` untuk membuat payment. Midtrans akan return payment URL yang digunakan user untuk bayar."

---

### 🎯 8. External API Integration - Xendit

**File:** `backend/src/services/xenditService.js`

**Tunjukin ke penguji:**
```javascript
// Line 1-25: Xendit initialization
const { Xendit } = require('xendit-node');

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY
});

// Line 100-150: Create disbursement
const disbursement = await xenditClient.Disbursement.create({
  external_id: 'DISB_123456',
  bank_code: 'BCA',
  account_holder_name: 'John Doe',
  account_number: '1234567890',
  description: 'Payout for event',
  amount: 1000000
});
```

**Jelaskan:**
"Ini adalah integrasi dengan Xendit untuk payout. Kita initialize Xendit client, lalu panggil `Disbursement.create` untuk transfer uang ke bank/e-wallet organizer."

---

### 🎯 9. Frontend API Client

**File:** `frontend/src/lib/api.ts`

**Tunjukin ke penguji:**
```typescript
// Line 1-16: Axios setup
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Line 19-28: Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Line 94-120: API Service methods
export class ApiService {
  static async createPaymentOrder(data: {...}) {
    const response = await apiClient.post('/payments/create-order', data);
    return response.data;
  }
}
```

**Jelaskan:**
"Ini adalah API client di frontend. Menggunakan Axios untuk HTTP requests. Setiap request otomatis menambahkan token di header. Frontend memanggil method seperti `ApiService.createPaymentOrder()` untuk berkomunikasi dengan backend."

---

### 🎯 10. Database Schema

**File:** `backend/prisma/schema.prisma`

**Tunjukin ke penguji:**
```prisma
// Line 279-303: Payment model
model Payment {
  id               String             @id @default(uuid())
  registrationId   String?            @map("registration_id")
  eventId          String?            @map("event_id")
  userId           String?            @map("user_id")
  amount           Decimal            @db.Decimal(10, 2)
  currency         String             @default("IDR")
  paymentMethod    PaymentMethod      @map("payment_method")
  paymentStatus    PaymentStatus      @map("payment_status")
  paymentReference String?            @unique @map("payment_reference")
  paymentUrl       String?            @map("payment_url")
  paidAt           DateTime?          @map("paid_at")
  createdAt        DateTime           @default(now()) @map("created_at")
  updatedAt        DateTime           @updatedAt @map("updated_at")
  
  event            Event?             @relation(fields: [eventId], references: [id])
  registration     EventRegistration? @relation(fields: [registrationId], references: [id])
  user             User?              @relation(fields: [userId], references: [id])

  @@map("payments")
}
```

**Jelaskan:**
"Ini adalah database schema. Menggunakan Prisma untuk define models. Model `Payment` menyimpan semua data payment, termasuk status, amount, dan reference ke event/user."

---

## 🗺️ Visual Flow - Tunjuk File Saat Presentasi

### Flow: User Create Payment

```
1. FRONTEND
   File: frontend/src/app/(dashboard)/events/[id]/page.tsx
   └─> User klik "Bayar"
   └─> Panggil: ApiService.createPaymentOrder()

2. API CLIENT
   File: frontend/src/lib/api.ts
   └─> POST /api/payments/create-order
   └─> Add token di header

3. ROUTE
   File: backend/src/routes/payments.js
   └─> router.post('/create-order', ...)
   └─> Middleware: authenticate, requireParticipant
   └─> Controller: paymentController.createPaymentOrder

4. MIDDLEWARE
   File: backend/src/middlewares/auth.js
   └─> authenticate: cek token
   └─> requireParticipant: cek role

5. CONTROLLER
   File: backend/src/controllers/paymentController.js
   └─> Extract data dari req.body
   └─> Panggil: paymentService.createPaymentOrder()

6. SERVICE
   File: backend/src/services/paymentService.js
   └─> Validasi event
   └─> Create payment di database (Prisma)
   └─> Panggil Midtrans API
   └─> Update payment dengan URL

7. DATABASE
   File: backend/src/config/database.js
   └─> Prisma client
   └─> PostgreSQL connection

8. EXTERNAL API
   File: backend/src/services/paymentService.js
   └─> Midtrans API call
   └─> Return payment URL

9. RESPONSE
   └─> Controller return JSON
   └─> Frontend terima response
   └─> Redirect ke payment URL
```

---

## 📋 Checklist untuk Presentasi

### ✅ File yang Harus Bisa Ditunjuk:

1. **Entry Point**
   - [ ] `backend/src/app.js` - Server setup & route registration

2. **Routes**
   - [ ] `backend/src/routes/payments.js` - Payment endpoints
   - [ ] `backend/src/routes/events.js` - Event endpoints
   - [ ] `backend/src/routes/auth.js` - Auth endpoints

3. **Controllers**
   - [ ] `backend/src/controllers/paymentController.js` - Payment handler
   - [ ] `backend/src/controllers/eventController.js` - Event handler

4. **Services**
   - [ ] `backend/src/services/paymentService.js` - Payment logic
   - [ ] `backend/src/services/xenditService.js` - Xendit integration
   - [ ] `backend/src/services/emailService.js` - Email service

5. **Middlewares**
   - [ ] `backend/src/middlewares/auth.js` - Authentication
   - [ ] `backend/src/middlewares/validation.js` - Input validation

6. **Config**
   - [ ] `backend/src/config/database.js` - Database connection

7. **Frontend**
   - [ ] `frontend/src/lib/api.ts` - API client

8. **Database**
   - [ ] `backend/prisma/schema.prisma` - Database schema

---

## 🎯 Quick Answers untuk Pertanyaan

### Q: "API-nya dimana?"
**A:** 
- Routes: `backend/src/routes/` - menentukan URL
- Controllers: `backend/src/controllers/` - handle request
- Services: `backend/src/services/` - business logic

**Tunjuk file:**
- `backend/src/routes/payments.js` - Route definition
- `backend/src/controllers/paymentController.js` - Request handler
- `backend/src/services/paymentService.js` - Business logic

### Q: "Cara koneksinya gimana?"
**A:**
1. Frontend → API Client (`frontend/src/lib/api.ts`)
2. API Client → Backend Route (`backend/src/routes/payments.js`)
3. Route → Controller (`backend/src/controllers/paymentController.js`)
4. Controller → Service (`backend/src/services/paymentService.js`)
5. Service → Database (`backend/src/config/database.js`)

**Tunjuk file sesuai flow di atas.**

### Q: "Service itu apa?"
**A:** 
Service adalah layer yang berisi business logic. Lokasi: `backend/src/services/`

**Tunjuk file:**
- `backend/src/services/paymentService.js` - Payment logic
- `backend/src/services/xenditService.js` - Xendit integration

**Jelaskan:** "Service ini handle semua business logic, akses database, dan integrasi dengan external API."

### Q: "Controller itu apa?"
**A:**
Controller adalah request handler. Lokasi: `backend/src/controllers/`

**Tunjuk file:**
- `backend/src/controllers/paymentController.js`

**Jelaskan:** "Controller ini terima request dari route, validasi data, panggil service, dan return response."

### Q: "Route itu apa?"
**A:**
Route menentukan URL endpoint. Lokasi: `backend/src/routes/`

**Tunjuk file:**
- `backend/src/routes/payments.js`

**Jelaskan:** "Route ini menentukan URL seperti `/api/payments/create-order` dan menghubungkannya ke controller."

---

**Dokumentasi ini berisi file-file spesifik yang bisa ditunjuk saat presentasi untuk menjelaskan implementasi API.**

