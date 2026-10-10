const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('quickhaul_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('quickhaul_token', token);
  else localStorage.removeItem('quickhaul_token');
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profile) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profile) }),

  // Vehicles
  getCategories: () => request('/vehicles/categories'),
  estimateFare: (payload) => request('/vehicles/estimate', { method: 'POST', body: JSON.stringify(payload) }),

  // Bookings
  createBooking: (bookingData) => request('/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
  getCustomerBookings: (status = 'all') => request(`/bookings/my-customer?status=${status}`),
  getDriverBookings: (status = 'all') => request(`/bookings/my-driver?status=${status}`),
  getBookingById: (id) => request(`/bookings/${id}`),
  getTracking: (id) => request(`/bookings/${id}/tracking`),
  acceptBooking: (id) => request(`/bookings/${id}/accept`, { method: 'PUT' }),
  updateTripStatus: (id, payload) => request(`/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  cancelBooking: (id, reason) => request(`/bookings/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),

  // Driver
  toggleOnline: (is_online) => request('/driver/availability', { method: 'PUT', body: JSON.stringify({ is_online }) }),
  updateDriverLocation: (loc) => request('/driver/location', { method: 'PUT', body: JSON.stringify(loc) }),
  updateDriverDocuments: (docs) => request('/driver/documents', { method: 'PUT', body: JSON.stringify(docs) }),
  getDriverEarnings: () => request('/driver/earnings'),
  requestPayout: (payload) => request('/driver/payout', { method: 'POST', body: JSON.stringify(payload) }),

  // Admin
  getAdminStats: () => request('/admin/stats'),
  getAdminDrivers: (status) => request(`/admin/drivers${status ? `?status=${status}` : ''}`),
  verifyDriver: (id, payload) => request(`/admin/drivers/${id}/verify`, { method: 'PUT', body: JSON.stringify(payload) }),
  getAdminBookings: (params = '') => request(`/admin/bookings${params}`),
  getAdminUsers: () => request('/admin/users'),
  toggleUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAdminTransactions: () => request('/admin/transactions'),
  updateCategoryPricing: (id, payload) => request(`/admin/categories/${id}/pricing`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Support
  createTicket: (payload) => request('/support/tickets', { method: 'POST', body: JSON.stringify(payload) }),
  getUserTickets: () => request('/support/my-tickets'),
  getAllTickets: (params = '') => request(`/support/all-tickets${params}`),
  updateTicket: (id, payload) => request(`/support/tickets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Payments
  processPayment: (payload) => request('/payments/process', { method: 'POST', body: JSON.stringify(payload) }),
  getPaymentHistory: () => request('/payments/history'),

  // Reviews
  addReview: (payload) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getDriverReviews: (driverId) => request(`/reviews/driver/${driverId}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id = 'all') => request(`/notifications/${id}/read`, { method: 'PUT' }),
};
