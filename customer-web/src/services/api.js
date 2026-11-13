import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          const { accessToken, refreshToken: newRefreshToken } = response.data.data
          localStorage.setItem('token', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          error.config.headers.Authorization = `Bearer ${accessToken}`
          return api.request(error.config)
        } catch (refreshError) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.patch('/users/profile', data),
  getProfile: () => api.get('/auth/me'),
}

export const lodgesAPI = {
  search: (params) => api.get('/lodges', { params }),
  getFeatured: () => api.get('/lodges/featured'),
  getNearby: (params) => api.get('/lodges/nearby', { params }),
  getById: (id, params) => api.get(`/lodges/${id}`, { params }),
  getRooms: (lodgeId) => api.get(`/lodges/${lodgeId}/rooms`),
}

export const inventoryAPI = {
  checkAvailability: (params) => api.get('/inventory/availability', { params }),
  getCalendar: (params) => api.get('/inventory/calendar', { params }),
}

export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  rebook: (id) => api.post(`/bookings/${id}/rebook`),
}

export const paymentsAPI = {
  create: (data) => api.post('/payments', data),
  getById: (id) => api.get(`/payments/${id}`),
  getMyPayments: () => api.get('/payments'),
  verify: (paymentId, data) => api.post(`/payments/${paymentId}/verify`, data),
}

export const reviewsAPI = {
  getLodgeReviews: (lodgeId, params) => api.get(`/lodges/${lodgeId}/reviews`, { params }),
  create: (data) => api.post('/reviews', data),
}

export const uploadAPI = {
  uploadImage: (file, type) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const transportAPI = {
  create: (data) => api.post('/transport/request', data),
  getMyRequests: () => api.get('/transport'),
}

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export const settingsAPI = {
  getPublic: () => api.get('/settings/public'),
}

export default api