import Dexie from 'dexie'

// Initialize Dexie database for offline support
export const db = new Dexie('LoanManagementDB')

db.version(1).stores({
  payments: '++id, loanId, amount, method, timestamp, synced',
  loans: '++id, customerId, amount, status, createdAt, synced',
  customers: '++id, name, phone, email, createdAt, synced',
})

// Sync function to sync offline data with server
export async function syncOfflineData() {
  try {
    // Get all unsynced payments
    const unsyncedPayments = await db.payments.where('synced').equals(false).toArray()
    
    if (unsyncedPayments.length > 0) {
      // TODO: Send to server API
      console.log('Syncing payments:', unsyncedPayments)
      
      // Mark as synced after successful API call
      await Promise.all(
        unsyncedPayments.map((payment) =>
          db.payments.update(payment.id, { synced: true })
        )
      )
    }

    // Get all unsynced loans
    const unsyncedLoans = await db.loans.where('synced').equals(false).toArray()
    
    if (unsyncedLoans.length > 0) {
      // TODO: Send to server API
      console.log('Syncing loans:', unsyncedLoans)
      
      // Mark as synced after successful API call
      await Promise.all(
        unsyncedLoans.map((loan) =>
          db.loans.update(loan.id, { synced: true })
        )
      )
    }

    return { success: true, synced: unsyncedPayments.length + unsyncedLoans.length }
  } catch (error) {
    console.error('Sync failed:', error)
    return { success: false, error }
  }
}

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online, syncing data...')
    syncOfflineData()
  })
}

export default db
