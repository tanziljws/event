# Event Management System

Sistem Informasi Manajemen Kegiatan (Event Management System) yang profesional dengan arsitektur terpisah antara backend (API) dan frontend.

## 🚀 Features

### Authentication & Authorization
- ✅ User registration dengan email verification (OTP)
- ✅ JWT authentication dengan refresh token
- ✅ Password reset via email
- ✅ Role-based access control (Admin vs Participant)
- ✅ Session timeout management
- ✅ Rate limiting untuk security

### Event Management (Admin)
- ✅ CRUD operations untuk events
- ✅ Validasi: admin hanya bisa buat event maksimal H-3
- ✅ Upload flyer dan template sertifikat
- ✅ Publish/unpublish event
- ✅ Dashboard dengan statistik
- ✅ Export data peserta ke CSV/Excel

### Public/Participant Features
- ✅ Browse katalog event dengan search & filter
- ✅ Register ke event dengan token konfirmasi
- ✅ Absensi dengan input token
- ✅ Download sertifikat setelah absensi
- ✅ Riwayat event dan sertifikat

### Email Service
- ✅ Email verification dengan OTP
- ✅ Password reset notification
- ✅ Event registration confirmation
- ✅ Event reminder (H-1)
- ✅ Certificate ready notification

## 🛠 Tech Stack

### Backend
- **Node.js** dengan Express.js
- **PostgreSQL** (primary database)
- **Redis** (caching & session)
- **Prisma** (ORM)
- **JWT** (authentication)
- **Nodemailer** (email service)
- **Bull/BullMQ** (background jobs)
- **Joi** (validation)
- **Winston** (logging)

### Security
- **Helmet.js** (security headers)
- **CORS** (cross-origin protection)
- **Rate limiting** (API protection)
- **XSS protection**
- **Input validation & sanitization**

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd event-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp env.example .env
# Edit .env file with your configuration
```

### 4. Database Setup
```bash
# Start PostgreSQL and Redis (using Docker)
docker-compose up -d postgres redis

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phoneNumber": "+6281234567890",
  "address": "Jakarta, Indonesia",
  "lastEducation": "Bachelor's Degree"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otpCode": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewPassword123!"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

## 🗄 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `full_name` (String)
- `email` (String, Unique)
- `phone_number` (String, Optional)
- `address` (String, Optional)
- `last_education` (String, Optional)
- `password` (String, Hashed)
- `role` (Enum: ADMIN, PARTICIPANT)
- `email_verified` (Boolean)
- `verification_token` (String, Optional)
- `verification_token_expires` (DateTime, Optional)
- `reset_password_token` (String, Optional)
- `reset_password_expires` (DateTime, Optional)
- `last_activity` (DateTime, Optional)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Events Table
- `id` (UUID, Primary Key)
- `title` (String)
- `event_date` (DateTime)
- `event_time` (String)
- `location` (String)
- `flyer_url` (String, Optional)
- `certificate_template_url` (String, Optional)
- `description` (String, Optional)
- `max_participants` (Integer)
- `registration_deadline` (DateTime)
- `is_published` (Boolean)
- `created_by` (UUID, Foreign Key)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Event Registrations Table
- `id` (UUID, Primary Key)
- `event_id` (UUID, Foreign Key)
- `participant_id` (UUID, Foreign Key)
- `registration_token` (String, Unique)
- `has_attended` (Boolean)
- `attendance_time` (DateTime, Optional)
- `certificate_url` (String, Optional)
- `registered_at` (DateTime)
- `attended_at` (DateTime, Optional)

## 🔧 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run db:migrate # Run database migrations
npm run db:generate # Generate Prisma client
npm run db:seed    # Seed database
npm run db:studio  # Open Prisma Studio
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint errors
```

### Project Structure
```
backend/
├── src/
│   ├── config/         # Database, Redis, Email config
│   ├── controllers/    # Request handlers
│   ├── middlewares/    # Auth, validation, error handling
│   ├── models/         # Database models (Prisma)
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helpers, validators
│   ├── jobs/           # Background jobs
│   ├── templates/      # Email templates
│   └── app.js          # Express app setup
├── prisma/
│   └── schema.prisma   # Database schema
├── tests/
├── uploads/            # File uploads
├── logs/               # Application logs
└── docker-compose.yml
```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Services Included
- **PostgreSQL** (Database)
- **Redis** (Cache & Session)
- **Node.js App** (API Server)
- **Nginx** (Reverse Proxy)

## 🔒 Security Features

- **JWT Authentication** dengan refresh token
- **Rate Limiting** untuk mencegah brute force
- **CORS Protection** dengan whitelist origins
- **Helmet.js** untuk security headers
- **Input Validation** dengan Joi
- **XSS Protection** dengan sanitization
- **Password Hashing** dengan bcrypt
- **Session Timeout** management
- **Request Size Limiting**

## 📊 Monitoring & Logging

- **Winston Logger** dengan multiple transports
- **Morgan** untuk HTTP request logging
- **Activity Logs** untuk audit trail
- **Error Tracking** dengan detailed logging
- **Performance Monitoring**

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 📝 Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/event_management_db"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Server
PORT=3000
NODE_ENV="development"
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@eventmanagement.com or create an issue in the repository.

---

**Note**: This is a development version. For production deployment, ensure to:
- Change all default passwords and secrets
- Configure proper SSL certificates
- Set up proper monitoring and alerting
- Configure backup strategies
- Review and update security configurations
