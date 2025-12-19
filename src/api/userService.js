import apiClient from './client'

export const userService = {
  getAllUsers: async () => {
    const response = await apiClient.get('/users')
    return response.data
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData)
    return response.data
  },

  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData)
    return response.data
  },

  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`)
    return response.data
  },
}
