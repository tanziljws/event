# 🔍 NusaEvent Codebase Exploration Summary

## 📋 Project Overview

**NusaEvent** is a comprehensive, multi-platform Event Management System designed for the Indonesian market. It's a full-stack solution supporting web (Next.js), mobile (Flutter), and backend (Node.js/Express) with sophisticated features for event organizers, participants, and internal operations teams.

### Core Purpose
- **For Organizers**: Complete event management platform with verification, payment processing, and analytics
- **For Participants**: Easy event discovery, registration, ticket management, and certificate generation
- **For Operations**: Internal support system with smart assignment, ticket management, and analytics

---

## 🏗️ Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                  │
│  - App Router (TypeScript)                               │
│  - Tailwind CSS + Radix UI                              │
│  - Zustand + TanStack Query                             │
│  - Route Groups: (admin), (auth), (dashboard), etc.     │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────┐
│              Backend API (Node.js/Express)              │
│  - RESTful API + WebSocket                              │
│  - Prisma ORM (PostgreSQL)                              │
│  - JWT Authentication                                   │
│  - Background Jobs (node-cron)                          │
│  - Payment Gateways (Midtrans, Duitku)                 │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP
┌─────────────────────────────────────────────────────────┐
│              Mobile App (Flutter/Dart)                  │
│  - BLoC State Management                                │
│  - GoRouter Navigation                                  │
│  - QR Code Scanning                                     │
│  - Maps Integration                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend (`/backend`)
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL with Prisma ORM 5.22
- **Cache**: Redis 5.10 (optional)
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Payment**: 
  - Midtrans (midtrans-client 1.4)
  - Duitku (duitku-nodejs 0.0.8)
- **File Storage**: AWS S3 SDK 3.517
- **Email**: 
  - SendGrid (@sendgrid/mail 8.1)
  - Nodemailer 7.0
- **PDF Generation**: Puppeteer 24.19, PDFKit 0.17
- **Monitoring**: 
  - Prometheus (prom-client 15.1)
  - Sentry (@sentry/node 10.12)
  - Winston 3.11 (logging)
- **Background Jobs**: node-cron 4.2
- **WebSocket**: ws 8.18
- **Security**: Helmet, CORS, Rate Limiting, XSS Protection

### Frontend (`/frontend`)
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.3
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: 
  - Zustand 4.4 (global state)
  - TanStack Query 5.8 (server state)
- **Forms**: React Hook Form 7.48 + Zod 3.22
- **Charts**: Recharts 3.2
- **Maps**: Leaflet 1.9
- **QR Code**: jsQR 1.4, qrcode

### Mobile App (`/mobileapp`)
- **Framework**: Flutter (Dart SDK >=3.0.0 <4.0.0)
- **State Management**: BLoC 8.1
- **Navigation**: GoRouter 12.1
- **Local Storage**: SharedPreferences, Hive
- **HTTP**: Dio 5.3
- **Maps**: flutter_map 6.1
- **QR Code**: qr_flutter 4.1, mobile_scanner 5.0
- **PDF**: pdf 3.10, printing 5.11

---

## 🗄️ Database Schema (Key Models)

### User & Authentication
- **User**: Core user model with roles, departments, organizer profiles
  - Roles: `SUPER_ADMIN`, `CS_HEAD`, `CS_AGENT`, `OPS_HEAD`, `OPS_AGENT`, `FINANCE_HEAD`, `FINANCE_AGENT`, `ORGANIZER`, `PARTICIPANT`
  - Departments: `CUSTOMER_SERVICE`, `OPERATIONS`, `FINANCE`
  - Organizer Types: `INDIVIDUAL`, `COMMUNITY`, `SMALL_BUSINESS`, `INSTITUTION`
  - Verification Status: `PENDING`, `APPROVED`, `REJECTED`
- **OtpVerification**: OTP for email verification and password reset
- **ActivityLog**: User activity tracking

### Event Management
- **Event**: Core event model
  - Status: `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `PUBLISHED`, `COMPLETED`, `CANCELLED`
  - Category: `CONFERENCE`, `WORKSHOP`, `SEMINAR`, `CONCERT`, `SPORTS`, `EXHIBITION`, `FESTIVAL`, `OTHER`
  - Features: Multiple ticket types, geocoding (lat/lng), certificate templates, private events
- **TicketType**: Multiple ticket types per event (VIP, Regular, Early Bird, etc.)
- **EventRegistration**: Participant registrations with tokens
- **Ticket**: Individual tickets with QR codes
- **EventCancellation**: Event cancellation tracking

### Organizer System
- **IndividualProfile**: Personal organizer profiles
- **CommunityProfile**: Community group profiles
- **BusinessProfile**: Business profiles with NPWP
- **InstitutionProfile**: Educational/Government institution profiles
- **OrganizerRevenue**: Revenue tracking and settlements
- **Verification**: PENDING → APPROVED/REJECTED workflow with assignment

### Payment System
- **Payment**: Payment records with gateway integration
  - Status: `PENDING`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED`
  - Gateway: `MIDTRANS`, `DUITKU`, `MANUAL`
- **Refund**: Refund processing and tracking
- **OrganizerRevenue**: Revenue sharing and settlements

### Certificate System
- **Certificate**: Generated certificates for participants
- **CertificateTemplate**: Event-specific templates
- **GlobalCertificateTemplate**: Reusable templates across events

### Support System (Departments)
- **DepartmentTicket**: Support tickets
  - Status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`
  - Priority: `LOW`, `NORMAL`, `HIGH`, `URGENT`
- **Team**: Support teams (`PAYMENT_FINANCE`, `TECHNICAL_SUPPORT`, `GENERAL_SUPPORT`)
- **TeamMember**: Team membership
- **TeamAssignment**: Ticket-to-team assignments
- **TicketComment**: Ticket discussions

### Assignment System
- **AssignmentQueue**: Queue for pending assignments
- **AssignmentHistory**: Assignment audit trail

### Analytics & Reporting
- **PlatformAnalytics**: Platform-wide metrics
- **AuditLog**: System audit trail
- **Notification**: User notifications

---

## 🔐 Authentication & Authorization

### User Roles Hierarchy

```
SUPER_ADMIN
├── CS_HEAD / CS_AGENT (Customer Service)
├── OPS_HEAD / OPS_AGENT (Operations)
├── FINANCE_HEAD / FINANCE_AGENT (Finance)
├── ORGANIZER (Verified event organizers)
└── PARTICIPANT (Regular users)
```

### Authentication Flow
1. **Register** → Email verification (OTP)
2. **Login** → JWT access + refresh tokens
3. **Password Reset** → OTP via email
4. **Role-based Access Control** → Middleware checks

### Organizer Upgrade Flow
1. **PARTICIPANT** → Request upgrade with profile
2. **Auto-assignment** → SmartAssignmentService assigns to OPS agent
3. **Verification** → Agent reviews profile and documents
4. **APPROVED** → Can create events

---

## 🎫 Event Management Flow

### Event Lifecycle
```
DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED → COMPLETED/CANCELLED
```

### Event Creation Process
1. **Organizer** creates event (DRAFT status)
2. **Auto-publish** (or manual approval for certain types)
3. **Multiple Ticket Types** supported (VIP, Regular, Early Bird, etc.)
4. **Location** with geocoding (latitude/longitude)
5. **Certificate Templates** for attendance

### Registration Flow
1. **Participant** browses events (public or private with password)
2. **Selects Ticket Type** (if multiple types available)
3. **Registers** → Creates EventRegistration record
4. **Payment** → Gateway integration (Midtrans/Duitku)
5. **Ticket Generation** → QR code created automatically
6. **Confirmation Email** sent to participant

### Attendance Flow
1. **Event Day** → QR code scan by organizer/admin
2. **Attendance Recorded** → EventRegistration updated
3. **Certificate Generated** → (if enabled for event)
4. **Download Available** → Participant dashboard

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

### Refund Flow
- **Event Cancellation** → Automatic refunds
- **Manual Refund** → Admin-initiated
- **Settlement Tracking** → Finance department

---

## 👥 Organizer System

### Organizer Types
1. **INDIVIDUAL**: Personal organizers
2. **COMMUNITY**: Community groups
3. **SMALL_BUSINESS**: Small businesses
4. **INSTITUTION**: Educational/Government institutions

### Verification Process
1. **Upgrade Request** → User submits profile with documents
2. **Auto-Assignment** → SmartAssignmentService assigns to agent
3. **Agent Review** → Verify documents and profile
4. **Approval/Rejection** → Status updated with reason
5. **Notification** → Email to user

### Smart Assignment Algorithm
- **Workload-based**: Assigns to agent with lowest workload
- **Round-robin**: Alternating assignment
- **Advanced**: Scoring algorithm (future enhancement)
- **Queue System**: Handles overflow

---

## 🎫 Support System (Departments)

### Departments
1. **CUSTOMER_SERVICE**: General support
2. **OPERATIONS**: Event/organizer management
3. **FINANCE**: Payment/refund management

### Teams
- **PAYMENT_FINANCE**: Payment issues
- **TECHNICAL_SUPPORT**: Technical problems
- **GENERAL_SUPPORT**: General inquiries

### Ticket Flow
1. **Create Ticket** → From contact form or dashboard
2. **Auto-Assignment** → Based on category → Team → Agent
3. **Agent Response** → Comments added
4. **Status Updates** → OPEN → IN_PROGRESS → RESOLVED
5. **Escalation** → For overdue tickets

---

## 📊 Certificate System

### Certificate Generation
- **Template-based**: Event-specific or global templates
- **Dynamic Fields**: Participant name, event details, date
- **PDF Generation**: Puppeteer/PDFKit
- **Verification Hash**: Blockchain-style verification (optional)

### Certificate Types
1. **Event Certificates**: Auto-generated after attendance
2. **Global Templates**: Reusable across events
3. **Custom Templates**: Per-event customization

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

## 📈 Key Services

### Smart Assignment Service (`smartAssignmentService.js`)
- **Purpose**: Automatically assign organizers and tickets to agents
- **Strategies**: Workload-based, Round-robin, Skill-based, Advanced
- **Features**: 
  - Capacity management (max 20 per agent)
  - Workload calculation
  - Queue processing
  - Assignment history

### Payment Gateway Service (`paymentGatewayService.js`)
- **Purpose**: Handle payment processing with multiple gateways
- **Gateways**: Midtrans (primary), Duitku (alternative)
- **Features**:
  - Payment creation
  - Webhook handling
  - Payment verification
  - Refund processing

### Event Service (`eventService.js`)
- **Purpose**: Core event management logic
- **Features**:
  - Event CRUD operations
  - Multiple ticket types support
  - Geocoding integration
  - Capacity management
  - Auto-assignment

### Email Service (`emailService.js`)
- **Purpose**: Send transactional emails
- **Providers**: SendGrid, Nodemailer
- **Templates**: Handlebars templates
- **Types**: OTP, confirmations, reminders, notifications

### Certificate Service (`certificateService.js`)
- **Purpose**: Generate certificates for participants
- **Features**: Template-based generation, PDF creation, verification

### Queue Processor (`queueProcessor.js`)
- **Purpose**: Process assignment queue asynchronously
- **Features**: Background processing, retry logic, error handling

### WebSocket Service (`websocketService.js`)
- **Purpose**: Real-time notifications
- **Features**: Connection management, message broadcasting

---

## 🔄 Background Jobs

### Scheduled Jobs (node-cron)
1. **Event Reminder** (`eventReminderJob.js`): Send reminders H-1, H-0
2. **Escalation** (`escalationJob.js`): Escalate overdue tickets
3. **Crypto Monitoring** (`cryptoMonitoring.js`): Monitor payment status
4. **Queue Processing**: Process assignment queue
5. **Analytics Aggregation**: Daily metrics

---

## 📱 Frontend Architecture

### Route Groups (Next.js App Router)
- `(admin)`: Admin dashboard and management
- `(auth)`: Authentication pages
- `(dashboard)`: User dashboard
- `(organizer)`: Organizer features
- `(department)`: Department dashboards
- `(public)`: Public event pages

### Key Pages
- **Event Listing**: Search, filter, pagination
- **Event Detail**: Registration, ticket selection
- **Dashboard**: User stats, registrations, certificates
- **Admin Panel**: Full system management
- **Organizer Panel**: Event management
- **Department Panels**: Ticket management

### State Management
- **Zustand**: Global state (auth, user preferences)
- **TanStack Query**: Server state (API data, caching)
- **React Hook Form**: Form state management

---

## 🚀 Deployment

### Backend
- **Platform**: Railway (primary)
- **Database**: PostgreSQL (managed)
- **Environment**: `.env` configuration
- **Docker**: Containerization support
- **Monitoring**: Prometheus, Grafana, Sentry

### Frontend
- **Platform**: Vercel/Next.js hosting
- **API Integration**: Backend URL configuration
- **Environment Variables**: `NEXT_PUBLIC_API_URL`

### Mobile App
- **Platform**: Flutter build (Android/iOS)
- **API Integration**: Backend URL configuration
- **WebView**: Payment gateway fallback

---

## 🔒 Security Features

### Backend Security
- **Helmet.js**: Security headers
- **CORS**: Cross-origin protection with whitelist
- **Rate Limiting**: API protection (express-rate-limit)
- **XSS Protection**: Input sanitization (DOMPurify)
- **JWT**: Secure authentication with refresh tokens
- **Password Hashing**: bcryptjs
- **Audit Logging**: Complete audit trail
- **Input Validation**: Joi, express-validator

### Data Protection
- **Input Validation**: Joi, Zod
- **SQL Injection**: Prisma parameterized queries
- **File Upload**: Validation, size limits
- **Session Management**: Token versioning

---

## 📊 Analytics & Reporting

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

## 🎯 Key Features Summary

### For Organizers
✅ Event creation with multiple ticket types
✅ Organizer verification workflow
✅ Payment processing (Midtrans/Duitku)
✅ Revenue tracking and settlements
✅ Attendance management with QR scanning
✅ Certificate template management
✅ Analytics dashboard
✅ Private event support

### For Participants
✅ Event browsing and search
✅ Registration with payment
✅ QR code tickets
✅ Attendance scanning
✅ Certificate download
✅ Profile management
✅ Registration history

### For Operations Teams
✅ Smart assignment system
✅ Ticket management
✅ Organizer verification
✅ Event approval workflow
✅ Analytics and reporting
✅ Audit logging

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

## 📝 Key Concepts

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

## 🐛 Known Issues / Notes

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

## 📚 API Endpoints Overview

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

## 🎓 Architecture Highlights

1. **Monorepo Structure**: Multiple apps in one repository
2. **Multi-platform**: Web, mobile, backend coordination
3. **Complex State Management**: Multiple user roles and workflows
4. **Payment Integration**: Multi-gateway support
5. **Auto-Assignment**: Smart workload distribution
6. **Certificate Generation**: Template-based PDF generation
7. **Department System**: Internal support ticket management
8. **Organizer Verification**: Multi-step approval workflow
9. **Lazy Loading**: Routes loaded on-demand for faster startup
10. **WebSocket**: Real-time notifications

---

## 📞 Project Status

- ✅ Backend API fully functional
- ✅ Frontend web application complete
- ✅ Mobile app (Flutter) implemented
- ✅ Payment integration (Midtrans, Duitku)
- ✅ Certificate generation system
- ✅ Smart assignment system
- ✅ Department support system
- ✅ Analytics and reporting
- ✅ Deployment on Railway
- ⚠️ Some features in development/testing

---

**Last Updated**: Based on codebase exploration
**Version**: 1.0.3 (Backend), 1.0.0 (Frontend), 1.0.0+1 (Mobile)

