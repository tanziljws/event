# 📚 Panduan Detail Implementasi API

## 🎯 Konsep Dasar

### Apa itu API?
**API (Application Programming Interface)** adalah cara aplikasi berkomunikasi dengan server. Seperti menu di restoran - user pesan (request), dapur masak (server process), makanan datang (response).

### Arsitektur 3-Layer

```
┌─────────────────────────────────────────┐
│         CLIENT (Frontend/Mobile)        │
│  Mengirim Request → Menerima Response    │
└──────────────┬──────────────────────────┘
               │ HTTP Request (GET/POST/PUT/DELETE)
               │
┌──────────────▼──────────────────────────┐
│         ROUTE (URL Endpoint)             │
│  Menentukan URL & Method                 │
│  Contoh: /api/events, /api/payments     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         MIDDLEWARE (Security/Validation) │
│  - Authentication (cek token)            │
│  - Validation (cek data valid)           │
│  - Rate Limiting (cegah spam)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         CONTROLLER (Request Handler)    │
│  Menerima Request → Memanggil Service   │
│  Mengembalikan Response                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         SERVICE (Business Logic)         │
│  Logika bisnis, akses database           │
│  Integrasi dengan external API          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         DATABASE (PostgreSQL)            │
│  Menyimpan & mengambil data             │
└──────────────────────────────────────────┘
```

---

## 📁 Struktur Folder Backend

```
backend/
└── src/
    ├── app.js                    # Entry point, setup Express
    │
    ├── routes/                   # 📍 ROUTE LAYER - URL endpoints
    │   ├── events.js             # /api/events
    │   ├── payments.js           # /api/payments
    │   ├── auth.js               # /api/auth
    │   └── ...
    │
    ├── controllers/              # 📍 CONTROLLER LAYER - Request handler
    │   ├── eventController.js    # Handle event requests
    │   ├── paymentController.js # Handle payment requests
    │   ├── authController.js     # Handle auth requests
    │   └── ...
    │
    ├── services/                 # 📍 SERVICE LAYER - Business logic
    │   ├── eventService.js       # Event business logic
    │   ├── paymentService.js     # Payment business logic
    │   ├── authService.js        # Auth business logic
    │   ├── xenditService.js      # Xendit integration
    │   ├── emailService.js       # Email sending
    │   └── ...
    │
    ├── middlewares/              # 📍 MIDDLEWARE - Security & Validation
    │   ├── auth.js               # Authentication middleware
    │   ├── validation.js        # Input validation
    │   └── security.js          # Rate limiting, CORS
    │
    ├── config/                   # 📍 CONFIG - Configuration files
    │   ├── database.js           # Database connection
    │   ├── logger.js             # Logging config
    │   └── brevoEmail.js         # Email config
    │
    └── utils/                    # 📍 UTILS - Helper functions
        └── debug.js              # Debug utilities
```

---

## 🔄 Flow Lengkap: Request → Response

### Contoh: User Membuat Payment

```
1. USER (Frontend)
   └─> POST /api/payments/create-order
       Body: { eventId, amount, customerName, ... }
       Headers: { Authorization: "Bearer token123" }

2. ROUTE (routes/payments.js)
   └─> router.post('/create-order', ...)
       ├─> Middleware: authenticate (cek token)
       ├─> Middleware: requireParticipant (cek role)
       └─> Controller: paymentController.createPaymentOrder

3. CONTROLLER (controllers/paymentController.js)
   └─> createPaymentOrder(req, res)
       ├─> Extract data dari req.body
       ├─> Validasi data
       └─> Panggil: paymentService.createPaymentOrder(...)

4. SERVICE (services/paymentService.js)
   └─> createPaymentOrder({ userId, eventId, amount, ... })
       ├─> Validasi ticket availability
       ├─> Create payment record di database
       ├─> Panggil Midtrans API
       └─> Return payment URL

5. RESPONSE
   └─> Controller return JSON:
       {
         success: true,
         data: {
           paymentUrl: "https://midtrans.com/...",
           paymentReference: "PAY_123456"
         }
       }

6. USER (Frontend)
   └─> Terima response → Redirect ke paymentUrl
```

---

## 📍 1. ROUTE LAYER (routes/)

### Lokasi: `backend/src/routes/`

**Fungsi:** Menentukan URL endpoint dan method HTTP

### Contoh File: `routes/payments.js`

```javascript
const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate, requireParticipant } = require('../middlewares/auth');

const router = express.Router();

// POST /api/payments/create-order
router.post('/create-order', 
  authenticate,              // Middleware: cek token
  requireParticipant,        // Middleware: cek role
  paymentController.createPaymentOrder  // Controller function
);

// GET /api/payments/status/:paymentId
router.get('/status/:paymentId', 
  authenticate,
  paymentController.checkPaymentStatus
);

// POST /api/payments/webhook (public, no auth)
router.post('/webhook', 
  paymentController.handlePaymentWebhook
);

module.exports = router;
```

### File-file Route Lainnya:

| File | Endpoint Base | Deskripsi |
|------|---------------|-----------|
| `routes/events.js` | `/api/events` | Event endpoints |
| `routes/payments.js` | `/api/payments` | Payment endpoints |
| `routes/auth.js` | `/api/auth` | Authentication endpoints |
| `routes/balance.js` | `/api/balance` | Wallet balance endpoints |
| `routes/disbursements.js` | `/api/disbursements` | Payout endpoints |
| `routes/organizers.js` | `/api/organizers` | Organizer endpoints |

### Cara Registrasi Route di `app.js`:

```javascript
// backend/src/app.js
const express = require('express');
const app = express();

// Import routes
const eventsRouter = require('./routes/events');
const paymentsRouter = require('./routes/payments');
const authRouter = require('./routes/auth');

// Register routes
app.use('/api/events', eventsRouter);      // /api/events/*
app.use('/api/payments', paymentsRouter);   // /api/payments/*
app.use('/api/auth', authRouter);           // /api/auth/*
```

**Jadi:**
- Route di `routes/payments.js` → `/api/payments/*`
- Route di `routes/events.js` → `/api/events/*`

---

## 📍 2. CONTROLLER LAYER (controllers/)

### Lokasi: `backend/src/controllers/`

**Fungsi:** 
- Menerima request dari route
- Validasi data
- Memanggil service
- Mengembalikan response

### Contoh File: `controllers/paymentController.js`

```javascript
const paymentService = require('../services/paymentService');

const paymentController = {
  // Create payment order
  async createPaymentOrder(req, res) {
    try {
      // 1. Extract data dari request
      const {
        eventId,
        amount,
        customerName,
        customerEmail,
        paymentMethod
      } = req.body;

      // 2. Validasi data
      if (!eventId || !amount || !customerName || !customerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // 3. Panggil SERVICE
      const result = await paymentService.createPaymentOrder({
        userId: req.user.id,  // dari middleware authenticate
        eventId,
        amount: parseFloat(amount),
        customerName,
        customerEmail,
        paymentMethod: paymentMethod || 'midtrans'
      });

      // 4. Return response
      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      // 5. Handle error
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;  // dari URL
      const userId = req.user.id;

      const result = await paymentService.checkPaymentStatus(paymentId, userId);

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
};

module.exports = paymentController;
```

### File-file Controller Lainnya:

| File | Deskripsi |
|------|-----------|
| `eventController.js` | Handle event requests (create, get, update) |
| `paymentController.js` | Handle payment requests |
| `authController.js` | Handle login, register, token refresh |
| `balanceController.js` | Handle wallet balance requests |
| `disbursementController.js` | Handle payout requests |

---

## 📍 3. SERVICE LAYER (services/)

### Lokasi: `backend/src/services/`

**Fungsi:**
- Business logic (logika bisnis)
- Akses database (via Prisma)
- Integrasi dengan external API (Midtrans, Xendit, Brevo)
- Data processing & transformation

### Contoh File: `services/paymentService.js`

```javascript
const { prisma } = require('../config/database');
const Midtrans = require('midtrans-client');

// Initialize Midtrans
const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

const paymentService = {
  // Create payment order
  async createPaymentOrder({
    userId,
    eventId,
    amount,
    customerName,
    customerEmail,
    paymentMethod
  }) {
    // 1. Validasi event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // 2. Generate payment reference
    const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 3. Create payment record di database
    const payment = await prisma.payment.create({
      data: {
        userId,
        eventId,
        amount: parseFloat(amount),
        currency: 'IDR',
        paymentMethod: 'GATEWAY',
        paymentStatus: 'PENDING',
        paymentReference,
        metadata: {
          customerName,
          customerEmail
        }
      }
    });

    // 4. Panggil Midtrans API
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

    // 5. Update payment dengan payment URL
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentUrl: midtransResponse.redirect_url
      }
    });

    // 6. Return result
    return {
      paymentId: payment.id,
      paymentReference,
      paymentUrl: midtransResponse.redirect_url
    };
  },

  // Check payment status
  async checkPaymentStatus(paymentId, userId) {
    // 1. Get payment from database
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: userId
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // 2. Check status from Midtrans (if still pending)
    if (payment.paymentStatus === 'PENDING') {
      const status = await snap.transaction.status(payment.paymentReference);
      
      // Update status if changed
      if (status.transaction_status === 'settlement') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: 'PAID' }
        });
      }
    }

    return {
      paymentId: payment.id,
      status: payment.paymentStatus,
      amount: payment.amount
    };
  }
};

module.exports = paymentService;
```

### File-file Service Lainnya:

| File | Deskripsi |
|------|-----------|
| `eventService.js` | Event business logic (create, update, get events) |
| `paymentService.js` | Payment business logic (create payment, check status) |
| `authService.js` | Auth business logic (login, register, token) |
| `balanceService.js` | Wallet balance logic (get balance, transactions) |
| `disbursementService.js` | Payout logic (request payout, cancel, retry) |
| `xenditService.js` | Xendit API integration (payout) |
| `emailService.js` | Email sending (Brevo integration) |
| `certificateService.js` | Certificate generation |

---

## 📍 4. MIDDLEWARE LAYER (middlewares/)

### Lokasi: `backend/src/middlewares/`

**Fungsi:**
- Authentication (cek token JWT)
- Authorization (cek role user)
- Validation (validasi input)
- Security (rate limiting, CORS)

### Contoh File: `middlewares/auth.js`

```javascript
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

// Middleware: Authentication (cek token)
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token dari header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // 2. Extract token
    const token = authHeader.substring(7); // Remove 'Bearer '

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // 5. Attach user to request
    req.user = user;
    next(); // Lanjut ke controller

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware: Authorization (cek role)
const requireParticipant = (req, res, next) => {
  if (req.user.role !== 'PARTICIPANT') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Participant only.'
    });
  }
  next();
};

const requireOrganizer = (req, res, next) => {
  if (req.user.role !== 'ORGANIZER') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Organizer only.'
    });
  }
  next();
};

module.exports = {
  authenticate,
  requireParticipant,
  requireOrganizer
};
```

### Contoh File: `middlewares/validation.js`

```javascript
const { body, validationResult } = require('express-validator');

// Validate event creation
const validateEventCreation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('eventDate').isISO8601().withMessage('Invalid date format'),
  body('location').notEmpty().withMessage('Location is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateEventCreation
};
```

---

## 🔌 Cara Koneksi Antar Layer

### 1. Route → Controller

```javascript
// routes/payments.js
const paymentController = require('../controllers/paymentController');

router.post('/create-order', 
  paymentController.createPaymentOrder  // ← Panggil controller
);
```

### 2. Controller → Service

```javascript
// controllers/paymentController.js
const paymentService = require('../services/paymentService');

async createPaymentOrder(req, res) {
  const result = await paymentService.createPaymentOrder({  // ← Panggil service
    userId: req.user.id,
    eventId: req.body.eventId,
    ...
  });
}
```

### 3. Service → Database

```javascript
// services/paymentService.js
const { prisma } = require('../config/database');

async createPaymentOrder(...) {
  const payment = await prisma.payment.create({  // ← Akses database
    data: { ... }
  });
}
```

### 4. Service → External API

```javascript
// services/paymentService.js
const Midtrans = require('midtrans-client');

const snap = new Midtrans.Snap({...});

async createPaymentOrder(...) {
  const response = await snap.createTransaction({...});  // ← Panggil Midtrans API
}
```

---

## 📱 Frontend → Backend Connection

### Lokasi: `frontend/src/lib/api.ts`

```typescript
import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Service
export class ApiService {
  // Create payment order
  static async createPaymentOrder(data: {
    eventId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
  }) {
    const response = await apiClient.post('/payments/create-order', data);
    return response.data;
  }

  // Get events
  static async getEvents(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get('/events', { params });
    return response.data;
  }
}
```

### Penggunaan di Frontend:

```typescript
// frontend/src/app/(dashboard)/events/page.tsx
import { ApiService } from '@/lib/api';

// Get events
const events = await ApiService.getEvents({ page: 1, limit: 10 });

// Create payment
const payment = await ApiService.createPaymentOrder({
  eventId: 'event-123',
  amount: 100000,
  customerName: 'John Doe',
  customerEmail: 'john@example.com'
});
```

---

## 🗄️ Database Connection

### Lokasi: `backend/src/config/database.js`

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'error', 'warn'],
});

// Test connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

module.exports = {
  prisma,
  testDatabaseConnection
};
```

### Penggunaan di Service:

```javascript
// services/paymentService.js
const { prisma } = require('../config/database');

// Create payment
const payment = await prisma.payment.create({
  data: {
    userId: 'user-123',
    eventId: 'event-456',
    amount: 100000,
    paymentStatus: 'PENDING'
  }
});

// Get payment
const payment = await prisma.payment.findUnique({
  where: { id: 'payment-123' }
});

// Update payment
await prisma.payment.update({
  where: { id: 'payment-123' },
  data: { paymentStatus: 'PAID' }
});
```

---

## 🔗 External API Integration

### 1. Midtrans (Payment)

**Lokasi:** `backend/src/services/paymentService.js`

```javascript
const Midtrans = require('midtrans-client');

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Create payment
const response = await snap.createTransaction({
  transaction_details: {
    order_id: 'PAY_123456',
    gross_amount: 100000
  },
  customer_details: {
    first_name: 'John Doe',
    email: 'john@example.com'
  }
});

// Response: { token: '...', redirect_url: 'https://midtrans.com/...' }
```

### 2. Xendit (Payout)

**Lokasi:** `backend/src/services/xenditService.js`

```javascript
const { Xendit } = require('xendit-node');

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY
});

// Create disbursement
const disbursement = await xenditClient.Disbursement.create({
  external_id: 'DISB_123456',
  bank_code: 'BCA',
  account_holder_name: 'John Doe',
  account_number: '1234567890',
  description: 'Payout for event',
  amount: 1000000
});
```

### 3. Brevo (Email)

**Lokasi:** `backend/src/services/emailService.js`

```javascript
const { emailTemplates } = require('../config/brevoEmail');

// Send email
await emailTemplates.sendEmail({
  to: 'user@example.com',
  subject: 'Payment Confirmation',
  template: 'payment-confirmation',
  data: {
    userName: 'John Doe',
    amount: 100000
  }
});
```

---

## 📍 File Locations Summary

### Backend Structure

```
backend/src/
├── app.js                          # Entry point
│
├── routes/                         # URL endpoints
│   ├── events.js                   # /api/events/*
│   ├── payments.js                 # /api/payments/*
│   ├── auth.js                     # /api/auth/*
│   └── ...
│
├── controllers/                    # Request handlers
│   ├── eventController.js          # Handle /api/events requests
│   ├── paymentController.js        # Handle /api/payments requests
│   └── ...
│
├── services/                       # Business logic
│   ├── eventService.js             # Event logic
│   ├── paymentService.js           # Payment logic
│   ├── xenditService.js           # Xendit API
│   └── ...
│
├── middlewares/                    # Security & validation
│   ├── auth.js                     # Authentication
│   ├── validation.js               # Input validation
│   └── security.js                 # Rate limiting
│
└── config/                         # Configuration
    ├── database.js                 # Database connection
    └── logger.js                   # Logging
```

### Frontend Structure

```
frontend/src/
├── lib/
│   └── api.ts                      # API client (axios)
│
└── app/
    └── (dashboard)/
        └── events/
            └── page.tsx            # Frontend page
```

---

## 🎯 Quick Reference untuk Presentasi

### Kalau Ditanya: "API-nya dimana?"
**Jawab:** 
- **Routes**: `backend/src/routes/` - menentukan URL endpoint
- **Controllers**: `backend/src/controllers/` - handle request
- **Services**: `backend/src/services/` - business logic

### Kalau Ditanya: "Cara kerjanya gimana?"
**Jawab:**
1. User kirim request dari frontend
2. Route terima request di URL tertentu
3. Middleware cek authentication & validation
4. Controller handle request, panggil service
5. Service akses database atau external API
6. Response dikembalikan ke frontend

### Kalau Ditanya: "Service itu apa?"
**Jawab:**
- Service adalah layer yang berisi business logic
- Lokasi: `backend/src/services/`
- Contoh: `paymentService.js` - handle semua logika payment
- Service bisa akses database (Prisma) dan external API (Midtrans, Xendit)

### Kalau Ditanya: "Controller itu apa?"
**Jawab:**
- Controller adalah request handler
- Lokasi: `backend/src/controllers/`
- Fungsi: terima request → panggil service → return response
- Contoh: `paymentController.js` - handle semua request ke `/api/payments`

### Kalau Ditanya: "Route itu apa?"
**Jawab:**
- Route menentukan URL endpoint
- Lokasi: `backend/src/routes/`
- Contoh: `routes/payments.js` → `/api/payments/*`
- Route menghubungkan URL ke controller function

---

**Dokumentasi ini menjelaskan detail implementasi API, struktur folder, dan cara koneksi antar layer untuk keperluan presentasi dan penjelasan ke penguji.**

