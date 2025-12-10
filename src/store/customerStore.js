import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const customerStore = create(
  persist(
    (set, get) => ({
      customers: [],
      
      // Add new customer
      addCustomer: (customerData) => {
        const newCustomer = {
          id: Date.now().toString(),
          ...customerData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({
          customers: [...state.customers, newCustomer]
        }))
        
        return newCustomer
      },
      
      // Update customer
      updateCustomer: (customerId, updatedData) => {
        set((state) => ({
          customers: state.customers.map(customer =>
            customer.id === customerId
              ? { ...customer, ...updatedData, updatedAt: new Date().toISOString() }
              : customer
          )
        }))
        
        return get().customers.find(c => c.id === customerId)
      },
      
      // Delete customer
      deleteCustomer: (customerId) => {
        set((state) => ({
          customers: state.customers.filter(customer => customer.id !== customerId)
        }))
        return true
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
