import apiClient from './client'

// Customer API service
export const customerService = {
  // Get all customers
  getAllCustomers: async () => {
    const response = await apiClient.get('/customers')
    return response.data
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`)
    return response.data
  },

  // Create new customer
  createCustomer: async (customerData) => {
    const response = await apiClient.post('/customers', customerData)
    return response.data
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await apiClient.put(`/customers/${id}`, customerData)
    return response.data
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`)
    return response.data
  },

  // Update customer KYC
  updateCustomerKYC: async (id, kycData) => {
    const response = await apiClient.put(`/customers/${id}/kyc`, kycData)
    return response.data
  },
}

export default customerService
