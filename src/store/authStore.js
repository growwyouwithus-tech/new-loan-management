import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { jwtDecode } from 'jwt-decode'
import { apiClient } from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (credentials) => {
        try {
          const response = await apiClient.post('/auth/login', credentials)
          const { accessToken, refreshToken, user } = response.data

          // Validate token before storing
          if (!accessToken || get().isTokenExpired(accessToken)) {
            throw new Error('Invalid or expired token received')
          }

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          })

          return { success: true, user }
        } catch (error) {
          return { 
            success: false, 
            error: error.response?.data?.message || 'Login failed' 
          }
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get()
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          const response = await apiClient.post('/auth/refresh', { refreshToken })
          const { accessToken } = response.data

          set({ accessToken })
          return accessToken
        } catch (error) {
          get().logout()
          throw error
        }
      },

      isTokenExpired: (token) => {
        if (!token) return true
        try {
          const decoded = jwtDecode(token)
          return decoded.exp * 1000 < Date.now()
        } catch {
          return true
        }
      },

      getValidToken: async () => {
        const { accessToken, isTokenExpired, refreshAccessToken } = get()
        
        if (!accessToken || isTokenExpired(accessToken)) {
          try {
            return await refreshAccessToken()
          } catch {
            return null
          }
        }
        
        return accessToken
      },

      hasRole: (allowedRoles) => {
        const { user } = get()
        if (!user || !user.role) return false
        return allowedRoles.includes(user.role)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
