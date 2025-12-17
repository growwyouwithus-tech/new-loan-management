import apiClient from './client'

// Loan API service
export const loanService = {
  // Get all loans
  getAllLoans: async () => {
    const response = await apiClient.get('/loans')
    return response.data
  },

  // Get loan by ID
  getLoanById: async (id) => {
    const response = await apiClient.get(`/loans/${id}`)
    return response.data
  },

  // Create new loan
  createLoan: async (loanData) => {
    const response = await apiClient.post('/loans', loanData)
    return response.data
  },

  // Update loan status
  updateLoanStatus: async (id, status, comment = '') => {
    const response = await apiClient.put(`/loans/${id}/status`, { status, comment })
    return response.data
  },

  // Update KYC status
  updateKYCStatus: async (id, kycStatus) => {
    const response = await apiClient.put(`/loans/${id}/kyc`, { kycStatus })
    return response.data
  },

  // Collect payment
  collectPayment: async (id, paymentData) => {
    const response = await apiClient.post(`/loans/${id}/payment`, paymentData)
    return response.data
  },

  // Apply penalty
  applyPenalty: async (id, penaltyData) => {
    const response = await apiClient.post(`/loans/${id}/penalty`, penaltyData)
    return response.data
  },

  // Set next due date
  setNextDueDate: async (id, dueDate) => {
    const response = await apiClient.put(`/loans/${id}/due-date`, { dueDate })
    return response.data
  },

  // Delete loan
  deleteLoan: async (id) => {
    const response = await apiClient.delete(`/loans/${id}`)
    return response.data
  },

  // Get loan statistics
  getStatistics: async () => {
    const response = await apiClient.get('/loans/statistics')
    return response.data
  },
}

export default loanService
