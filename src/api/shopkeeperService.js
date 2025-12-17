import apiClient from './client'

// Shopkeeper API service
export const shopkeeperService = {
  // Get all shopkeepers
  getAllShopkeepers: async () => {
    const response = await apiClient.get('/shopkeepers')
    return response.data
  },

  // Get shopkeeper by ID
  getShopkeeperById: async (id) => {
    const response = await apiClient.get(`/shopkeepers/${id}`)
    return response.data
  },

  // Create new shopkeeper
  createShopkeeper: async (shopkeeperData) => {
    const response = await apiClient.post('/shopkeepers', shopkeeperData)
    return response.data
  },

  // Update shopkeeper
  updateShopkeeper: async (id, shopkeeperData) => {
    const response = await apiClient.put(`/shopkeepers/${id}`, shopkeeperData)
    return response.data
  },

  // Delete shopkeeper
  deleteShopkeeper: async (id) => {
    const response = await apiClient.delete(`/shopkeepers/${id}`)
    return response.data
  },

  // Update shopkeeper KYC
  updateShopkeeperKYC: async (id, kycData) => {
    const response = await apiClient.put(`/shopkeepers/${id}/kyc`, kycData)
    return response.data
  },

  // Get shopkeeper statistics
  getStatistics: async () => {
    const response = await apiClient.get('/shopkeepers/statistics')
    return response.data
  },
}

export default shopkeeperService
