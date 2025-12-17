import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import customerService from '../api/customerService'

const customerStore = create(
  persist(
    (set, get) => ({
      customers: [],
      loading: false,
      error: null,

      // Fetch all customers from backend
      fetchCustomers: async () => {
        set({ loading: true, error: null })
        try {
          const response = await customerService.getAllCustomers()
          const customers = response.customers || response
          set({ customers, loading: false })
          return customers
        } catch (error) {
          console.error('Failed to fetch customers:', error)
          set({ error: error.message, loading: false })
          throw error
        }
      },
      
      // Add new customer
      addCustomer: async (customerData) => {
        try {
          const newCustomer = await customerService.createCustomer(customerData)
          
          set((state) => ({
            customers: [...state.customers, newCustomer]
          }))
          
          return newCustomer
        } catch (error) {
          console.error('Failed to create customer:', error)
          throw error
        }
      },
      
      // Update customer
      updateCustomer: async (customerId, updatedData) => {
        try {
          const updatedCustomer = await customerService.updateCustomer(customerId, updatedData)
          
          set((state) => ({
            customers: state.customers.map(customer =>
              (customer.id === customerId || customer._id === customerId)
                ? updatedCustomer
                : customer
            )
          }))
          
          return updatedCustomer
        } catch (error) {
          console.error('Failed to update customer:', error)
          throw error
        }
      },
      
      // Delete customer
      deleteCustomer: async (customerId) => {
        try {
          await customerService.deleteCustomer(customerId)
          
          set((state) => ({
            customers: state.customers.filter(customer => 
              customer.id !== customerId && customer._id !== customerId
            )
          }))
          
          return true
        } catch (error) {
          console.error('Failed to delete customer:', error)
          throw error
        }
      },
      
      // Get customer by ID
      getCustomerById: (customerId) => {
        return get().customers.find(customer => customer.id === customerId)
      },
      
      // Get all customers
      getAllCustomers: () => {
        return get().customers
      },
      
      // Search customers
      searchCustomers: (query) => {
        const customers = get().customers
        if (!query) return customers
        
        const lowercaseQuery = query.toLowerCase()
        return customers.filter(customer =>
          customer.fullName?.toLowerCase().includes(lowercaseQuery) ||
          customer.fatherName?.toLowerCase().includes(lowercaseQuery) ||
          customer.phoneNumber?.includes(query) ||
          customer.email?.toLowerCase().includes(lowercaseQuery) ||
          customer.aadharNumber?.includes(query)
        )
      },
    }),
    {
      name: 'customer-storage',
    }
  )
)

export default customerStore
