# 🔍 Frontend Codebase Exploration - NusaEvent

## 📋 Overview

The **NusaEvent Frontend** is a modern Next.js 14 application built with TypeScript, using the App Router architecture. It's a comprehensive event management platform with sophisticated UI/UX, role-based access control, and real-time features.

---

## 🏗️ Architecture

### Framework & Core
- **Next.js 14.2.18** (App Router)
- **TypeScript 5** (strict mode disabled for faster development)
- **React 18.3.1**
- **Tailwind CSS 3.3** for styling
- **Radix UI** components for accessible UI primitives

### State Management
- **Zustand 4.4** - Global state management (auth, preferences)
- **TanStack Query 5.8** - Server state management (API data, caching)
- **React Hook Form 7.48** - Form state management
- **Zod 3.22** - Schema validation

### Key Libraries
- **Axios 1.6** - HTTP client
- **Recharts 3.2** - Data visualization
- **Leaflet 1.9** - Maps integration
- **jsQR 1.4** - QR code scanning
- **html2canvas + jsPDF** - PDF generation
- **Lucide React** - Icon library

---

## 📂 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin route group
│   │   ├── (auth)/            # Auth route group
│   │   ├── (dashboard)/       # User dashboard group
│   │   ├── (department)/      # Department dashboards
│   │   ├── (organizer)/       # Organizer features
│   │   ├── (public)/          # Public routes
│   │   ├── api/               # API routes (geocoding, admin)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── auth/              # Auth components
│   │   ├── calendar/          # Calendar components
│   │   ├── certificate/       # Certificate editor
│   │   ├── dashboard/         # Dashboard components
│   │   ├── events/            # Event components
│   │   ├── layout/            # Layout components
│   │   ├── payment/           # Payment components
│   │   └── ui/                # UI primitives (Radix UI)
│   ├── contexts/              # React contexts
│   │   ├── auth-context.tsx   # Authentication context
│   │   └── error-context.tsx  # Error handling context
│   ├── hooks/                 # Custom React hooks
│   │   └── use-toast.ts      # Toast notifications
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # API service (Axios)
│   │   ├── image-utils.ts    # Image utilities
│   │   └── utils.ts          # General utilities
│   ├── types/                 # TypeScript types
│   │   ├── index.ts          # Main types
│   │   └── certificate.ts    # Certificate types
│   └── middleware.ts          # Next.js middleware
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

---

## 🎯 Route Groups (App Router)

### `(admin)` - Admin Dashboard
- `/admin/dashboard` - Admin dashboard
- `/admin/events` - Event management
- `/admin/organizers` - Organizer management
- `/admin/users` - User management
- `/admin/analytics` - Platform analytics
- `/admin/teams` - Team management
- `/admin/departments` - Department management
- `/admin/certificate-templates` - Certificate templates
- `/admin/attendance` - Attendance management

### `(auth)` - Authentication
- `/login` - Login page
- `/register` - Registration page
- `/verify-email` - Email verification (OTP)
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset
- `/upgrade-business` - Organizer upgrade

### `(dashboard)` - User Dashboard
- `/dashboard` - User dashboard
- `/my-registrations` - Event registrations
- `/my-certificates` - Certificates
- `/tickets` - Ticket management
- `/profile` - User profile

### `(organizer)` - Organizer Features
- `/organizer` - Organizer dashboard
- `/organizer/events` - Event management
- `/organizer/events/create` - Create event
- `/organizer/events/[id]/edit` - Edit event
- `/organizer/events/[id]/analytics` - Event analytics
- `/organizer/attendance` - Attendance tracking
- `/organizer/analytics` - Organizer analytics

### `(department)` - Department Dashboards
- `/department/customer_service` - CS dashboard
- `/department/operations` - Operations dashboard
- `/department/finance` - Finance dashboard

### `(public)` - Public Routes
- `/` - Homepage
- `/events` - Event listing
- `/events/[id]` - Event details
- `/about` - About page
- `/contact` - Contact page
- `/pricing` - Pricing page

---

## 🔐 Authentication System

### Auth Context (`auth-context.tsx`)
- **State Management**: User state, authentication status, session management
- **Token Management**: Access token (localStorage), refresh token (HttpOnly cookie)
- **Auto Refresh**: Token refresh every 14 minutes (tokens expire in 15 minutes)
- **Session Expiry**: Automatic logout on session expiry

### Features
- ✅ Login/Logout
- ✅ Registration (Participant & Organizer)
- ✅ Email verification (OTP)
- ✅ Password reset (OTP)
- ✅ Profile management
- ✅ Token refresh mechanism
- ✅ Session expiry handling

### Auth Flow
1. **Login** → Store access token → Setup refresh interval
2. **Token Expiry** → Auto refresh → Retry request
3. **Refresh Failure** → Clear session → Redirect to login
4. **Session Expiry** → Show toast → Redirect to login

---

## 🌐 API Service (`lib/api.ts`)

### Configuration
- **Base URL**: `NEXT_PUBLIC_API_URL` or `http://localhost:5000/api`
- **Timeout**: 10 seconds
- **Credentials**: `withCredentials: true` (for HttpOnly cookies)

### Request Interceptor
- Adds `Authorization: Bearer <token>` header from localStorage
- Handles token injection automatically

### Response Interceptor
- **401 Error** → Attempt token refresh → Retry original request
- **Refresh Failure** → Clear tokens → Redirect to login
- Enhanced error logging for debugging

### API Methods
- **Auth**: `register`, `login`, `logout`, `verifyEmail`, `refreshToken`
- **Events**: `getEvents`, `getEvent`, `createEvent`, `updateEvent`
- **Payments**: `createPaymentOrder`, `getPaymentStatus`
- **Organizers**: `getOrganizers`, `approveOrganizer`
- **Tickets**: `getTickets`, `scanTicket`
- **Certificates**: `getCertificates`, `downloadCertificate`
- **Departments**: `getTickets`, `updateTicket`, `createTicket`
- **Analytics**: `getAnalytics`, `getEventAnalytics`

---

## 🎨 UI Components

### UI Primitives (`components/ui/`)
Built on **Radix UI** for accessibility:
- `button.tsx` - Button component
- `input.tsx` - Input field
- `dialog.tsx` - Modal dialogs
- `select.tsx` - Select dropdown
- `tabs.tsx` - Tab navigation
- `toast.tsx` - Toast notifications
- `card.tsx` - Card container
- `badge.tsx` - Badge component
- `skeleton.tsx` - Loading skeleton
- `loading.tsx` - Loading spinner

### Feature Components
- **Auth**: `protected-route.tsx`, `role-guard.tsx`, `session-status.tsx`
- **Events**: `TicketTypeSelector.tsx`, `CustomTicketForm.tsx`, `TicketPreview.tsx`
- **Certificate**: `CanvasEditor.tsx`, `ElementProperties.tsx`, `SimpleElementEditor.tsx`
- **Payment**: `payment-modal.tsx`
- **QR**: `qr-scanner.tsx`
- **Layout**: `navbar.tsx`, `operations-layout.tsx`, `organizer-layout.tsx`

---

## 🏠 Homepage (`app/page.tsx`)

### Features
- **Hero Section**: Sheila On 7 concert promotion
- **Scroll Animations**: Text animations on scroll
- **Countdown Timer**: Event countdown
- **Featured Events**: Dynamic event cards
- **Parallax Effects**: Layered background effects
- **Firework Effects**: Animated background particles
- **Event Showcase**: Alternating event cards
- **Marquee**: Latest events scrolling marquee

### Performance Optimizations
- ✅ Lazy loading for heavy components (Navbar, SmartImage)
- ✅ Deferred API calls (100ms delay)
- ✅ Deferred scroll effects (200ms delay)
- ✅ Non-blocking auth initialization
- ✅ Image optimization with fallbacks

---

## ⚙️ Configuration

### Next.js Config (`next.config.js`)

#### Performance Optimizations
- **Turbopack**: Enabled for faster compilation
- **SWC Minify**: Enabled for production
- **Package Imports**: Optimized imports for large libraries
- **Image Optimization**: Disabled in dev, enabled in production
- **CSS Optimization**: Disabled in dev

#### Webpack Optimizations (Non-Turbopack)
- **Filesystem Caching**: Faster rebuilds
- **Code Splitting**: Separate chunks for large libraries
- **Vendor Chunks**: Separate vendor bundles
- **Library Chunks**: Separate chunks for Recharts, Leaflet, PDF libraries

#### Security Headers
- **CSP**: Content Security Policy for YouTube embeds
- **CORS**: Cross-origin resource sharing
- **COEP**: Cross-Origin Embedder Policy

#### API Rewrites
- `/api/*` → Backend API
- `/uploads/*` → Backend uploads
- `/galery/*` → Gallery assets

### TypeScript Config (`tsconfig.json`)
- **Target**: ES2017
- **Module**: ESNext
- **Strict Mode**: Disabled (for faster development)
- **Path Aliases**: `@/*` → `./src/*`

### Tailwind Config (`tailwind.config.js`)
- **Content**: All `.tsx`, `.ts`, `.jsx`, `.js` files
- **Theme**: Extended (custom colors, spacing)
- **Plugins**: None (can add if needed)

---

## 🔒 Middleware (`middleware.ts`)

### Purpose
- Route protection
- Authentication checks
- Role-based access control
- Redirects based on auth state

### Features
- Fast path for static assets
- Simplified logic for performance
- Early returns for static files
- Auth state checking

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Mobile-First Approach
- All components designed mobile-first
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Responsive navigation (mobile menu)

---

## 🎨 Styling Approach

### Tailwind CSS
- Utility-first CSS framework
- Custom classes in `globals.css`
- Component-specific styles in `homepage.css`
- Responsive utilities throughout

### Design System
- **Colors**: Blue primary, gray neutrals
- **Typography**: System fonts with fallbacks
- **Spacing**: Consistent spacing scale
- **Shadows**: Layered shadow system
- **Borders**: Rounded corners (lg, xl, 2xl)

---

## 🚀 Performance Optimizations

### Implemented
1. **Lazy Loading**: Heavy components loaded on demand
2. **Code Splitting**: Automatic route-based splitting
3. **Image Optimization**: Next.js Image component
4. **Deferred Loading**: API calls and effects deferred
5. **Non-Blocking Auth**: Auth init doesn't block render
6. **Turbopack**: Faster compilation in dev
7. **Filesystem Cache**: Faster rebuilds
8. **Package Imports**: Optimized large library imports

### Performance Metrics (Expected)
- **Initial Load**: 1-3 seconds (dev), < 2 seconds (prod)
- **Page Navigation**: < 1 second (dev), < 500ms (prod)
- **Hot Reload**: < 500ms

---

## 🔧 Development Setup

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Development
```bash
npm run dev          # Development with Turbopack
npm run dev:turbo    # Explicit Turbopack mode
npm run dev:slow     # Fallback without Turbopack
```

### Build
```bash
npm run build        # Production build
npm start            # Start production server
```

### Linting
```bash
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## 🐛 Known Issues & Solutions

### Performance Issues
- **Solution**: Use Turbopack (`npm run dev`)
- **Fallback**: Use `npm run dev:slow` if Turbopack fails
- **Cache**: Clear `.next` folder if issues persist

### TypeScript Errors
- **Solution**: Type checking disabled in build (can enable later)
- **Note**: Strict mode disabled for faster development

### Image Loading
- **Solution**: Uses `SmartImage` component with fallbacks
- **Fallback**: Gradient backgrounds if image fails

---

## 📊 Key Features

### 1. Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Session management
- ✅ Auto token refresh

### 2. Event Management
- ✅ Event listing with search/filter
- ✅ Event details page
- ✅ Event creation (organizers)
- ✅ Event editing
- ✅ Multiple ticket types
- ✅ Private events support

### 3. Payment Integration
- ✅ Payment modal
- ✅ Midtrans integration
- ✅ Duitku integration
- ✅ Payment status tracking

### 4. Certificate System
- ✅ Certificate editor (Canvas-based)
- ✅ Template management
- ✅ PDF generation
- ✅ Certificate download

### 5. QR Code Scanning
- ✅ QR scanner component
- ✅ Ticket validation
- ✅ Attendance tracking

### 6. Maps Integration
- ✅ Leaflet maps
- ✅ Location picker
- ✅ Geocoding integration

### 7. Analytics & Reporting
- ✅ Charts (Recharts)
- ✅ Dashboard analytics
- ✅ Event analytics
- ✅ Organizer analytics

### 8. Department System
- ✅ Ticket management
- ✅ Team assignments
- ✅ Status tracking
- ✅ Comments system

---

## 🎯 Best Practices

### Code Organization
- ✅ Route groups for logical separation
- ✅ Component co-location
- ✅ Type definitions in `types/`
- ✅ Utilities in `lib/`
- ✅ Hooks in `hooks/`

### Performance
- ✅ Lazy loading heavy components
- ✅ Deferred API calls
- ✅ Image optimization
- ✅ Code splitting
- ✅ Non-blocking initialization

### Security
- ✅ Token in localStorage (will migrate to HttpOnly cookies)
- ✅ Protected routes
- ✅ Role-based access
- ✅ Input validation (Zod)
- ✅ XSS protection

### Accessibility
- ✅ Radix UI components (accessible)
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation

---

## 📚 Type Definitions

### Main Types (`types/index.ts`)
- `User` - User model
- `Event` - Event model
- `Ticket` - Ticket model
- `Payment` - Payment model
- `Certificate` - Certificate model
- `ApiResponse` - API response wrapper
- `LoginForm` - Login form data
- `RegisterForm` - Registration form data

### Certificate Types (`types/certificate.ts`)
- Certificate template structure
- Element types
- Position/size properties

---

## 🔄 Data Flow

### Authentication Flow
```
User Login → API Call → Store Token → Setup Refresh → Update Context → Redirect
```

### Event Registration Flow
```
Browse Events → Select Event → Choose Ticket Type → Register → Payment → Confirmation
```

### Certificate Generation Flow
```
Event Attendance → Mark Attended → Generate Certificate → Download PDF
```

---

## 🎨 UI/UX Highlights

### Homepage
- **Hero Section**: Large banner with concert promotion
- **Scroll Animations**: Text animations on scroll
- **Parallax Effects**: Multi-layer parallax backgrounds
- **Event Showcase**: Alternating card layouts
- **Marquee**: Scrolling event cards

### Dashboard
- **Cards**: Information cards
- **Charts**: Data visualization
- **Tables**: Data tables with pagination
- **Filters**: Search and filter options

### Forms
- **Validation**: Zod schema validation
- **Error Handling**: Inline error messages
- **Loading States**: Loading indicators
- **Success States**: Success toasts

---

## 🚀 Deployment

### Vercel (Recommended)
- Automatic deployments from Git
- Environment variables configuration
- Preview deployments for PRs

### Other Platforms
- Can deploy to any Node.js hosting
- Set `NEXT_PUBLIC_API_URL` environment variable
- Run `npm run build` and `npm start`

---

## 📝 Development Notes

### Performance Considerations
- Homepage is large (2000+ lines) - could be split
- Some components could be optimized further
- Consider code splitting for large pages

### Future Improvements
- Migrate tokens to HttpOnly cookies
- Enable TypeScript strict mode
- Add more comprehensive error boundaries
- Implement service worker for offline support
- Add more comprehensive testing

---

## 🎓 Learning Points

1. **Next.js App Router**: Modern routing with route groups
2. **TypeScript**: Type-safe development
3. **State Management**: Zustand + TanStack Query combination
4. **Performance**: Multiple optimization strategies
5. **Accessibility**: Radix UI for accessible components
6. **Form Handling**: React Hook Form + Zod validation
7. **API Integration**: Axios with interceptors
8. **Real-time Features**: WebSocket integration (planned)

---

**Last Updated**: Based on codebase exploration
**Version**: 1.0.0
**Framework**: Next.js 14.2.18

