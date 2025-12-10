import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { playNotificationSound } from '../utils/notificationSound'

const notificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      
      // Add new notification
      addNotification: (notification) => {
        const newNotification = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        }
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50 notifications
        }))
        
        // Play notification sound
        playNotificationSound()
        
        return newNotification
      },
      
      // Mark notification as read
      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        }))
      },
      
      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }))
      },
      
      // Get unread notifications count
      getUnreadCount: () => {
        return get().notifications.filter(n => !n.read).length
      },
      
      // Get recent notifications
      getRecentNotifications: (limit = 10) => {
        return get().notifications.slice(0, limit)
      },
      
      // Clear all notifications
      clearAll: () => {
        set({ notifications: [] })
      },
      
      // Clear notifications for specific role
      clearForRole: (role) => {
        const currentNotifications = get().notifications
        const roleNotifications = currentNotifications.filter(notification => {
          // Filter notifications based on role relevance
          switch(role) {
            case 'admin':
              // Admin sees all notifications except some specific ones
              return notification.type !== 'payment_overdue' || notification.severity === 'high'
            case 'verifier':
              // Verifier only sees verification-related notifications
              return ['kyc_required', 'new_loan_application'].includes(notification.type)
            case 'collections':
              // Collections only sees payment-related notifications
              return ['payment_due', 'payment_overdue'].includes(notification.type)
            case 'shopkeeper':
              // Shopkeeper sees notifications about their applications
              return notification.type === 'new_loan_application'
            default:
              return false
          }
        })
        set({ notifications: currentNotifications.filter(n => !roleNotifications.includes(n)) })
      },
      
      // Get notifications by role
      getNotificationsByRole: (role) => {
        const notifications = get().notifications
        return notifications.filter(notification => {
          switch(role) {
            case 'admin':
              return notification.type !== 'payment_overdue' || notification.severity === 'high'
            case 'verifier':
              return ['kyc_required', 'new_loan_application'].includes(notification.type)
            case 'collections':
              return ['payment_due', 'payment_overdue'].includes(notification.type)
            case 'shopkeeper':
              return notification.type === 'new_loan_application'
            default:
              return false
          }
        })
      },
      
      // Get which panels have notifications
      getPanelsWithNotifications: () => {
        const notifications = get().notifications
        const panels = {}
        
        if (notifications.filter(n => n.type !== 'payment_overdue' || n.severity === 'high').length > 0) {
          panels.admin = notifications.filter(n => n.type !== 'payment_overdue' || n.severity === 'high').length
        }
        
        if (notifications.filter(n => ['kyc_required', 'new_loan_application'].includes(n.type)).length > 0) {
          panels.verifier = notifications.filter(n => ['kyc_required', 'new_loan_application'].includes(n.type)).length
        }
        
        if (notifications.filter(n => ['payment_due', 'payment_overdue'].includes(n.type)).length > 0) {
          panels.collections = notifications.filter(n => ['payment_due', 'payment_overdue'].includes(n.type)).length
        }
        
        if (notifications.filter(n => n.type === 'new_loan_application').length > 0) {
          panels.shopkeeper = notifications.filter(n => n.type === 'new_loan_application').length
        }
        
        return panels
      },
      
      // Generate notifications based on loan data
      generateLoanNotifications: (loans, activeLoans) => {
        const notifications = []
        const today = new Date()
        
        // Check for overdue payments
        activeLoans.forEach(loan => {
          if (loan.nextDueDate) {
            const dueDate = new Date(loan.nextDueDate)
            const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24))
            
            if (daysOverdue > 0) {
              notifications.push({
                type: 'payment_overdue',
                title: 'Payment Overdue',
                message: `${loan.clientName}'s EMI is ${daysOverdue} days overdue (Loan: ${loan.loanId})`,
                severity: 'high',
                loanId: loan.loanId,
                clientId: loan.clientMobile,
                daysOverdue,
                amount: loan.emiAmount,
              })
            }
          }
        })
        
        // Check for loans needing KYC verification
        loans.forEach(loan => {
          if (loan.status === 'pending' && loan.kycStatus !== 'verified') {
            notifications.push({
              type: 'kyc_required',
              title: 'KYC Verification Required',
              message: `${loan.clientName}'s KYC needs verification (Loan: ${loan.loanId})`,
              severity: 'medium',
              loanId: loan.loanId,
              clientId: loan.clientMobile,
              kycStatus: loan.kycStatus || 'pending',
            })
          }
        })
        
        return notifications
      },
      
      // Check and update notifications
      updateNotifications: (loans, activeLoans) => {
        const newNotifications = get().generateLoanNotifications(loans, activeLoans)
        
        // Add new notifications that don't already exist
        newNotifications.forEach(newNotif => {
          const exists = get().notifications.some(existing => 
            existing.type === newNotif.type && 
            existing.loanId === newNotif.loanId &&
            existing.message === newNotif.message
          )
          
          if (!exists) {
            get().addNotification(newNotif)
          }
        })
        
        // Remove notifications that are no longer relevant
        set((state) => {
          const currentLoanIds = loans.map(l => l.loanId)
          const currentActiveIds = activeLoans.map(l => l.loanId)
          
          return {
            notifications: state.notifications.filter(notif => {
              if (notif.type === 'payment_overdue') {
                return currentActiveIds.includes(notif.loanId)
              }
              if (notif.type === 'kyc_required') {
                return currentLoanIds.includes(notif.loanId)
              }
              return true
            })
          }
        })
      },
    }),
    {
      name: 'notifications-storage',
    }
  )
)

export default notificationStore
