import axios from 'axios'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from auth store
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage)
        if (state.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`
        }
      } catch (error) {
        console.error('Failed to parse auth storage', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const { state } = JSON.parse(authStorage)
          
          if (state.refreshToken) {
            // Try to refresh token
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: state.refreshToken,
            })

            const { accessToken } = response.data

            // Update stored token properly
            const updatedState = {
              ...state,
              accessToken,
            }
            localStorage.setItem('auth-storage', JSON.stringify({ state: updatedState }))

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return apiClient(originalRequest)
          }
        }
      } catch (refreshError) {
        // Token refresh failed - clear storage and redirect to login
        console.error('Token refresh failed:', refreshError)
        localStorage.removeItem('auth-storage')
        
        // Only show toast and redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          toast.error('Session expired. Please login again.')
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      }
    }

    // Handle 403 Forbidden - Access denied
    if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.')
      return Promise.reject(error)
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
    
    // Don't show toast for certain endpoints or network errors
    if (!originalRequest.url?.includes('/auth/') && error.response) {
      toast.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

export default apiClient
