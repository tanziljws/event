// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  lastEducation?: string;
  role: 'ADMIN' | 'PARTICIPANT' | 'ORGANIZER' | 'SUPER_ADMIN' | 'CS_HEAD' | 'CS_SENIOR_AGENT' | 'CS_AGENT' | 'OPS_HEAD' | 'OPS_SENIOR_AGENT' | 'OPS_AGENT' | 'FINANCE_HEAD' | 'FINANCE_SENIOR_AGENT' | 'FINANCE_AGENT';
  department?: string;
  userPosition?: string;
  managerId?: string;
  employeeId?: string;
  emailVerified: boolean;
  lastActivity?: string;
  tokenVersion?: number;
  createdAt: string;
  updatedAt: string;
  // Organizer fields
  organizerType?: string;
  verificationStatus?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  portfolio?: string;
  socialMedia?: string;
  verifiedAt?: string;
  rejectedReason?: string;
}

// Event Types
export interface Event {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string;
  location: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
  flyerUrl?: string;
  certificateTemplateUrl?: string;
  description: string;
  maxParticipants: number;
  registeredCount?: number;
  registrationDeadline: string;
  isPublished: boolean;
  isPrivate?: boolean;
  privatePassword?: string;
  category?: string;
  price?: string | number | null;
  isFree?: boolean;
  hasMultipleTicketTypes?: boolean;
  ticketTypes?: TicketType[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    fullName: string;
    email: string;
  };
  _count?: {
    registrations: number;
  };
}

// Registration Types
export interface EventRegistration {
  id: string;
  eventId: string;
  participantId: string;
  registrationToken: string;
  hasAttended: boolean;
  attendanceTime?: string;
  certificateUrl?: string;
  qrCodeUrl?: string;
  status?: string;
  cancelledAt?: string;
  registeredAt: string;
  attendedAt?: string;
  ticketTypeId?: string;
  ticketType?: TicketType;
  event?: Event;
  participant?: User;
  payment?: Payment;
  ticket?: Ticket;
  payments?: Payment[];
}

// Ticket Type Interface
export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number | null;
  isFree: boolean;
  capacity: number;
  soldCount?: number;
  remainingCapacity?: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  benefits?: string[];
  color: string;
  icon?: string;
  badgeText?: string | null;
  minQuantity?: number;
  maxQuantity?: number;
  requiresApproval?: boolean;
  termsConditions?: string | null;
  originalPrice?: number | null;
  discountPercentage?: number | null;
  promoCode?: string | null;
  isActive: boolean;
  sortOrder?: number;
  isSoldOut?: boolean;
}

// Ticket Types
export interface Ticket {
  id: string;
  ticketNumber: string;
  registrationId: string;
  status: 'ACTIVE' | 'USED' | 'CANCELLED';
  qrCodeUrl?: string;
  qrCodeData?: string;
  createdAt: string;
  ticketTypeId?: string;
  ticketType?: TicketType;
  event?: {
    id: string;
    title: string;
    eventDate: string;
    eventTime: string;
    location: string;
    price?: number | null;
    isFree?: boolean;
  };
  registration?: EventRegistration;
  payment?: Payment;
}

// Certificate Types
export interface Certificate {
  id: string;
  registrationId: string;
  certificateUrl: string;
  issuedAt: string;
  registration?: EventRegistration;
  event?: Event;
  participant?: User;
}

// Payment Types
export interface Payment {
  id: string;
  registrationId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: 'QR_CODE' | 'CREDIT_CARD' | 'BANK_TRANSFER' | 'EWALLET' | 'CRYPTO' | 'MANUAL' | string;
  status?: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING_REVIEW';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'PENDING_REVIEW';
  paymentReference?: string;
  createdAt?: string;
  paidAt?: string;
  registration?: EventRegistration;
}

// Payment Methods Types
export interface PaymentMethods {
  gateway: {
    [key: string]: {
      name: string;
      methods: string[];
    };
  };
  crypto: {
    supported: string[];
    address: string;
  };
  manual: {
    bank_transfer: {
      name: string;
      accounts: {
        bank: string;
        account: string;
        name: string;
      }[];
    };
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  lastEducation: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  lastEducation: string;
  // Organizer fields
  role?: 'ORGANIZER' | 'PARTICIPANT';
  organizerType?: string;
  profileData?: any; // Dynamic profile data based on organizer type
  // Legacy fields (deprecated - use profileData instead)
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  portfolio?: string;
  socialMedia?: string;
}

export interface VerifyEmailForm {
  email: string;
  otp: string;
}

export interface UpdateProfileForm {
  fullName: string;
  phoneNumber: string;
  address: string;
  lastEducation: string;
}


export interface EventRegistrationForm {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  lastEducation: string;
}



export interface ForgotPasswordForm {
  email: string;
}

export interface ResetPasswordForm {
  token: string;
  password: string;
  confirmPassword: string;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileForm) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// UI Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Filter Types
export interface EventFilters {
  page?: number;
  limit?: number;
  isPublished?: boolean;
  search?: string;
  location?: string;
  eventDate?: string;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
}

export interface CertificateFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}

export interface UserRegistrationFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  hasAttended?: boolean;
}

export interface EventSearchFilters {
  q: string;
  page?: number;
  limit?: number;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
}

// Dashboard Types
export interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalParticipants: number;
  totalRevenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentEvents: Event[];
  recentRegistrations: EventRegistration[];
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}
