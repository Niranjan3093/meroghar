import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Let axios set the correct Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  verifyPhone: (data) => api.post('/auth/verify-phone', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
  uploadAvatar: (formData) => api.put('/auth/upload-avatar', formData),
  selectRole: (data) => api.put('/auth/select-role', data),
  logout: () => api.post('/auth/logout')
}

// Properties API
export const propertiesAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getHostProperties: () => api.get('/properties/host/my-properties'),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  search: (query) => api.get('/properties/search', { params: { q: query } }),
  getNearby: (lng, lat, radius) => api.get('/properties/nearby', { params: { lng, lat, radius } }),
  uploadImages: (id, formData) => api.post(`/properties/${id}/images`, formData, {
    headers: { 'Content-Type': undefined }
  })
}

// Leases API
export const leasesAPI = {
  getAll: () => api.get('/leases'),
  getById: (id) => api.get(`/leases/${id}`),
  create: (data) => api.post('/leases', data),
  update: (id, data) => api.put(`/leases/${id}`, data),
  sign: (id, signature) => api.post(`/leases/${id}/sign`, { signature }),
  requestRenewal: (id) => api.post(`/leases/${id}/renewal`),
  // DocuSign integration
  createEnvelope: (id) => api.post(`/leases/${id}/docusign/create-envelope`),
  getSigningUrl: (id) => api.get(`/leases/${id}/docusign/signing-url`),
  getDocuSignStatus: (id) => api.get(`/leases/${id}/docusign/status`),
  syncDocuSign: (id) => api.post(`/leases/${id}/docusign/sync`),
  download: (id) => api.get(`/leases/${id}/download`, { responseType: 'blob' }),
  getContract: (id) => api.get(`/leases/${id}/contract`)
}

// Payments API
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  verifyKhalti: (data) => api.post('/payments/khalti/verify', data),
  verifyEsewa: (data) => api.post('/payments/esewa/verify', data)
}

// Messages API
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (data) => api.post('/messages/conversation', data),
  createConversation: (receiverId, propertyId) => api.post('/messages/conversation', { receiverId, propertyId }),
  getMessages: (conversationId, params) => api.get(`/messages/${conversationId}`, { params }),
  send: (data) => api.post('/messages/send', data),
  sendMessage: (conversationId, content) => api.post('/messages/send', { conversationId, content }),
  markAsRead: (conversationId) => api.put(`/messages/${conversationId}/read`),
  blockUser: (conversationId) => api.post(`/messages/block/${conversationId}`),
  unblockUser: (userId) => api.delete(`/messages/block/${userId}`),
  report: (data) => api.post('/messages/report', data),
  reportUser: (conversationId, data) => api.post('/messages/report', { conversationId, ...data }),
  deleteConversation: (conversationId) => api.delete(`/messages/conversation/${conversationId}`)
}

// Lease Requests API
export const leaseRequestsAPI = {
  getAll: () => api.get('/lease-requests'),
  getMyRequests: () => api.get('/lease-requests'),
  getById: (id) => api.get(`/lease-requests/${id}`),
  create: (data) => api.post('/lease-requests', data),
  createRequest: (data) => api.post('/lease-requests', data),
  approve: (id, data) => api.put(`/lease-requests/${id}/approve`, data),
  reject: (id, data) => api.put(`/lease-requests/${id}/reject`, data),
  payDeposit: (id, data) => api.post(`/lease-requests/${id}/pay-deposit`, data),
  cancel: (id, data) => api.put(`/lease-requests/${id}/cancel`, data)
}

// Maintenance API
export const maintenanceAPI = {
  getAll: () => api.get('/maintenance'),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  resolve: (id, data) => api.post(`/maintenance/${id}/resolve`, data)
}

// Reviews API
export const reviewsAPI = {
  getAll: (propertyId) => api.get(`/reviews/property/${propertyId}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`)
}

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingProperties: () => api.get('/admin/properties/pending'),
  getAllProperties: (params) => api.get('/admin/properties', { params }),
  getPropertyDetails: (id) => api.get(`/admin/properties/${id}`),
  approveProperty: (id) => api.put(`/admin/properties/${id}/approve`),
  rejectProperty: (id, reason) => api.put(`/admin/properties/${id}/reject`, { reason }),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  banUser: (id, reason) => api.put(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`),
  getAllLeases: (params) => api.get('/admin/leases', { params })
}

// Analytics API
export const analyticsAPI = {
  getHostEarnings: () => api.get('/analytics/host/earnings'),
  getOccupancyRate: () => api.get('/analytics/occupancy-rate')
}

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications/clear-all'),
  sendWarning: (userId, title, message) => api.post('/notifications/admin-warning', { userId, title, message })
}

export default api
