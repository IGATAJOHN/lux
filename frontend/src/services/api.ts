import axios from 'axios';

// Detect API URL based on current hostname
// If accessing via network IP, use that IP for backend
// Otherwise use localhost
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE_URL = getApiUrl();
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  // Legacy simple registration (backward compatible)
  registerSimple: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: string;
    unique_id?: string;
    selfie_image?: string;
  }) => api.post('/auth/register-simple', data),

  // Enhanced registration with biometrics
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    unique_id: string;
    selfie_image: string;
  }) => api.post('/auth/register', data),

  // Verify unique ID before registration
  verifyUniqueId: (uniqueId: string) =>
    api.post('/auth/verify-unique-id', { unique_id: uniqueId }),

  login: (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);
    return api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  // Face biometric operations
  faceEnroll: (selfieImage: string) =>
    api.post('/auth/face-enroll', { selfie_image: selfieImage }),

  faceMatch: (selfieImage: string) =>
    api.post('/auth/face-match', { selfie_image: selfieImage }),
};

// Access Credential APIs
export const accessApi = {
  getMyCredentials: () => api.get('/access/my-credentials'),

  generatePin: () => api.post('/access/generate-pin'),

  generateQr: () => api.post('/access/generate-qr'),
};

// User APIs
export const userApi = {
  getProfile: () => api.get('/user/me'),
};

// Booking APIs
export const bookingApi = {
  create: (data: {
    check_in_date: string;
    check_out_date: string;
    room_type: string;
    preferences?: string;
  }) => api.post('/booking/create', data),

  list: () => api.get('/booking/'),

  initializePayment: (bookingId: number) => api.post(`/booking/payment/initialize/${bookingId}`),

  verifyPayment: (reference: string) => api.post(`/booking/payment/verify/${reference}`),

  confirm: (bookingId: number) => api.post(`/booking/confirm/${bookingId}`),

  checkIn: (bookingId: number) => api.post(`/booking/checkin/${bookingId}`),

  checkOut: (bookingId: number) => api.post(`/booking/checkout/${bookingId}`),
};

// Room APIs
export const roomApi = {
  list: (status?: string) => api.get('/rooms/', { params: status ? { status } : {} }),

  create: (data: {
    room_number: string;
    room_type: string;
    price_per_night: number;
    status?: string;
    image_url?: string;
  }) => api.post('/rooms/', data),

  assign: (bookingId: number, roomId: number) =>
    api.post('/rooms/assign', { booking_id: bookingId, room_id: roomId }),

  updateStatus: (roomId: number, status: string) =>
    api.put(`/rooms/${roomId}/status`, { status }),

  update: (roomId: number, data: Partial<{
    room_number: string;
    room_type: string;
    price_per_night: number;
    status: string;
    image_url: string;
    description: string;
  }>) => api.put(`/rooms/${roomId}`, data),
};

// Guest APIs
export const guestApi = {
  getDashboard: () => api.get('/guest/dashboard'),

  createServiceRequest: (requestType: string, description: string) =>
    api.post('/guest/request', { type: requestType, description }),

  getRequests: () => api.get('/guest/requests'),
};

// Admin APIs
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),

  getBookings: () => api.get('/admin/bookings'),

  getGuests: () => api.get('/admin/guests'),

  getRequests: () => api.get('/admin/requests'),

  updateRequest: (requestId: number, status: string) =>
    api.put(`/admin/request/${requestId}`, { status }),
};

// AI APIs
export const aiApi = {
  getFraudScore: () => api.post('/ai/fraud-score'),

  detectAnomaly: () => api.post('/ai/detect-anomaly'),

  getRecommendations: (guestId: number) => api.get(`/ai/recommendations?guestId=${guestId}`),

  checkIdFraud: (idImage: string) => api.post('/ai/id-fraud-score'),

  getChurnPrediction: (guestId: number) => api.get(`/ai/churn?guestId=${guestId}`),

  getAnomalies: () => api.get('/ai/anomalies'),
};

// Staff APIs
export const staffApi = {
  list: () => api.get('/staff/'),

  create: (data: {
    name: string;
    email: string;
    phone?: string;
    department: string;
    password?: string;
  }) => api.post('/staff/', data),

  assign: (requestId: number, staffId: number) =>
    api.post('/staff/assign', { request_id: requestId, staff_id: staffId }),
};

// Notification APIs
export const notifyApi = {
  notifyGuest: (userId: number, message: string) =>
    api.post(`/notify/guest/${userId}`, { message }),

  notifyStaff: (staffId: number, message: string) =>
    api.post(`/notify/staff/${staffId}`, { message }),
};

export const analyticsApi = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getGuestAnalytics: () => api.get('/analytics/guests'),
};

export default api;
