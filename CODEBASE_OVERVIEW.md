# NusaEvent - Codebase Overview

## 🎯 Project Summary

**NusaEvent** is a comprehensive Event Management System (Sistem Informasi Manajemen Kegiatan) with a multi-platform architecture supporting web (Next.js), mobile (Flutter), and backend (Node.js/Express) components.

---

## 🏗️ Architecture Overview

### Tech Stack

#### Backend (`/backend`)
- **Framework**: Node.js 20+ with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (optional)
- **Authentication**: JWT with refresh tokens
- **Payment Gateways**: Midtrans, Duitku
- **File Storage**: AWS S3, local uploads
- **Email**: SendGrid, Nodemailer
- **Monitoring**: Prometheus, Grafana, Sentry
- **Background Jobs**: Node-cron
- **WebSocket**: Real-time notifications

#### Frontend (`/frontend`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Maps**: Leaflet
- **QR Code**: jsQR, qrcode

#### Mobile App (`/mobileapp`)
- **Framework**: Flutter (Dart)
- **State Management**: BLoC
- **Navigation**: GoRouter
- **Local Storage**: SharedPreferences, Hive
- **HTTP**: Dio
- **Maps**: flutter_map
- **QR Code**: qr_flutter, mobile_scanner
- **PDF**: pdf, printing

---

## 📂 Project Structure

### Backend Structure
```
backend/
├── src/
│   ├── app.js                    # Main Express app
│   ├── config/                   # Configuration files
│   │   ├── database.js          # Prisma + Redis setup
│   │   ├── email.js             # Email templates
│   │   ├── logger.js            # Winston logger
│   │   └── sentry.js            # Error tracking
│   ├── controllers/             # Request handlers (13 files)
│   ├── services/                # Business logic (28 files)
│   │   ├── smartAssignmentService.js  # Auto-assignment
│   │   ├── paymentGatewayService.js   # Payment integration
│   │   ├── eventService.js            # Event management
│   │   └── ...
│   ├── routes/                  # API routes (28 files)
│   │   ├── auth.js             # Authentication
│   │   ├── events.js           # Event CRUD
│   │   ├── payments.js         # Payment processing
│   │   ├── organizers.js       # Organizer management
│   │   └── ...
│   ├── middlewares/            # Custom middlewares
│   ├── jobs/                   # Background jobs
│   │   ├── eventReminderJob.js
│   │   ├── escalationJob.js
│   │   └── cryptoMonitoring.js
│   └── templates/              # Email templates (Handlebars)
├── prisma/
│   └── schema.prisma           # Database schema
└── uploads/                    # File uploads
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin routes
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # User dashboard
│   │   ├── (organizer)/       # Organizer routes
│   │   ├── (department)/      # Department routes
│   │   └── (public)/          # Public routes
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript types
└── public/                    # Static assets
```

---

## 🗄️ Database Schema (Key Models)

### User & Authentication
- **User**: Core user model with roles, departments, organizer profiles
- **OtpVerification**: OTP for email verification and password reset
- **ActivityLog**: User activity tracking

### Event Management
- **Event**: Event details, pricing, location, status workflow
- **TicketType**: Multiple ticket types per event with pricing
- **EventRegistration**: Participant registrations with tokens
- **Ticket**: Individual tickets with QR codes
- **EventCancellation**: Event cancellation tracking

### Organizer System
- **Organizer Profiles**: 
  - IndividualProfile
  - CommunityProfile
  - BusinessProfile
  - InstitutionProfile
- **OrganizerRevenue**: Revenue tracking and settlements
- **Verification**: PENDING → APPROVED/REJECTED workflow

### Payment System
- **Payment**: Payment records with gateway integration
- **Refund**: Refund processing and tracking
- **OrganizerRevenue**: Revenue sharing and settlements

### Certificate System
- **Certificate**: Generated certificates
- **CertificateTemplate**: Event-specific templates
- **GlobalCertificateTemplate**: Reusable templates

### Support System (Departments)
- **DepartmentTicket**: Support tickets
- **Team**: Support teams (PAYMENT_FINANCE, TECHNICAL_SUPPORT, etc.)
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

### User Roles
1. **SUPER_ADMIN**: System administrator
2. **CS_HEAD / CS_AGENT**: Customer Success department
3. **OPS_HEAD / OPS_AGENT**: Operations department
4. **FINANCE_HEAD / FINANCE_AGENT**: Finance department
5. **ORGANIZER**: Event organizers (verified)
6. **PARTICIPANT**: Regular users

### Authentication Flow
1. **Register** → Email verification (OTP)
2. **Login** → JWT access + refresh tokens
3. **Password Reset** → OTP via email
4. **Role-based Access Control** → Middleware checks

### Organizer Upgrade Flow
1. **PARTICIPANT** → Request upgrade
2. **Auto-assignment** → Assigned to OPS agent
3. **Verification** → Agent reviews profile
4. **APPROVED** → Can create events

---

## 🎫 Event Management Flow

### Event Lifecycle
```
DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED → COMPLETED/CANCELLED
```

### Event Creation
1. **Organizer** creates event (DRAFT)
2. **Auto-publish** (or manual approval for some types)
3. **Multiple Ticket Types** supported
4. **Location** with geocoding (lat/lng)
5. **Certificate Templates** for attendance

### Registration Flow
1. **Participant** browses events
2. **Selects Ticket Type** (if multiple)
3. **Registers** → Creates EventRegistration
4. **Payment** → Gateway integration (Midtrans/Duitku)
5. **Ticket Generation** → QR code created
6. **Confirmation Email** sent

### Attendance Flow
1. **Event Day** → QR code scan
2. **Attendance Recorded** → EventRegistration updated
3. **Certificate Generated** → (if enabled)
4. **Download Available** → Participant dashboard

---

## 💳 Payment System

### Payment Gateways
- **Midtrans**: Primary gateway (Snap integration)
- **Duitku**: Alternative gateway

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
1. **Upgrade Request** → User submits profile
2. **Auto-Assignment** → SmartAssignmentService assigns to agent
3. **Agent Review** → Verify documents and profile
4. **Approval/Rejection** → Status updated
5. **Notification** → Email to user

### Smart Assignment
- **Workload-based**: Assigns to agent with lowest workload
- **Round-robin**: Alternating assignment
- **Advanced**: Scoring algorithm (future)
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
- **Environment**: `.env` configuration
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

## 🐛 Known Issues / Notes

1. **Duitku Integration**: Conditional loading (module may not be available)
2. **Garden/Pump Models**: Legacy models in schema (unused in event management)
3. **Mobile Notifications**: Temporarily disabled for location testing
4. **Midtrans SDK**: Compatibility issues in mobile app, using WebView fallback

---

## 🎯 Future Enhancements (From Codebase Hints)

- Skill-based assignment
- Advanced scoring algorithms
- Push notifications (mobile)
- Enhanced analytics
- Multi-language support
- Advanced reporting features

---

## 📞 API Endpoints Overview

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

## 🎓 Learning Points

1. **Monorepo Structure**: Multiple apps in one repository
2. **Multi-platform**: Web, mobile, backend coordination
3. **Complex State Management**: Multiple user roles and workflows
4. **Payment Integration**: Multi-gateway support
5. **Auto-Assignment**: Smart workload distribution
6. **Certificate Generation**: Template-based PDF generation
7. **Department System**: Internal support ticket management
8. **Organizer Verification**: Multi-step approval workflow

---

This overview provides a comprehensive understanding of the NusaEvent codebase structure, features, and architecture. For specific implementation details, refer to the individual service files and documentation.

