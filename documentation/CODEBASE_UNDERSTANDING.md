# NusaEvent - Codebase Understanding Summary

## 🎯 Project Overview

**NusaEvent** is a comprehensive **Event Management System** (Sistem Informasi Manajemen Kegiatan) designed for managing events, registrations, payments, certificates, and support operations. It's a **multi-platform application** with:

- **Web Frontend**: Next.js 14 (TypeScript, Tailwind CSS)
- **Backend API**: Node.js/Express with PostgreSQL
- **Mobile App**: Flutter (Dart) for iOS/Android

---

## 🏗️ Architecture Overview

### Tech Stack Summary

#### Backend (`/backend`)
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (optional)
- **Auth**: JWT with refresh tokens
- **Payment**: Midtrans, Duitku integration
- **Storage**: AWS S3 + local uploads
- **Email**: SendGrid, Nodemailer
- **Monitoring**: Prometheus, Grafana, Sentry
- **Jobs**: Node-cron for scheduled tasks
- **Real-time**: WebSocket for notifications

#### Frontend (`/frontend`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: Radix UI components, Lucide icons
- **State**: Zustand, TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Maps**: Leaflet
- **QR**: jsQR library

#### Mobile (`/mobileapp`)
- **Framework**: Flutter (Dart)
- **State**: BLoC pattern
- **Navigation**: GoRouter
- **Storage**: SharedPreferences, Hive
- **HTTP**: Dio
- **Maps**: flutter_map
- **QR**: qr_flutter, mobile_scanner
- **PDF**: pdf, printing packages

---

## 📂 Project Structure Deep Dive

### Backend Structure (`/backend/src/`)

#### Core Files
- `app.js` - Main Express application setup
- `config/` - Configuration files (database, email, logger, sentry)

#### Routes (28 files)
Key routes include:
- `auth.js` - Authentication endpoints
- `events.js` - Event CRUD operations
- `payments.js` - Payment processing
- `organizers.js` - Organizer management
- `department-tickets.js` - Support ticket system
- `certificates.js` - Certificate generation
- `analytics.js` - Analytics endpoints
- `admin.js` - Admin operations

#### Services (28 files)
Business logic layer:
- `eventService.js` - Event management
- `paymentGatewayService.js` - Payment integration
- `smartAssignmentService.js` - Auto-assignment logic
- `certificateService.js` - Certificate generation
- `emailService.js` - Email notifications
- `notificationService.js` - In-app notifications
- `analyticsService.js` - Analytics aggregation

#### Controllers (13 files)
Request handlers that call services

#### Jobs (3 files)
Background scheduled tasks:
- `eventReminderJob.js` - Send event reminders
- `escalationJob.js` - Escalate overdue tickets
- `cryptoMonitoring.js` - Monitor payment status

### Frontend Structure (`/frontend/src/app/`)

#### Route Groups (Next.js App Router)
- `(admin)/` - Admin dashboard and management
- `(auth)/` - Login, register, password reset
- `(dashboard)/` - User dashboard, registrations, certificates
- `(organizer)/` - Organizer event management
- `(department)/` - Department dashboards (CS, Finance, Operations)
- `(public)/` - Public event pages, about, contact

#### Key Pages
- Event listing with search/filter
- Event detail with registration
- Admin panel for system management
- Organizer panel for event management
- Department panels for ticket management
- Certificate templates and generation

### Mobile App Structure (`/mobileapp/lib/`)

#### Features (Feature-based architecture)
- `auth/` - Authentication flows
- `events/` - Event browsing and details
- `registration/` - Event registration
- `payments/` - Payment processing
- `attendance/` - QR code scanning
- `certificates/` - Certificate viewing/download
- `organizer/` - Organizer features
- `analytics/` - Analytics dashboards
- `notifications/` - Push notifications
- `tickets/` - Support tickets

#### Core Services
- `auth_service.dart` - Authentication
- `event_service.dart` - Event operations
- `payment_service.dart` - Payment handling
- `certificate_service.dart` - Certificate management

---

## 🗄️ Database Schema (Key Models)

### User & Authentication
- **User**: Core user with roles, departments, organizer profiles
- **OtpVerification**: Email verification and password reset
- **ActivityLog**: User activity tracking

### Event Management
- **Event**: Event details, pricing, location, status workflow
- **TicketType**: Multiple ticket types per event (VIP, Regular, etc.)
- **EventRegistration**: Participant registrations
- **Ticket**: Individual tickets with QR codes
- **EventCancellation**: Cancellation tracking

### Organizer System
- **Organizer Profiles**: Individual, Community, Business, Institution
- **OrganizerRevenue**: Revenue tracking and settlements
- **Verification**: PENDING → APPROVED/REJECTED workflow

### Payment System
- **Payment**: Payment records with gateway integration
- **Refund**: Refund processing
- **OrganizerRevenue**: Revenue sharing

### Certificate System
- **Certificate**: Generated certificates
- **CertificateTemplate**: Event-specific templates
- **GlobalCertificateTemplate**: Reusable templates

### Support System
- **DepartmentTicket**: Support tickets
- **Team**: Support teams (PAYMENT_FINANCE, TECHNICAL_SUPPORT, etc.)
- **TeamMember**: Team membership
- **TeamAssignment**: Ticket assignments
- **TicketComment**: Ticket discussions

### Assignment System
- **AssignmentQueue**: Queue for pending assignments
- **AssignmentHistory**: Assignment audit trail

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
1. Register → Email verification (OTP)
2. Login → JWT access + refresh tokens
3. Password Reset → OTP via email
4. Role-based Access Control → Middleware checks

### Organizer Upgrade Flow
1. PARTICIPANT requests upgrade
2. Auto-assignment to OPS agent
3. Agent reviews profile
4. APPROVED → Can create events

---

## 🎫 Event Management Flow

### Event Lifecycle
```
DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED → COMPLETED/CANCELLED
```

### Event Creation Process
1. Organizer creates event (DRAFT)
2. Auto-publish or manual approval
3. Multiple ticket types supported
4. Location with geocoding
5. Certificate templates for attendance

### Registration Flow
1. Participant browses events
2. Selects ticket type (if multiple)
3. Registers → Creates EventRegistration
4. Payment → Gateway integration
5. Ticket generation → QR code created
6. Confirmation email sent

### Attendance Flow
1. Event day → QR code scan
2. Attendance recorded
3. Certificate generated (if enabled)
4. Download available in dashboard

---

## 💳 Payment System

### Payment Gateways
- **Midtrans**: Primary gateway (Snap integration)
- **Duitku**: Alternative gateway

### Payment Flow
1. Registration → Payment record created
2. Gateway payment → Redirect to payment page
3. Webhook → Status update from gateway
4. Confirmation → Registration confirmed
5. Revenue split → Organizer revenue calculated

### Payment Methods
- Bank Transfer
- E-Wallet
- Credit Card
- QR Code
- Cash (manual)

### Refund Flow
- Event cancellation → Automatic refunds
- Manual refund → Admin-initiated
- Settlement tracking → Finance department

---

## 👥 Organizer System

### Organizer Types
1. **INDIVIDUAL** - Personal organizers
2. **COMMUNITY** - Community groups
3. **SMALL_BUSINESS** - Small businesses
4. **INSTITUTION** - Educational/Government institutions

### Verification Process
1. Upgrade request → User submits profile
2. Auto-assignment → SmartAssignmentService assigns to agent
3. Agent review → Verify documents
4. Approval/Rejection → Status updated
5. Notification → Email to user

### Smart Assignment
- Workload-based assignment
- Round-robin distribution
- Queue system for overflow
- Future: Advanced scoring algorithm

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
1. Create ticket → From contact form or dashboard
2. Auto-assignment → Based on category → Team → Agent
3. Agent response → Comments added
4. Status updates → OPEN → IN_PROGRESS → RESOLVED
5. Escalation → For overdue tickets

---

## 📊 Certificate System

### Certificate Generation
- Template-based system
- Dynamic fields (name, event details, date)
- PDF generation
- Verification hash (blockchain-style, optional)

### Certificate Types
1. Event certificates - Auto-generated after attendance
2. Global templates - Reusable across events
3. Custom templates - Per-event customization

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
- Email (SendGrid/Nodemailer)
- In-app notifications
- WebSocket (real-time)
- Push notifications (mobile - planned)

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
- Helmet.js - Security headers
- CORS - Cross-origin protection
- Rate Limiting - API protection
- XSS Protection - Input sanitization
- JWT - Secure authentication
- Password Hashing - bcrypt
- Audit Logging - Complete audit trail

### Data Protection
- Input Validation - Joi, Zod
- SQL Injection - Prisma parameterized queries
- File Upload - Validation, size limits
- Session Management - Token versioning

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
1. **Event Reminder** - Send reminders H-1, H-0
2. **Escalation** - Escalate overdue tickets
3. **Crypto Monitoring** - Monitor payment status
4. **Queue Processing** - Process assignment queue
5. **Analytics Aggregation** - Daily metrics

---

## 📝 Key Services

### Smart Assignment Service
- Workload-based assignment
- Queue management
- Assignment history
- Agent capacity management

### Payment Gateway Service
- Multi-gateway support (Midtrans, Duitku)
- Webhook handling
- Payment verification
- Refund processing

### Email Service
- Template-based emails
- OTP generation
- Notification emails
- Multi-provider support (SendGrid, Nodemailer)

### Certificate Service
- Template management
- PDF generation
- Verification hashing
- Batch processing

---

## 🎨 Frontend Architecture

### Route Groups
- `(admin)` - Admin dashboard and management
- `(auth)` - Authentication pages
- `(dashboard)` - User dashboard
- `(organizer)` - Organizer features
- `(department)` - Department dashboards
- `(public)` - Public event pages

### Key Pages
- Event listing with search/filter
- Event detail with registration
- Dashboard with stats
- Admin panel
- Organizer panel
- Department panels

---

## 📱 Mobile App Features

### Participant Features
- Event browsing and search
- Registration with payment
- QR code tickets
- Attendance scanning
- Certificate download
- Profile management

### Organizer Features
- Event creation/editing
- Registration management
- Attendance tracking
- Analytics dashboard
- Revenue tracking

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

## 🎯 Current State & Optimization

### Dependency Audit (Frontend)
Based on `DEPENDENCY_AUDIT.md`:
- **Unused dependencies identified**:
  - `react-signature-canvas` - Not used
  - `react-qr-scanner` - Not used (using jsqr directly)
  - `simple-icons` - Redundant with react-icons
  - `sonner` - Not used
  - `prisma` - Usually only needed in backend

- **Potential savings**: ~16MB (mainly from prisma)

### Performance Optimizations
- Frontend performance fixes documented
- Cache clearing scripts available
- Turbopack configuration for faster builds

---

## 🔍 API Endpoints Overview

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/refresh-token`

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Event details
- `PUT /api/events/:id` - Update event

### Payments
- `POST /api/payments/create-order`
- `POST /api/payments/gateway/...`
- `GET /api/payments/:id`

### Organizers
- `POST /api/upgrade/business` - Request upgrade
- `GET /api/organizers` - List organizers
- `POST /api/organizers/:id/approve` - Approve organizer

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

## 📞 Critical System Features

### Payment Backup Strategy
- Payment gateway independent (99.99% uptime)
- Queue system with retry mechanism
- Webhook retry from gateway
- Database backup harian
- Manual reconciliation process

### Offline Capabilities
- Mobile app offline mode
- QR code download before event
- Manual attendance fallback
- Data sync when online

### Disaster Recovery
- Daily backups with 30-day retention
- Real-time database replication
- Automated failover
- RTO < 4 hours, RPO < 1 hour
- Multiple data centers

### Scalability
- Load balancing
- Auto-scaling servers
- Database optimization
- Tested capacity: 50,000+ concurrent users

---

## 🚀 Future Enhancements

- Skill-based assignment
- Advanced scoring algorithms
- Push notifications (mobile)
- Enhanced analytics
- Multi-language support
- Advanced reporting features

---

This document provides a comprehensive understanding of the NusaEvent codebase structure, features, and architecture. For specific implementation details, refer to the individual service files and documentation.

