# NusaEvent - Codebase Exploration & Understanding Summary

## 🎯 Project Overview

**NusaEvent** is a comprehensive **Event Management System** (Sistem Informasi Manajemen Kegiatan) - a multi-platform application for managing events, registrations, payments, certificates, and support operations.

### Architecture
- **Backend**: Node.js/Express with PostgreSQL (Prisma ORM)
- **Frontend**: Next.js 14 (TypeScript, Tailwind CSS)
- **Mobile**: Flutter (Dart) for iOS/Android
- **Deployment**: Railway (backend), Vercel (frontend)

---

## 🏗️ System Architecture

### Backend Structure (`/backend/src/`)

#### Core Application (`app.js`)
- **Lazy route loading** for faster startup
- **Deferred initialization** of heavy services (database, Redis, WebSocket)
- **Prometheus metrics** for monitoring
- **Graceful shutdown** handling
- **Security middlewares**: Helmet, CORS, rate limiting, XSS protection

#### Key Directories
- **`routes/`** (28 files): API endpoints
  - `auth.js` - Authentication
  - `events.js` - Event CRUD
  - `payments.js` - Payment processing
  - `organizers.js` - Organizer management
  - `department-tickets.js` - Support tickets
  - `certificates.js` - Certificate generation
  - `upgrade.js` - Participant → Organizer upgrade

- **`services/`** (28 files): Business logic
  - `eventService.js` - Event management
  - `paymentGatewayService.js` - Midtrans/Duitku integration
  - `paymentService.js` - Payment processing
  - `smartAssignmentService.js` - Auto-assignment logic
  - `certificateService.js` - Certificate generation
  - `emailService.js` - Email notifications
  - `notificationService.js` - In-app notifications
  - `analyticsService.js` - Analytics aggregation

- **`controllers/`** (13 files): Request handlers
- **`middlewares/`**: Authentication, security, validation
- **`jobs/`**: Background scheduled tasks
  - `eventReminderJob.js` - Send reminders H-1, H-0
  - `escalationJob.js` - Escalate overdue tickets
  - `cryptoMonitoring.js` - Monitor payment status

### Frontend Structure (`/frontend/src/app/`)

#### Next.js App Router with Route Groups
- **`(admin)/`** - Admin dashboard and management
- **`(auth)/`** - Login, register, password reset
- **`(dashboard)/`** - User dashboard, registrations, certificates
- **`(organizer)/`** - Organizer event management
- **`(department)/`** - Department dashboards (CS, Finance, Operations)
- **`(public)/`** - Public event pages, about, contact

### Mobile App Structure (`/mobileapp/lib/`)
- Feature-based architecture
- BLoC pattern for state management
- GoRouter for navigation
- Dio for HTTP requests

---

## 🔐 Authentication & Authorization

### User Roles
1. **SUPER_ADMIN** - System administrator
2. **CS_HEAD / CS_AGENT** - Customer Success department
3. **OPS_HEAD / OPS_AGENT** - Operations department
4. **FINANCE_HEAD / FINANCE_AGENT** - Finance department
5. **ORGANIZER** - Verified event organizers
6. **PARTICIPANT** - Regular users

### Authentication Flow
1. **Register** → Email verification (OTP)
2. **Login** → JWT access + refresh tokens
3. **Token Versioning** → For logout invalidation
4. **Session Timeout** → Configurable timeout
5. **Role-based Access Control** → Middleware checks

### JWT Implementation
- **Access Token**: Short-lived (configurable)
- **Refresh Token**: Long-lived, stored in database
- **Token Version**: Incremented on logout to invalidate all tokens
- **Last Activity**: Tracked for session timeout

---

## 🎫 Event Management Flow

### Event Lifecycle
```
DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED → COMPLETED/CANCELLED
```

### Event Creation
1. **Organizer** creates event (DRAFT)
2. **Auto-publish** (or manual approval for some types)
3. **Multiple Ticket Types** supported (VIP, Regular, Early Bird)
4. **Location** with geocoding (lat/lng)
5. **Certificate Templates** for attendance

### Registration Flow
1. **Participant** browses events
2. **Selects Ticket Type** (if multiple)
3. **For Free Events**: Direct registration
4. **For Paid Events**: 
   - Create payment order
   - Redirect to payment gateway (Midtrans/Duitku)
   - Webhook confirms payment
   - Registration created after payment
5. **Ticket Generation** → QR code created
6. **Confirmation Email** sent

### Key Features
- **Multiple Ticket Types**: Events can have multiple ticket types with different pricing
- **Capacity Management**: Atomic transactions prevent race conditions
- **Private Events**: Password-protected events
- **Registration Deadline**: Enforced validation

---

## 💳 Payment System

### Payment Gateways
- **Midtrans**: Primary gateway (Snap integration)
- **Duitku**: Alternative gateway (conditional loading)

### Payment Flow
1. **Registration** → Payment record created
2. **Gateway Payment** → Redirect to payment page
3. **Webhook** → Status update from gateway
4. **Confirmation** → Registration confirmed
5. **Revenue Split** → Organizer revenue calculated

### Payment Methods
- Bank Transfer
- E-Wallet
- Credit Card
- QR Code
- Cash (manual)

### Payment Status
- **PENDING** - Awaiting payment
- **PAID** - Payment confirmed
- **FAILED** - Payment failed
- **EXPIRED** - Payment expired
- **CANCELLED** - Payment cancelled

### Refund Flow
- **Event Cancellation** → Automatic refunds
- **Manual Refund** → Admin-initiated
- **Settlement Tracking** → Finance department

---

## 👥 Organizer System

### Organizer Types
1. **INDIVIDUAL** - Personal organizers
2. **COMMUNITY** - Community groups
3. **SMALL_BUSINESS** - Small businesses
4. **INSTITUTION** - Educational/Government institutions

### Verification Process
1. **Upgrade Request** → User submits profile (`POST /api/upgrade/business`)
2. **Auto-Assignment** → SmartAssignmentService assigns to agent
3. **Agent Review** → Verify documents and profile
4. **Approval/Rejection** → Status updated
5. **Notification** → Email to user

### Smart Assignment Service
- **Workload-based**: Assigns to agent with lowest workload
- **Round-robin**: Alternating assignment
- **Queue System**: Handles overflow when no agents available
- **Max Capacity**: 20 assignments per agent

### After Approval
- Organizer can create events
- Events auto-published (no approval needed)
- Can manage registrations, payments, attendance
- Revenue tracking enabled

---

## 🎫 Support System (Departments)

### Departments
1. **CUSTOMER_SERVICE** - General support
2. **OPERATIONS** - Event/organizer management
3. **FINANCE** - Payment/refund management

### Teams
- **PAYMENT_FINANCE** - Payment issues
- **TECHNICAL_SUPPORT** - Technical problems
- **GENERAL_SUPPORT** - General inquiries

### Ticket Flow
1. **Create Ticket** → From contact form or dashboard
2. **Auto-Assignment** → Based on category → Team → Agent
3. **Agent Response** → Comments added
4. **Status Updates** → OPEN → IN_PROGRESS → RESOLVED
5. **Escalation** → For overdue tickets

### Auto-Assignment Logic
- Ticket category matched to team categories
- Random assignment to team member
- Workload balancing

---

## 📊 Certificate System

### Certificate Generation
- **Template-based**: Event-specific or global templates
- **Dynamic Fields**: Participant name, event details, date
- **PDF Generation**: Puppeteer for HTML to PDF conversion
- **Verification Hash**: Blockchain-style verification (optional)

### Certificate Types
1. **Event Certificates**: Auto-generated after attendance
2. **Global Templates**: Reusable across events
3. **Custom Templates**: Per-event customization

### Generation Flow
1. **Attendance Marked** → `hasAttended = true`
2. **Manual Trigger** → Participant or admin generates
3. **Bulk Generation** → Admin generates for all attendees
4. **Template Selection** → Event-specific > Global default
5. **PDF Generation** → Puppeteer renders HTML to PDF
6. **Storage** → Uploaded to S3 or local storage
7. **Notification** → Email sent to participant

### Requirements
- Event must have `generateCertificate = true`
- Registration must have `hasAttended = true`
- Only one certificate per registration

---

## 🔔 Notification System

### Notification Types
- Event reminders (H-1, H-0)
- Registration confirmations
- Payment status updates
- Certificate ready
- Organizer verification status
- Ticket assignments (agents)

### Channels
- **Email**: SendGrid/Brevo/Nodemailer
- **In-app**: Database notifications
- **WebSocket**: Real-time notifications
- **Push notifications**: Mobile (planned)

---

## 📈 Analytics & Reporting

### Platform Analytics
- Total events, registrations
- Revenue tracking
- Active organizers
- Department metrics

### Organizer Analytics
- Event performance
- Registration trends
- Revenue breakdown
- Attendance rates

### Department Analytics
- Ticket resolution times
- Agent performance
- Team workload distribution

---

## 🔒 Security Features

### Backend Security
- **Helmet.js**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: API protection
- **XSS Protection**: Input sanitization
- **JWT**: Secure authentication
- **Password Hashing**: bcrypt
- **Audit Logging**: Complete audit trail

### Data Protection
- **Input Validation**: Joi, Zod
- **SQL Injection**: Prisma parameterized queries
- **File Upload**: Validation, size limits
- **Session Management**: Token versioning

---

## 🚀 Deployment

### Backend
- **Railway**: Primary deployment platform
- **Docker**: Containerization support
- **Database**: PostgreSQL (managed)
- **Redis**: Optional caching layer

### Frontend
- **Vercel/Next.js**: Hosting
- **API Integration**: Backend URL configuration
- **Environment Variables**: `NEXT_PUBLIC_API_URL`

### Monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **Sentry**: Error tracking
- **Winston**: Application logging

---

## 🔄 Background Jobs

### Scheduled Jobs
1. **Event Reminder**: Send reminders H-1, H-0
2. **Escalation**: Escalate overdue tickets
3. **Crypto Monitoring**: Monitor payment status
4. **Queue Processing**: Process assignment queue
5. **Analytics Aggregation**: Daily metrics

---

## 📝 Key Services Deep Dive

### Smart Assignment Service
**Location**: `backend/src/services/smartAssignmentService.js`

**Features**:
- Workload-based assignment
- Queue management
- Assignment history
- Agent capacity management (max 20 per agent)

**Strategies**:
- `WORKLOAD_BASED`: Select agent with lowest workload
- `ROUND_ROBIN`: Alternating assignment
- `SKILL_BASED`: Based on agent skills (future)
- `ADVANCED`: Advanced scoring algorithm (future)

### Payment Gateway Service
**Location**: `backend/src/services/paymentGatewayService.js`

**Features**:
- Multi-gateway support (Midtrans, Duitku)
- Webhook handling
- Payment verification
- Refund processing

**Midtrans Integration**:
- Snap integration for payment UI
- Core API for transaction status
- Production/sandbox mode support

**Duitku Integration**:
- Conditional loading (module may not be available)
- Invoice creation
- Transaction checking

### Certificate Service
**Location**: `backend/src/services/certificateService.js`

**Features**:
- Template management
- PDF generation (Puppeteer)
- Verification hashing
- Batch processing

**PDF Generation**:
- HTML template rendering
- Dynamic field injection
- Background image support
- Puppeteer for HTML to PDF conversion

---

## 🗄️ Database Schema Highlights

### Key Models
- **User**: Core user with roles, departments, organizer profiles
- **Event**: Event details, pricing, location, status workflow
- **TicketType**: Multiple ticket types per event
- **EventRegistration**: Participant registrations with tokens
- **Ticket**: Individual tickets with QR codes
- **Payment**: Payment records with gateway integration
- **Certificate**: Generated certificates
- **DepartmentTicket**: Support tickets
- **Team**: Support teams
- **OrganizerRevenue**: Revenue tracking and settlements

### Relationships
- User → Organizer Profiles (1:1)
- User → Events (1:many as creator)
- Event → TicketTypes (1:many)
- Event → EventRegistrations (1:many)
- EventRegistration → Ticket (1:1)
- EventRegistration → Certificate (1:1)
- User → DepartmentTickets (1:many as assignee)

---

## 🔧 Development Setup

### Backend
```bash
cd backend
npm install
cp env.example .env
# Configure DATABASE_URL, JWT_SECRET, etc.
npx prisma generate
npx prisma migrate dev
npm run dev  # Runs on port 5001
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL
npm run dev  # Runs on port 3000
```

### Mobile App
```bash
cd mobileapp
flutter pub get
flutter run
```

---

## 📚 Key Concepts

### Multiple Ticket Types
- Events can have multiple ticket types (VIP, Regular, Early Bird)
- Each type has pricing, capacity, benefits
- Participants select type during registration

### Auto-Assignment
- Organizers automatically assigned to agents
- Tickets automatically assigned to teams
- Workload balancing for efficiency

### Verification Workflow
- Organizers must be verified before creating events
- Agents review profiles and documents
- Approval/rejection with reasons

### Revenue Sharing
- Platform fee calculation
- Organizer revenue tracking
- Settlement processing

---

## ⚠️ Known Issues / Notes

1. **Duitku Integration**: Conditional loading (module may not be available)
2. **Garden/Pump Models**: Legacy models in schema (unused in event management)
3. **Mobile Notifications**: Temporarily disabled for location testing
4. **Midtrans SDK**: Compatibility issues in mobile app, using WebView fallback

---

## 🎯 Future Enhancements

- Skill-based assignment
- Advanced scoring algorithms
- Push notifications (mobile)
- Enhanced analytics
- Multi-language support
- Advanced reporting features

---

## 📞 API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/refresh-token` - Refresh access token

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Event details
- `PUT /api/events/:id` - Update event
- `POST /api/events/:id/register` - Register for event

### Payments
- `POST /api/payments/create-order` - Create payment order
- `GET /api/payments/:id` - Get payment status
- `POST /api/payments/gateway/midtrans/notification` - Midtrans webhook
- `POST /api/payments/gateway/duitku/notification` - Duitku webhook

### Organizers
- `POST /api/upgrade/business` - Request organizer upgrade
- `GET /api/organizers` - List organizers
- `POST /api/organizers/:id/approve` - Approve organizer
- `POST /api/organizers/:id/reject` - Reject organizer

### Certificates
- `POST /api/certificates/generate/:registrationId` - Generate certificate
- `POST /api/certificates/bulk-generate/:eventId` - Bulk generate
- `GET /api/certificates/:id` - Get certificate

### Departments
- `POST /api/department-tickets` - Create ticket
- `GET /api/department-tickets` - List tickets
- `PUT /api/department-tickets/:id` - Update ticket

---

## 🎓 Architecture Patterns

1. **Monorepo Structure**: Multiple apps in one repository
2. **Multi-platform**: Web, mobile, backend coordination
3. **Complex State Management**: Multiple user roles and workflows
4. **Payment Integration**: Multi-gateway support
5. **Auto-Assignment**: Smart workload distribution
6. **Certificate Generation**: Template-based PDF generation
7. **Department System**: Internal support ticket management
8. **Organizer Verification**: Multi-step approval workflow

---

## 📊 Performance Optimizations

### Backend
- **Lazy route loading**: Routes loaded on-demand
- **Deferred initialization**: Heavy services loaded after server starts
- **Database connection pooling**: Prisma connection management
- **Redis caching**: Optional caching layer
- **Compression**: Gzip compression for responses

### Frontend
- **Next.js App Router**: Server components for better performance
- **Code splitting**: Automatic code splitting
- **Image optimization**: Next.js Image component
- **Turbopack**: Faster builds in development

---

## 🔍 Code Quality

### Backend
- **Error Handling**: Express async errors
- **Logging**: Winston logger
- **Validation**: Joi for request validation
- **Type Safety**: Prisma for database types

### Frontend
- **TypeScript**: Full type safety
- **Form Validation**: React Hook Form + Zod
- **State Management**: Zustand, TanStack Query
- **UI Components**: Radix UI for accessibility

---

This document provides a comprehensive understanding of the NusaEvent codebase. For specific implementation details, refer to the individual service files and documentation.


