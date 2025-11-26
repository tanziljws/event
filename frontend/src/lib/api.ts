import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

// API Configuration
// Use localhost for local development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Important: include cookies in all requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (will be replaced with httpOnly cookie later)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Enhanced error logging
    console.error('❌ API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      hasAuth: !!originalRequest?.headers?.Authorization,
      token: originalRequest?.headers?.Authorization ? originalRequest.headers.Authorization.substring(0, 20) + '...' : 'NO TOKEN',
      baseURL: originalRequest?.baseURL,
      fullURL: originalRequest?.baseURL + originalRequest?.url
    });

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('refresh-token')) {
      originalRequest._retry = true;

      try {
        // Refresh token is handled by HttpOnly cookie, just call refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          withCredentials: true // Important: include cookies
        });

        if (response.data.success && response.data.data?.accessToken) {
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types - Imported from types/index.ts

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// API Service Class
export class ApiService {
  // Auth APIs
  static async register(data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    lastEducation: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  }

  static async registerOrganizer(data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    lastEducation: string;
    organizerType: string;
    profileData: any; // Dynamic profile data based on organizer type
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/register-organizer', data);
    return response.data;
  }

  static async verifyEmail(data: {
    email: string;
    otp: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/verify-email', {
      email: data.email,
      otpCode: data.otp
    });
    return response.data;
  }

  static async resendOtp(email: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/resend-otp', { email });
    return response.data;
  }

  static async login(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  }

  static async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  static async refreshToken(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/refresh-token', {}, {
      withCredentials: true
    });
    return response.data;
  }

  static async getProfile(): Promise<ApiResponse> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  // Switch role (organizer <-> participant)
  static async switchRole(targetRole: 'ORGANIZER' | 'PARTICIPANT'): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/switch-role', { targetRole });
    return response.data;
  }

  static async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
    address?: string;
    lastEducation?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  }

  static async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  }

  static async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  }

  // Events APIs
  static async getEvents(params?: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    search?: string;
    location?: string;
    eventDate?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/events', { params });
    return response.data;
  }

  static async getEvent(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  }

  static async verifyPrivateEventPassword(eventId: string, password: string): Promise<ApiResponse> {
    const response = await apiClient.post('/events/verify-private', {
      eventId,
      password
    });
    return response.data;
  }

  static async registerEvent(id: string, data: {
    paymentMethod: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/events/${id}/register`, data);
    return response.data;
  }

  static async checkEventAvailability(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/${id}/check-availability`);
    return response.data;
  }

  // Tickets APIs
  static async getTickets(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/tickets', { params });
    return response.data;
  }

  static async getTicket(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  }

  static async getTicketQR(number: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/tickets/qr/${number}`);
    return response.data;
  }

  static async scanTicket(number: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/tickets/${number}/scan`);
    return response.data;
  }

  // Certificates APIs
  static async getCertificates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/certificates', { params });
    return response.data;
  }

  static async getCertificate(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/certificates/${id}`);
    return response.data;
  }


  // Payments APIs
  static async getPayments(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/payments', { params });
    return response.data;
  }

  static async getPayment(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  }

  static async getPaymentMethods(): Promise<ApiResponse> {
    const response = await apiClient.get('/payments/methods');
    return response.data;
  }

  static async processGatewayPayment(id: string, data: {
    paymentMethod: string;
    gateway: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/gateway/${id}`, data);
    return response.data;
  }

  static async processCryptoPayment(id: string, data: {
    cryptoType: string;
    amount: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/crypto/${id}`, data);
    return response.data;
  }

  static async verifyCryptoPaymentByTxHash(paymentReference: string, txHash: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/crypto/verify-tx/${paymentReference}`, { txHash });
    return response.data;
  }

  static async getTransactionStatus(txHash: string, coin: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/payments/crypto/status?txHash=${txHash}&coin=${coin}`);
    return response.data;
  }

  static async processManualPayment(id: string, data: {
    bankName: string;
    accountNumber: string;
    transferAmount: number;
    transferDate: string;
    notes: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/manual/${id}`, data);
    return response.data;
  }

  // Admin APIs
  static async getAdminEvents(params?: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
    search?: string;
    location?: string;
    eventDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/events', { params });
    return response.data;
  }

  static async createEvent(data: {
    title: string;
    eventDate: string;
    eventTime: string;
    location: string;
    flyerUrl?: string;
    certificateTemplateUrl?: string;
    description: string;
    maxParticipants: number;
    registrationDeadline: string;
    isPrivate?: boolean;
    privatePassword?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/admin/events', data);
    return response.data;
  }

  static async getAdminEvent(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/admin/events/${id}`);
    return response.data;
  }

  static async updateEvent(id: string, data: any): Promise<ApiResponse> {
    const response = await apiClient.put(`/admin/events/${id}`, data);
    return response.data;
  }

  static async deleteEvent(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/admin/events/${id}`);
    return response.data;
  }

  static async publishEvent(id: string, isPublished: boolean): Promise<ApiResponse> {
    const response = await apiClient.put(`/admin/events/${id}/publish`, { isPublished });
    return response.data;
  }

  static async getEventRegistrations(id: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get(`/admin/events/${id}/registrations`, { params });
    return response.data;
  }

  // ==================== ORGANIZER EVENT REGISTRATIONS ====================

  static async getOrganizerEventRegistrations(eventId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/${eventId}/registrations`, { params });
    return response.data;
  }

  static async getOrganizerEventAnalytics(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/organizer/${eventId}/analytics`);
    return response.data;
  }

  static async exportEventRegistrations(id: string): Promise<Blob> {
    const response = await apiClient.get(`/admin/events/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }

  static async getDashboard(): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  }

  // Public Events API (for participants)
  static async getPublicEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.isPublished !== undefined) searchParams.append('isPublished', params.isPublished.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(`/events?${searchParams.toString()}`);
    return response.data;
  }

  static async getPublicEventById(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  }

  // Get ticket types for event (public)
  static async getEventTicketTypes(eventId: string, includeInactive: boolean = false): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/${eventId}/ticket-types?includeInactive=${includeInactive}`);
    return response.data;
  }

  static async registerForEvent(eventId: string, data?: { privatePassword?: string }): Promise<ApiResponse> {
    // API endpoint butuh eventId, participantId dari token, dan privatePassword jika event private
    const response = await apiClient.post(`/events/${eventId}/register`, data || {});
    return response.data;
  }


  // Public Tickets API (for participants)
  static async getMyTickets(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);

    const response = await apiClient.get(`/tickets?${searchParams.toString()}`);
    return response.data;
  }

  static async getMyTicketById(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  }

  static async getTicketQRCode(ticketNumber: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/tickets/qr/${ticketNumber}`);
    return response.data;
  }

  static async verifyTicket(ticketNumber: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/tickets/verify/${ticketNumber}`);
    return response.data;
  }

  // Admin APIs
  static async getAdminDashboard(): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  }

  static async getMonthlyAnalytics(year?: number, timeRange?: string): Promise<ApiResponse> {
    const params: any = {};
    if (year) params.year = year;
    if (timeRange) params.timeRange = timeRange;
    const response = await apiClient.get('/admin/dashboard/analytics/monthly', { params });
    return response.data;
  }



  static async createAdminEvent(data: any): Promise<ApiResponse> {
    const response = await apiClient.post('/admin/events', data);
    return response.data;
  }

  static async createOrganizerEvent(data: any): Promise<ApiResponse> {
    const response = await apiClient.post('/events', data);
    return response.data;
  }

  static async updateAdminEvent(id: string, data: any): Promise<ApiResponse> {
    const response = await apiClient.put(`/admin/events/${id}`, data);
    return response.data;
  }

  static async deleteAdminEvent(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/admin/events/${id}`);
    return response.data;
  }

  static async toggleEventPublish(id: string): Promise<ApiResponse> {
    const response = await apiClient.patch(`/admin/events/${id}/publish`);
    return response.data;
  }

  static async getAdminUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);

    const response = await apiClient.get(`/admin/users?${searchParams.toString()}`);
    return response.data;
  }

  static async deleteAdminUser(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  }

  static async getAdminUser(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  }

  static async updateAdminUser(id: string, data: {
    fullName?: string;
    phoneNumber?: string;
    role?: string;
    isEmailVerified?: boolean;
    address?: string;
    organizerType?: string;
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    portfolio?: string;
    socialMedia?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  }

  // Reset user password (Admin)
  static async resetUserPassword(id: string, newPassword: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/admin/users/${id}/reset-password`, { newPassword });
    return response.data;
  }

  // Suspend/Unsuspend user (Admin)
  static async suspendUser(id: string, isSuspended: boolean): Promise<ApiResponse> {
    const response = await apiClient.patch(`/admin/users/${id}/suspend`, { isSuspended });
    return response.data;
  }

  // Change user role (Admin)
  static async changeUserRole(id: string, role: string): Promise<ApiResponse> {
    const response = await apiClient.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  }

  // Get user activity logs
  static async getUserActivity(id: string, limit?: number): Promise<ApiResponse> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/admin/users/${id}/activity${params}`);
    return response.data;
  }

  // Get all organizers (Admin)
  static async getAdminOrganizers(): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/organizers');
    return response.data;
  }

  // Get organizer details (Admin)
  static async getAdminOrganizer(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/admin/organizers/${id}`);
    return response.data;
  }

  // Get all payments (Admin monitoring)
  static async getAdminPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.search) searchParams.append('search', params.search);

    const response = await apiClient.get(`/admin/payments?${searchParams.toString()}`);
    return response.data;
  }

  // Get payment statistics (Admin)
  static async getAdminPaymentStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/admin/payments/stats?${searchParams.toString()}`);
    return response.data;
  }

  // Get activity logs (Admin) - Updated to use correct endpoint
  static async getAdminActivityLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.userId) searchParams.append('userId', params.userId);
    if (params?.action) searchParams.append('action', params.action);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await apiClient.get(`/admin/activity-logs?${searchParams.toString()}`);
    return response.data;
  }

  // Homepage Featured Events Management (Public endpoint)
  static async getHomepageFeaturedEvents(): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/events/homepage/featured');
    return response.data;
  }

  // Public endpoint for homepage featured events (no auth required)
  static async getPublicHomepageFeaturedEvents(): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/events/homepage/featured');
    return response.data;
  }

  static async setHomepageFeaturedEvents(eventIds: string[]): Promise<ApiResponse> {
    const response = await apiClient.post('/admin/events/homepage/featured', { eventIds });
    return response.data;
  }

  static async getAvailableEventsForHomepage(): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/events/homepage/available');
    return response.data;
  }

  // Get system settings (Admin)
  static async getSystemSettings(): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  }

  // Update system setting (Admin)
  static async updateSystemSetting(key: string, value: any, description?: string): Promise<ApiResponse> {
    const response = await apiClient.put(`/admin/settings/${key}`, { value, description });
    return response.data;
  }

  static async getEventParticipants(eventId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);

    const response = await apiClient.get(`/admin/events/${eventId}/participants?${searchParams.toString()}`);
    return response.data;
  }

  static async exportEventParticipants(eventId: string): Promise<Blob> {
    const response = await apiClient.get(`/admin/events/${eventId}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }

  static async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.type) searchParams.append('type', params.type);

    const response = await apiClient.get(`/admin/activity-logs?${searchParams.toString()}`);
    return response.data;
  }

  // P0 - CRITICAL: Event Search API
  static async searchEvents(params: {
    q: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.q);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`/events/search?${searchParams.toString()}`);
    return response.data;
  }

  // P0 - CRITICAL: User Event Registrations API
  static async getUserEventRegistrations(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    hasAttended?: boolean;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.hasAttended !== undefined) searchParams.append('hasAttended', params.hasAttended.toString());

    const response = await apiClient.get(`/events/my/registrations?${searchParams.toString()}`);
    return response.data;
  }


  // P0 - CRITICAL: Get User Certificates API
  static async getUserCertificates(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
  }): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.search) searchParams.append('q', params.search);

    const response = await apiClient.get(`/certificates/my?${searchParams.toString()}`);
    return response.data;
  }

  // Contact Us API
  static async contactUs(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/contact', data);
    return response.data;
  }

  // Create ticket from contact form
  static async createTicketFromContact(data: {
    title: string;
    description: string;
    priority: string;
    category: string;
    createdBy: string;
    source: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/departments/tickets', data);
    return response.data;
  }

  // Get department tickets
  static async getDepartmentTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/departments/tickets', { params });
    return response.data;
  }

  static async getDepartmentTicket(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/departments/tickets/${id}`);
    return response.data;
  }

  static async updateDepartmentTicket(id: string, data: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    dueDate?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/departments/tickets/${id}`, data);
    return response.data;
  }

  static async assignDepartmentTicket(id: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/departments/tickets/${id}/assign`);
    return response.data;
  }

  // Team Configuration Management
  static async createTeamConfiguration(data: {
    teamId: string;
    teamName: string;
    description: string;
    categories: string[];
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/teams/configurations', data);
    return response.data;
  }

  static async getTeamConfigurations(): Promise<ApiResponse> {
    const response = await apiClient.get('/teams/configurations');
    return response.data;
  }

  static async updateTeamConfiguration(id: string, data: {
    teamName?: string;
    description?: string;
    categories?: string[];
    isActive?: boolean;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/teams/configurations/${id}`, data);
    return response.data;
  }

  static async deleteTeamConfiguration(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/teams/configurations/${id}`);
    return response.data;
  }

  // Department Management
  static async getDepartments(): Promise<ApiResponse> {
    const response = await apiClient.get('/departments');
    return response.data;
  }

  // Event Approval Management
  static async getEventsForReview(params: { status?: string; limit?: number; page?: number } = {}): Promise<ApiResponse> {
    const response = await apiClient.get('/event-approval/events', { params });
    return response.data;
  }

  static async approveEvent(eventId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/event-approval/events/${eventId}/approve`, { action, reason });
    return response.data;
  }

  // Organizer Management
  static async getOrganizersForReview(params: { status?: string; limit?: number; page?: number } = {}): Promise<ApiResponse> {
    const response = await apiClient.get('/organizers/review', { params });
    return response.data;
  }

  static async verifyOrganizer(organizerId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/organizers/${organizerId}/verify`, { action, reason });
    return response.data;
  }

  // Cancel Event Registration API
  static async cancelEventRegistration(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/events/${eventId}/cancel-registration`);
    return response.data;
  }

  // ==================== ATTENDANCE SYSTEM ====================

  // Participant Self-Scan QR Code for Attendance
  static async scanQRCodeForAttendance(qrCodeData: string): Promise<ApiResponse> {
    const response = await apiClient.post('/events/scan-qr', { qrCodeData });
    return response.data;
  }

  // Admin Check-in Participant (for admin panel)
  static async adminCheckInParticipant(eventId: string, qrCodeData: string): Promise<ApiResponse> {
    const response = await apiClient.post('/events/admin/check-in', { eventId, qrCodeData });
    return response.data;
  }

  // Admin Detect Event from Token (for auto-select)
  static async detectEventFromToken(token: string): Promise<ApiResponse> {
    const response = await apiClient.post('/events/admin/detect-event', { token });
    return response.data;
  }

  // Admin Get Event Attendance (for admin panel)
  static async getEventAttendance(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/admin/attendance/${eventId}`);
    return response.data;
  }

  // ==================== ORGANIZER ATTENDANCE ====================

  // Organizer Check-in Participant
  static async organizerCheckInParticipant(eventId: string, qrCodeData: string): Promise<ApiResponse> {
    const response = await apiClient.post('/events/organizer/check-in', { eventId, qrCodeData });
    return response.data;
  }

  // Organizer Detect Event from Token (for auto-select)
  static async detectOrganizerEventFromToken(token: string): Promise<ApiResponse> {
    const response = await apiClient.post('/events/organizer/detect-event', { token });
    return response.data;
  }

  // Organizer Get Event Attendance (for organizer panel)
  static async getOrganizerEventAttendance(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/organizer/attendance/${eventId}`);
    return response.data;
  }

  // Organizer Get Events (for organizer panel)
  static async getOrganizerEvents(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApiResponse> {
    const response = await apiClient.get('/events/organizer', { params });
    return response.data;
  }

  // Get Organizer Event by ID (can access unpublished events)
  static async getOrganizerEventById(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/events/organizer/${eventId}`);
    return response.data;
  }

  // Update Organizer Event
  static async updateOrganizerEvent(eventId: string, data: any): Promise<ApiResponse> {
    const response = await apiClient.put(`/events/organizer/${eventId}`, data);
    return response.data;
  }

  // Publish Organizer Event
  static async publishOrganizerEvent(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.patch(`/events/organizer/${eventId}/publish`);
    return response.data;
  }


  // ==================== CERTIFICATES ====================

  // Get user certificates
  static async getMyCertificates(params: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
  } = {}): Promise<ApiResponse> {
    const response = await apiClient.get('/certificates/my', { params });
    return response.data;
  }

  // Generate certificate for attended event
  static async generateCertificate(registrationId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/certificates/generate/${registrationId}`);
    return response.data;
  }

  // Search certificate by token
  static async searchCertificateByToken(token: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/certificates/search/${token}`);
    return response.data;
  }

  // Verify certificate by certificate number
  static async verifyCertificate(certificateNumber: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/certificates/verify/${certificateNumber}`);
    return response.data;
  }

  // Get certificate download URL
  static async getCertificateDownloadUrl(certificateId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/certificates/download-url/${certificateId}`);
    return response.data;
  }

  // Download certificate
  static async downloadCertificate(certificateId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/certificates/download/${certificateId}`);
    return response.data;
  }

  // Bulk generate certificates for an event (Admin/Organizer)
  static async bulkGenerateCertificates(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/certificates/bulk-generate/${eventId}`);
    return response.data;
  }

  // ==================== CERTIFICATE TEMPLATES ====================

  // ==================== CERTIFICATE TEMPLATES ====================

  // Get certificate templates for events
  static async getCertificateTemplates(params?: {
    page?: number;
    limit?: number;
    eventId?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/admin/certificate-templates', { params });
    return response.data;
  }

  // Get certificate template for specific event
  static async getCertificateTemplate(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/admin/certificate-templates/${eventId}`);
    return response.data;
  }

  // Save certificate template for event
  static async saveCertificateTemplate(eventId: string, templateData: {
    backgroundImage?: string;
    backgroundSize?: string;
    elements: any[];
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/admin/certificate-templates/${eventId}`, templateData);
    return response.data;
  }

  // Update certificate template for event
  static async updateCertificateTemplate(eventId: string, templateData: {
    backgroundImage?: string;
    backgroundSize?: string;
    elements: any[];
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/admin/certificate-templates/${eventId}`, templateData);
    return response.data;
  }

  // Delete certificate template for event
  static async deleteCertificateTemplate(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/admin/certificate-templates/${eventId}`);
    return response.data;
  }

  // ==================== GLOBAL CERTIFICATE TEMPLATES ====================

  // Get global certificate templates
  static async getGlobalCertificateTemplates(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/global-certificate-templates', { params });
    return response.data;
  }

  // Get global certificate template by ID
  static async getGlobalCertificateTemplateById(templateId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/global-certificate-templates/${templateId}`);
    return response.data;
  }

  // Get default global certificate template
  static async getDefaultGlobalCertificateTemplate(): Promise<ApiResponse> {
    const response = await apiClient.get('/global-certificate-templates/default');
    return response.data;
  }

  // Create global certificate template
  static async createGlobalCertificateTemplate(templateData: {
    name: string;
    description?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    elements: any[];
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/global-certificate-templates', templateData);
    return response.data;
  }

  // Update global certificate template
  static async updateGlobalCertificateTemplate(templateId: string, templateData: {
    name?: string;
    description?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    elements?: any[];
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/global-certificate-templates/${templateId}`, templateData);
    return response.data;
  }

  // Delete global certificate template
  static async deleteGlobalCertificateTemplate(templateId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/global-certificate-templates/${templateId}`);
    return response.data;
  }

  // Set default global certificate template
  static async setDefaultGlobalCertificateTemplate(templateId: string): Promise<ApiResponse> {
    const response = await apiClient.patch(`/global-certificate-templates/${templateId}/set-default`);
    return response.data;
  }

  // ==================== ORGANIZER DASHBOARD ====================

  // Get organizer dashboard data
  static async getOrganizerDashboard(organizerId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/organizers/${organizerId}/dashboard`);
    return response.data;
  }

  // ==================== PAYMENTS ====================

  // Create payment order for event (with ticketTypeId and quantity support)
  static async createEventPaymentOrder(eventId: string, paymentData: {
    eventTitle: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    paymentMethod?: string;
    ticketTypeId?: string;
    quantity?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/events/${eventId}/payment/create-order`, paymentData);
    return response.data;
  }

  // Register for event after payment
  static async registerForEventAfterPayment(eventId: string, paymentId: string, privatePassword?: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/events/${eventId}/register-after-payment`, { 
      paymentId,
      ...(privatePassword && { privatePassword })
    });
    return response.data;
  }

  // Create payment for event registration
  static async createPayment(registrationId: string, amount: number, paymentMethod: string = 'QR_CODE'): Promise<ApiResponse> {
    const response = await apiClient.post('/payments', {
      registrationId,
      amount,
      paymentMethod
    });
    return response.data;
  }

  // Create gateway payment
  static async createGatewayPayment(registrationId: string, paymentData: {
    amount: number;
    gateway?: string;
    paymentMethod?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/${registrationId}/gateway`, paymentData);
    return response.data;
  }

  // Get payment by registration ID
  static async getPaymentByRegistration(registrationId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/payments/registration/${registrationId}`);
    return response.data;
  }

  // Check payment status
  static async checkPaymentStatus(paymentId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/payments/status/${paymentId}`);
    return response.data;
  }

  // Cancel payment
  static async cancelPayment(paymentId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/${paymentId}/cancel`);
    return response.data;
  }

  // Get payment by order ID
  static async getPaymentByOrderId(orderId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/payments/order/${orderId}`);
    return response.data;
  }

  // Trigger registration manually (for localhost/development)
  static async triggerRegistration(paymentId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/${paymentId}/trigger-registration`);
    return response.data;
  }

  // Sync payment status with Midtrans (for localhost/development)
  static async syncPaymentStatus(orderId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/order/${orderId}/sync`);
    return response.data;
  }

  // Verify payment
  static async verifyPayment(paymentId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/payments/${paymentId}/verify`);
    return response.data;
  }

  // Get available payment methods
  static async getAvailablePaymentMethods(): Promise<ApiResponse> {
    const response = await apiClient.get('/payments/methods');
    return response.data;
  }

  // ==================== UPLOAD ====================

  // Upload single image (for thumbnail)
  static async uploadSingleImage(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file); // Changed from 'image' to 'file' to match backend

    const response = await apiClient.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Convert relative URL to full URL
    if (response.data.success && response.data.data.url) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      response.data.data.url = baseUrl + response.data.data.url;
    }

    return response.data;
  }

  // Upload multiple images (for gallery)
  static async uploadMultipleImages(files: File[]): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await apiClient.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Convert relative URLs to full URLs
    if (response.data.success && response.data.data.images) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      response.data.data.images = response.data.data.images.map((image: any) => ({
        ...image,
        url: baseUrl + image.url
      }));
    }

    return response.data;
  }

  // Delete uploaded image
  static async deleteImage(filename: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/upload/${filename}`);
    return response.data;
  }

  // ==================== DEPARTMENTS ====================

  // Get department structure
  static async getDepartmentStructure(): Promise<ApiResponse> {
    const response = await apiClient.get('/departments/structure');
    return response.data;
  }

  // Get available users for department assignment
  static async getAvailableUsers(): Promise<ApiResponse> {
    const response = await apiClient.get('/departments/available-users');
    return response.data;
  }

  // Add member to department
  static async addDepartmentMember(department: string, data: {
    userId: string;
    role: string;
    userPosition: string;
    managerId?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/departments/${department}/members`, data);
    return response.data;
  }

  // Remove member from department
  static async removeDepartmentMember(department: string, userId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/departments/${department}/members/${userId}`);
    return response.data;
  }

  // Update member role in department
  static async updateDepartmentMember(department: string, userId: string, data: {
    role: string;
    userPosition: string;
    managerId?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/departments/${department}/members/${userId}`, data);
    return response.data;
  }

  // Get department members
  static async getDepartmentMembers(department: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/departments/${department}/members`);
    return response.data;
  }

  // Get department statistics
  static async getDepartmentStats(department: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/departments/${department}/stats`);
    return response.data;
  }

  // Create new staff directly
  static async createNewStaff(department: string, data: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    lastEducation?: string;
    role: string;
    userPosition: string;
    managerId?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/admin/create-staff`, data);
    return response.data;
  }

  // Get staff details
  static async getStaffDetails(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/admin/staff/${id}`);
    return response.data;
  }

  // Update staff details
  static async updateStaff(id: string, data: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    lastEducation?: string;
    role: string;
    userPosition: string;
    managerId?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/admin/staff/${id}`, data);
    return response.data;
  }

  // Delete staff (reset to PARTICIPANT)
  static async deleteStaff(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/admin/staff/${id}`);
    return response.data;
  }

  // Get department dashboard data
  static async getDepartmentDashboard(department: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/admin/dashboard/${department}`);
    return response.data;
  }

  static async getOperationsDashboard(): Promise<ApiResponse> {
    const response = await apiClient.get(`/operations/dashboard`);
    return response.data;
  }

  // Get operations team members only
  static async getOperationsTeam(): Promise<ApiResponse> {
    const response = await apiClient.get(`/operations/team`);
    return response.data;
  }

  // Get individual agent dashboard data
  static async getAgentDashboard(agentId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/operations/agent/${agentId}/dashboard`);
    return response.data;
  }

  // Get operations analytics data
  static async getOperationsAnalytics(timeRange: string = '7d'): Promise<ApiResponse> {
    const response = await apiClient.get(`/operations/analytics?timeRange=${timeRange}`);
    return response.data;
  }

  // Get operations reports data
  static async getOperationsReports(timeRange: string = '30d', agentId?: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ timeRange })
    if (agentId) params.append('agentId', agentId)
    const response = await apiClient.get(`/reports/operations?${params}`);
    return response.data;
  }

  // Export operations report
  static async exportOperationsReport(format: string = 'pdf', timeRange: string = '30d', agentId?: string): Promise<ApiResponse> {
    const response = await apiClient.post('/reports/operations/export', {
      format,
      timeRange,
      agentId
    });
    return response.data;
  }


  // ==================== ASSIGNMENT MANAGEMENT ====================

  // Get assignment data
  static async getAssignmentData(): Promise<ApiResponse> {
    const response = await apiClient.get('/assignment/data');
    return response.data;
  }

  // Auto assign item
  static async autoAssignItem(type: 'EVENT' | 'ORGANIZER', itemId: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'): Promise<ApiResponse> {
    const response = await apiClient.post('/assignment/auto-assign', { type, itemId, priority });
    return response.data;
  }

  // Get assignment strategy
  static async getAssignmentStrategy(): Promise<ApiResponse> {
    const response = await apiClient.get('/assignment/strategy');
    return response.data;
  }

  // Set assignment strategy
  static async setAssignmentStrategy(strategy: 'WORKLOAD_BASED' | 'ROUND_ROBIN' | 'ADVANCED'): Promise<ApiResponse> {
    const response = await apiClient.post('/assignment/strategy', { strategy });
    return response.data;
  }

  // Test assignment scoring
  static async testAssignmentScoring(type: 'EVENT' | 'ORGANIZER', itemId: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'): Promise<ApiResponse> {
    const response = await apiClient.post('/assignment/test-scoring', { type, itemId, priority });
    return response.data;
  }

  // ==================== NOTIFICATIONS ====================

  // Get notification stats
  static async getNotificationStats(): Promise<ApiResponse> {
    const response = await apiClient.get('/assignment/notifications/stats');
    return response.data;
  }

  // ==================== ANALYTICS ====================

  // Get agent performance analytics
  static async getAgentAnalytics(agentId: string, timeRange: string = '7d'): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/analytics/agent/${agentId}?timeRange=${timeRange}`);
    return response.data;
  }

  // Get all agents analytics
  static async getAllAgentsAnalytics(timeRange: string = '7d'): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/analytics/agents?timeRange=${timeRange}`);
    return response.data;
  }

  // Get analytics dashboard
  static async getAnalyticsDashboard(timeRange: string = '7d'): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/analytics/dashboard?timeRange=${timeRange}`);
    return response.data;
  }

  // ==================== REASSIGNMENT ====================

  // Manual reassignment
  static async reassignItem(type: 'EVENT' | 'ORGANIZER', itemId: string, newAgentId: string, reason: string): Promise<ApiResponse> {
    const response = await apiClient.post('/assignment/reassign', { type, itemId, newAgentId, reason });
    return response.data;
  }

  // Auto load balancing reassignment
  static async autoLoadBalancingReassign(): Promise<ApiResponse> {
    const response = await apiClient.post('/assignment/reassign/auto-load-balancing');
    return response.data;
  }

  // Performance-based reassignment
  static async performanceBasedReassign(): Promise<ApiResponse> {
    const response = await apiClient.post('/assignment/reassign/performance-based');
    return response.data;
  }

  // Get reassignable items for agent
  static async getReassignableItems(agentId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/reassign/agent/${agentId}/reassignable`);
    return response.data;
  }

  // Get reassignment history
  static async getReassignmentHistory(agentId?: string, limit: number = 50): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    params.append('limit', limit.toString());
    const response = await apiClient.get(`/assignment/reassign/history?${params}`);
    return response.data;
  }

  // ==================== ASSIGNMENT HISTORY ====================

  // Get item assignment history
  static async getItemAssignmentHistory(itemType: 'EVENT' | 'ORGANIZER', itemId: string, limit: number = 10): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/history/item/${itemType}/${itemId}?limit=${limit}`);
    return response.data;
  }

  // Get agent assignment history
  static async getAgentAssignmentHistory(agentId: string, limit: number = 10): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/history/agent/${agentId}?limit=${limit}`);
    return response.data;
  }

  // Get assignment statistics
  static async getAssignmentStatistics(timeRange: string = '7d', agentId?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    params.append('timeRange', timeRange);
    if (agentId) params.append('agentId', agentId);
    const response = await apiClient.get(`/assignment/history/statistics?${params}`);
    return response.data;
  }

  // Search assignment history
  static async searchAssignmentHistory(searchParams: {
    itemType?: 'EVENT' | 'ORGANIZER';
    agentId?: string;
    userId?: string;
    type?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/assignment/history/search', searchParams);
    return response.data;
  }

  // ==================== QUEUE MANAGEMENT ====================

  // Get queue analytics
  static async getQueueAnalytics(timeRange: string = '24h'): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/queue/analytics?timeRange=${timeRange}`);
    return response.data;
  }

  // Get queue health status
  static async getQueueHealthStatus(): Promise<ApiResponse> {
    const response = await apiClient.get('/assignment/queue/health');
    return response.data;
  }

  // Get agent workload details
  static async getAgentWorkloadDetails(agentId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/assignment/workload/${agentId}`);
    return response.data;
  }

  // Audit Trail APIs
  static async getAuditLogs(params?: {
    performedBy?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/audit/logs', { params });
    return response.data;
  }

  static async getEntityAuditLogs(entityType: string, entityId: string, limit?: number): Promise<ApiResponse> {
    const response = await apiClient.get(`/audit/entity/${entityType}/${entityId}`, {
      params: { limit }
    });
    return response.data;
  }

  static async getAuditStats(params?: {
    performedBy?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/audit/stats', { params });
    return response.data;
  }

  static async getAgentPerformance(params?: {
    agentId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/audit/agent-performance', { params });
    return response.data;
  }

  static async getAgentsPerformance(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.get('/audit/agents-performance', { params });
    return response.data;
  }

  // ===== UPGRADE API =====

  // Upgrade user to business/organizer
  static async upgradeToBusiness(data: {
    organizerType: string;
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    portfolio?: string;
    socialMedia?: string;
    // Individual profile fields
    nik?: string;
    personalAddress?: string;
    personalPhone?: string;
    // Document URLs (uploaded via /api/upload/documents)
    documents?: string[];
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/upgrade/business', data);
    return response.data;
  }

  // Upload documents for organizer registration
  static async uploadDocuments(files: File[]): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('documents', file);
    });
    const response = await apiClient.post('/upload/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get upgrade status
  static async getUpgradeStatus(): Promise<ApiResponse> {
    const response = await apiClient.get('/upgrade/status');
    return response.data;
  }

  // ===== USER STATS API =====

  // Get user dashboard stats
  static async getUserDashboardStats(): Promise<ApiResponse> {
    const response = await apiClient.get('/user-stats/dashboard');
    return response.data;
  }

  // ===== COMMENTS API =====

  // Get comments for a ticket
  static async getTicketComments(ticketId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/comments/tickets/${ticketId}/comments`);
    return response.data;
  }

  // Create a new comment
  static async createComment(ticketId: string, data: {
    content: string;
    isInternal?: boolean;
    mentions?: string[];
  }): Promise<ApiResponse> {
    const response = await apiClient.post(`/comments/tickets/${ticketId}/comments`, data);
    return response.data;
  }

  // Update a comment
  static async updateComment(commentId: string, data: {
    content: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/comments/comments/${commentId}`, data);
    return response.data;
  }

  // Delete a comment
  static async deleteComment(commentId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/comments/comments/${commentId}`);
    return response.data;
  }

  // Get users for @mentions
  static async getUsersForMentions(): Promise<ApiResponse> {
    const response = await apiClient.get(`/comments/users/mentions`);
    return response.data;
  }

  // Analytics API methods
  static async getAnalytics(timeRange: string = '30d'): Promise<ApiResponse> {
    const response = await apiClient.get(`/analytics/customer-service?timeRange=${timeRange}`);
    return response.data;
  }

  static async getRealtimeAnalytics(): Promise<ApiResponse> {
    const response = await apiClient.get(`/analytics/customer-service/realtime`);
    return response.data;
  }

  // Teams API methods
  static async getTeams(): Promise<ApiResponse> {
    const response = await apiClient.get(`/teams`);
    return response.data;
  }

  static async getTeamMembers(teamId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/teams/${teamId}/members`);
    return response.data;
  }

  static async getTeamAnalytics(teamId: string, timeRange: string = '30d'): Promise<ApiResponse> {
    const response = await apiClient.get(`/teams/${teamId}/analytics?timeRange=${timeRange}`);
    return response.data;
  }

  static async autoAssignTicket(ticketId: string, category: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/teams/auto-assign`, {
      ticketId,
      category
    });
    return response.data;
  }

  static async addTeamMember(teamId: string, userId: string, role: string = 'MEMBER'): Promise<ApiResponse> {
    const response = await apiClient.post(`/teams/${teamId}/members`, {
      userId,
      role
    });
    return response.data;
  }

  static async removeTeamMember(teamId: string, userId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  }

  // Department Management API methods

  static async addDepartment(data: { name: string; description?: string; headId?: string }): Promise<ApiResponse> {
    const response = await apiClient.post(`/departments`, data);
    return response.data;
  }

  static async updateDepartment(id: string, data: { name?: string; description?: string; headId?: string; isActive?: boolean }): Promise<ApiResponse> {
    const response = await apiClient.put(`/departments/${id}`, data);
    return response.data;
  }

  static async deleteDepartment(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/departments/${id}`);
    return response.data;
  }

  // Escalation APIs
  static async escalateEvent(eventId: string, target: 'SENIOR_AGENT' | 'HEAD', reason?: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/escalation/events/${eventId}/escalate`, { target, reason });
    return response.data;
  }

  static async escalateOrganizer(organizerId: string, target: 'SENIOR_AGENT' | 'HEAD', reason?: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/escalation/organizers/${organizerId}/escalate`, { target, reason });
    return response.data;
  }

  // Head escalation review APIs
  static async getEscalatedCases(): Promise<ApiResponse> {
    const response = await apiClient.get('/escalation/escalated-cases');
    return response.data;
  }

  static async provideEscalationFeedback(type: 'event' | 'organizer', id: string, feedback: string, action: 'approve' | 'reject'): Promise<ApiResponse> {
    const response = await apiClient.post('/escalation/feedback', { type, id, feedback, action });
    return response.data;
  }

  static async getEventEscalationHistory(eventId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/escalation/events/${eventId}/history`);
    return response.data;
  }

  static async getOrganizerEscalationHistory(organizerId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/escalation/organizers/${organizerId}/history`);
    return response.data;
  }

  // Organizer Details and Actions
  static async getOrganizerDetails(organizerId: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/organizers/${organizerId}/details`);
    return response.data;
  }

  static async approveOrganizer(organizerId: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/organizers/${organizerId}/approve`);
    return response.data;
  }

  static async rejectOrganizer(organizerId: string, reason: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/organizers/${organizerId}/reject`, { reason });
    return response.data;
  }

  // Export functionality
  static async exportAgentAssignments(): Promise<ApiResponse> {
    const response = await apiClient.get('/operations/export/assignments', {
      responseType: 'text' // For CSV response
    });
    return response.data;
  }

  // Notification APIs
  static async getNotifications(params?: { page?: number; limit?: number; type?: string; unreadOnly?: boolean }): Promise<ApiResponse> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const response = await apiClient.get(`/notifications${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  static async getUnreadCount(): Promise<ApiResponse> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  }

  static async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  static async markAllNotificationsAsRead(): Promise<ApiResponse> {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  }

  static async deleteNotification(notificationId: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  static async deleteAllNotifications(): Promise<ApiResponse> {
    const response = await apiClient.delete('/notifications');
    return response.data;
  }

  // Balance APIs
  static async getBalance(): Promise<ApiResponse> {
    const response = await apiClient.get('/balance');
    return response.data;
  }

  static async getBalanceHistory(params?: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string }): Promise<ApiResponse> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const response = await apiClient.get(`/balance/history${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  static async getBalanceStats(): Promise<ApiResponse> {
    const response = await apiClient.get('/balance/stats');
    return response.data;
  }

  static async exportTransactionHistory(format: 'csv' | 'pdf' = 'csv', params?: { type?: string; startDate?: string; endDate?: string }): Promise<void> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await apiClient.get(`/balance/history/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from Content-Disposition header or generate default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `transaction_history_${new Date().toISOString().split('T')[0]}.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Payout Account APIs
  static async getPayoutAccounts(): Promise<ApiResponse> {
    const response = await apiClient.get('/payout-accounts');
    return response.data;
  }

  static async createPayoutAccount(data: {
    accountType: 'BANK_ACCOUNT' | 'E_WALLET';
    accountName: string;
    accountNumber: string;
    bankCode?: string;
    eWalletType?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.post('/payout-accounts', data);
    return response.data;
  }

  static async updatePayoutAccount(id: string, data: {
    accountName?: string;
    accountNumber?: string;
    bankCode?: string;
    eWalletType?: string;
  }): Promise<ApiResponse> {
    const response = await apiClient.put(`/payout-accounts/${id}`, data);
    return response.data;
  }

  static async deletePayoutAccount(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/payout-accounts/${id}`);
    return response.data;
  }

  static async setDefaultPayoutAccount(id: string): Promise<ApiResponse> {
    const response = await apiClient.patch(`/payout-accounts/${id}/set-default`);
    return response.data;
  }

  static async verifyPayoutAccount(id: string): Promise<ApiResponse> {
    const response = await apiClient.patch(`/payout-accounts/${id}/verify`);
    return response.data;
  }

  // Disbursement APIs
  static async requestPayout(data: {
    payoutAccountId: string;
    amount: number;
  }): Promise<ApiResponse> {
    console.log('🌐 API Service: requestPayout called with:', data);
    try {
      const response = await apiClient.post('/disbursements/request', data);
      console.log('🌐 API Service: Response received:', response);
      return response.data;
    } catch (error: any) {
      console.error('🌐 API Service: Error in requestPayout:', error);
      console.error('🌐 API Service: Error response:', error.response);
      throw error;
    }
  }

  static async getDisbursementHistory(params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }): Promise<ApiResponse> {
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    const response = await apiClient.get(`/disbursements${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  static async getDisbursementById(id: string): Promise<ApiResponse> {
    const response = await apiClient.get(`/disbursements/${id}`);
    return response.data;
  }

  static async cancelDisbursement(id: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/disbursements/${id}/cancel`);
    return response.data;
  }

  static async retryDisbursement(id: string): Promise<ApiResponse> {
    const response = await apiClient.post(`/disbursements/${id}/retry`);
    return response.data;
  }

  static async getFeeEstimate(amount: number): Promise<ApiResponse> {
    const response = await apiClient.get(`/disbursements/fee/estimate?amount=${amount}`);
    return response.data;
  }

  static async getAvailableBanks(): Promise<ApiResponse> {
    const response = await apiClient.get('/disbursements/banks/available');
    return response.data;
  }

  static async getAvailableEWallets(): Promise<ApiResponse> {
    const response = await apiClient.get('/disbursements/ewallets/available');
    return response.data;
  }
}

export default apiClient;
