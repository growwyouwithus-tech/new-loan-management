import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import notificationStore from './notificationStore';
import loanService from '../api/loanService';

// Loan status flow: Pending -> Verified -> Approved -> Active/Overdue/Paid
const loanStore = create(
  persist(
    (set, get) => ({
      // All loans in the system
      loans: [],
      
      // Pending loans (submitted by shopkeeper, waiting for verification)
      pendingLoans: [],
      
      // Verified loans (verified by admin, waiting for final approval)
      verifiedLoans: [],
      
      // Approved loans (approved by admin, ready for collection)
      approvedLoans: [],
      
      // Active loans (currently being collected)
      activeLoans: [],
      
      // Completed loans
      completedLoans: [],

      // Loading state
      loading: false,
      error: null,

      // Fetch all loans from backend
      fetchLoans: async () => {
        set({ loading: true, error: null });
        try {
          const response = await loanService.getAllLoans();
          const loans = response.loans || response;
          
          // Categorize loans by status
          const pendingLoans = loans.filter(l => l.status === 'Pending');
          const verifiedLoans = loans.filter(l => l.status === 'Verified');
          const approvedLoans = loans.filter(l => l.status === 'Approved');
          const activeLoans = loans.filter(l => l.status === 'Active');
          const completedLoans = loans.filter(l => l.status === 'Paid' || l.status === 'Completed');
          
          set({ 
            loans,
            pendingLoans,
            verifiedLoans,
            approvedLoans,
            activeLoans,
            completedLoans,
            loading: false 
          });
          
          return loans;
        } catch (error) {
          console.error('Failed to fetch loans:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Add a new loan application (from shopkeeper)
      addLoanApplication: async (loanData) => {
        try {
          console.log('Submitting loan application:', loanData);
          
          // Save to backend first
          const response = await loanService.createLoan(loanData);
          console.log('Backend response:', response);
          
          const newLoan = response.loan || response;
          
          // Update local store with backend response
          set((state) => ({
            loans: [...state.loans, newLoan],
            pendingLoans: [...state.pendingLoans, newLoan],
          }));

          // Trigger notification for verifier
          notificationStore.getState().addNotification({
            type: 'new_loan_application',
            title: 'New Loan Application',
            message: `New loan application from ${loanData.clientName} (${newLoan.loanId || newLoan._id}) - Amount: ₹${loanData.loanAmount?.toLocaleString()}`,
            severity: 'medium',
            loanId: newLoan.loanId || newLoan._id,
            clientName: loanData.clientName,
            loanAmount: loanData.loanAmount,
            targetRole: 'verifier'
          });

          return newLoan;
        } catch (error) {
          console.error('Failed to create loan:', error);
          console.error('Error details:', error.response?.data);
          throw error;
        }
      },

      // Update loan status (admin actions)
      updateLoanStatus: async (loanId, newStatus, updatedBy = 'admin', comment = '') => {
        try {
          // Update in backend first
          const updatedLoan = await loanService.updateLoanStatus(loanId, newStatus, comment);
          
          // Update local store
          set((state) => {
            const updatedLoans = state.loans.map(l => 
              (l.id === loanId || l._id === loanId) ? updatedLoan : l
            );
            
            return {
              loans: updatedLoans,
              pendingLoans: state.pendingLoans.map(l => 
                (l.id === loanId || l._id === loanId) ? updatedLoan : l
              ),
              verifiedLoans: newStatus === 'Verified' 
                ? [...state.verifiedLoans.filter(l => l.id !== loanId && l._id !== loanId), updatedLoan]
                : state.verifiedLoans.map(l => (l.id === loanId || l._id === loanId) ? updatedLoan : l),
              approvedLoans: newStatus === 'Approved'
                ? [...state.approvedLoans.filter(l => l.id !== loanId && l._id !== loanId), updatedLoan]
                : state.approvedLoans.map(l => (l.id === loanId || l._id === loanId) ? updatedLoan : l),
            };
          });

          // Add KYC verification notification if loan is verified
          if (newStatus === 'Verified') {
            notificationStore.getState().addNotification({
              type: 'info',
              title: 'KYC Verification Required',
              message: `KYC verification needed for ${updatedLoan.customerName || updatedLoan.clientName}`,
              severity: 'medium',
              loanId: loanId,
            });
          }

          return true;
        } catch (error) {
          console.error('Failed to update loan status:', error);
          throw error;
        }
      },

      // Move verified loan to approved (final admin approval)
      approveLoan: (loanId) => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan) return false;

        const updatedLoan = {
          ...loan,
          status: 'Approved',
          approvedDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          loans: state.loans.map(l => l.id === loanId ? updatedLoan : l),
          // Remove from pending loans when approved but keep in verifiedLoans
          pendingLoans: state.pendingLoans.filter(l => l.id !== loanId),
          verifiedLoans: state.verifiedLoans.map(l => l.id === loanId ? updatedLoan : l),
          approvedLoans: [...state.approvedLoans.filter(l => l.id !== loanId), updatedLoan],
        }));

        // Add notification for loan approval
        notificationStore.getState().addNotification({
          type: 'success',
          title: 'Loan Approved',
          message: `Loan for ${loan.customerName} (ID: ${loanId}) has been approved`,
          severity: 'medium',
          loanId: loanId,
          clientId: loan.customerId,
        });

        return true;
      },

      // Reject loan
      rejectLoan: (loanId, reason = '') => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan) return false;

        const updatedLoan = {
          ...loan,
          status: 'Rejected',
          rejectionReason: reason,
          rejectedDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          loans: state.loans.map(l => l.id === loanId ? updatedLoan : l),
          pendingLoans: state.pendingLoans.map(l => l.id === loanId ? updatedLoan : l),
          verifiedLoans: state.verifiedLoans.map(l => l.id === loanId ? updatedLoan : l),
        }));

        return true;
      },

      // Collections officer actions
      collectPayment: async (loanId, paymentData) => {
        try {
          console.log('Collecting payment for loan:', loanId);
          console.log('Payment data:', paymentData);
          
          // Save payment to backend first
          const response = await loanService.collectPayment(loanId, paymentData);
          console.log('Backend response:', response);
          
          // Extract loan from response (backend returns { message, loan, payment })
          const updatedLoan = response.loan || response;
          
          // Update local store
          set((state) => {
            const updatedLoans = state.loans.map(l => 
              (l.id === loanId || l._id === loanId || String(l._id) === String(loanId)) ? updatedLoan : l
            );
            
            return {
              loans: updatedLoans,
              activeLoans: state.activeLoans.some(l => l.id === loanId || l._id === loanId || String(l._id) === String(loanId))
                ? updatedLoan.status === 'Paid' 
                  ? state.activeLoans.filter(l => l.id !== loanId && l._id !== loanId && String(l._id) !== String(loanId))
                  : state.activeLoans.map(l => (l.id === loanId || l._id === loanId || String(l._id) === String(loanId)) ? updatedLoan : l)
                : state.activeLoans,
              approvedLoans: state.approvedLoans.some(l => l.id === loanId || l._id === loanId || String(l._id) === String(loanId))
                ? state.approvedLoans.filter(l => l.id !== loanId && l._id !== loanId && String(l._id) !== String(loanId))
                : state.approvedLoans,
              ...(state.approvedLoans.some(l => l.id === loanId || l._id === loanId || String(l._id) === String(loanId)) && updatedLoan.status !== 'Paid' && {
                activeLoans: [...state.activeLoans, updatedLoan]
              }),
              completedLoans: updatedLoan.status === 'Paid'
                ? [...state.completedLoans, updatedLoan]
                : state.completedLoans,
            };
          });

          console.log('Updated loan in store:', updatedLoan);
          console.log('Payments array:', updatedLoan.payments);

          // Record payment for EMI Management synchronization
          get().recordPayment({
            id: `PAY${Date.now()}`,
            loanId: loanId,
            amount: paymentData.amount,
            paymentMode: paymentData.paymentMode,
            date: paymentData.paymentDate,
            collectedBy: paymentData.collectedBy || 'collections',
            transactionId: paymentData.transactionId || '',
            emiNumber: (updatedLoan.emisPaid || 0),
            createdAt: new Date().toISOString(),
          });

          return true;
        } catch (error) {
          console.error('Failed to collect payment:', error);
          console.error('Error details:', error.response?.data);
          throw error;
        }
      },

      // Get loans by status
      getLoansByStatus: (status) => {
        return get().loans.filter(loan => loan.status === status);
      },

      // Get loan by ID
      getLoanById: (loanId) => {
        return get().loans.find(loan => loan.id === loanId);
      },

      // Initialize approved loans as active loans for collections
      initializeActiveLoans: () => {
        const approvedLoans = get().approvedLoans;
        console.log('initializeActiveLoans - Approved Loans:', approvedLoans);
        
        if (approvedLoans.length === 0) {
          console.log('No approved loans to initialize');
          return;
        }

        const activatedLoans = approvedLoans.map(loan => {
          // Use emiStartDate if available, otherwise use appliedDate, otherwise calculate 30 days from now
          const firstEmiDate = loan.emiStartDate || loan.appliedDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          return {
            ...loan,
            status: 'Active',
            emisPaid: loan.emisPaid || 0,
            emisRemaining: loan.emisRemaining || loan.tenure,
            nextDueDate: loan.nextDueDate || firstEmiDate,
          };
        });

        console.log('Activated Loans:', activatedLoans);

        set((state) => {
          // Filter out loans that are already in activeLoans to avoid duplicates
          const existingActiveLoanIds = state.activeLoans.map(loan => loan.id);
          const newActiveLoans = activatedLoans.filter(loan => !existingActiveLoanIds.includes(loan.id));
          
          console.log('Existing Active Loan IDs:', existingActiveLoanIds);
          console.log('New Active Loans to add:', newActiveLoans);
          
          // Update main loans array with new status
          const updatedLoans = state.loans.map(loan => 
            activatedLoans.find(al => al.id === loan.id) 
              ? { ...loan, status: 'Active' }
              : loan
          );
          
          return {
            loans: updatedLoans,
            activeLoans: [...state.activeLoans, ...newActiveLoans],
            approvedLoans: state.approvedLoans.filter(loan => !newActiveLoans.find(al => al.id === loan.id)), // Only remove newly activated loans
          };
        });
      },

      // Clear all data (for testing)
      clearAllLoans: () => {
        set({
          loans: [],
          pendingLoans: [],
          verifiedLoans: [],
          approvedLoans: [],
          activeLoans: [],
          completedLoans: [],
        });
      },

      // Delete loan
      deleteLoan: (loanId) => {
        const loan = get().loans.find(l => l.id === loanId || l._id === loanId);
        if (!loan) return false;

        set((state) => ({
          loans: state.loans.filter(l => l.id !== loanId && l._id !== loanId),
          pendingLoans: state.pendingLoans.filter(l => l.id !== loanId && l._id !== loanId),
          verifiedLoans: state.verifiedLoans.filter(l => l.id !== loanId && l._id !== loanId),
          approvedLoans: state.approvedLoans.filter(l => l.id !== loanId && l._id !== loanId),
          activeLoans: state.activeLoans.filter(l => l.id !== loanId && l._id !== loanId),
          completedLoans: state.completedLoans.filter(l => l.id !== loanId && l._id !== loanId),
        }));

        return true;
      },

      // Update customer KYC status
      updateCustomerKYC: (loanId, kycStatus, verifiedBy = 'admin') => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan) return false;

        const updatedLoan = {
          ...loan,
          kycStatus,
          kycVerifiedBy: verifiedBy,
          kycVerifiedDate: kycStatus === 'verified' ? new Date().toISOString().split('T')[0] : null,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          loans: state.loans.map(l => l.id === loanId ? updatedLoan : l),
          pendingLoans: state.pendingLoans.map(l => l.id === loanId ? updatedLoan : l),
          verifiedLoans: state.verifiedLoans.map(l => l.id === loanId ? updatedLoan : l),
          approvedLoans: state.approvedLoans.map(l => l.id === loanId ? updatedLoan : l),
          activeLoans: state.activeLoans.map(l => l.id === loanId ? updatedLoan : l),
        }));

        return true;
      },

      // Apply penalty for overdue EMI
      applyPenalty: (loanId, penaltyAmount = 500, reason = 'EMI Overdue') => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan) return false;

        const penalty = {
          id: Date.now(),
          amount: penaltyAmount,
          reason,
          appliedDate: new Date().toISOString().split('T')[0],
          appliedAt: new Date().toISOString(),
        };

        const updatedLoan = {
          ...loan,
          penalties: [...(loan.penalties || []), penalty],
          totalPenalty: (loan.totalPenalty || 0) + penaltyAmount,
          status: loan.status === 'Active' ? 'Overdue' : loan.status,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          loans: state.loans.map(l => l.id === loanId ? updatedLoan : l),
          activeLoans: state.activeLoans.map(l => l.id === loanId ? updatedLoan : l),
        }));

        return true;
      },

      // Check and apply penalties for overdue loans (run daily at 12 AM)
      checkAndApplyPenalties: () => {
        const currentDate = new Date();
        const loans = get().loans.filter(l => l.status === 'Active' && l.nextDueDate);
        
        loans.forEach(loan => {
          const dueDate = new Date(loan.nextDueDate);
          // Check if current date is past due date and it's after 12 AM
          if (currentDate > dueDate && currentDate.getHours() >= 0) {
            // Check if penalty already applied for this due date
            const penaltyAlreadyApplied = loan.penalties?.some(p => 
              p.appliedDate === currentDate.toISOString().split('T')[0] && 
              p.reason === 'EMI Overdue'
            );
            
            if (!penaltyAlreadyApplied) {
              get().applyPenalty(loan.id, 500, 'EMI Overdue');
            }
          }
        });
      },

      // Set next due date when loan is approved
      setNextDueDate: (loanId, dueDate) => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan) return false;

        const updatedLoan = {
          ...loan,
          nextDueDate: dueDate,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          loans: state.loans.map(l => l.id === loanId ? updatedLoan : l),
          approvedLoans: state.approvedLoans.map(l => l.id === loanId ? updatedLoan : l),
          activeLoans: state.activeLoans.map(l => l.id === loanId ? updatedLoan : l),
        }));

        return true;
      },

      // Get statistics
      getStatistics: () => {
        const loans = get().loans;
        return {
          totalLoans: loans.length,
          pendingLoans: loans.filter(l => l.status === 'Pending').length,
          verifiedLoans: loans.filter(l => l.status === 'Verified').length,
          approvedLoans: loans.filter(l => l.status === 'Approved').length,
          activeLoans: loans.filter(l => l.status === 'Active').length,
          overdueLoans: loans.filter(l => l.status === 'Overdue').length,
          completedLoans: loans.filter(l => l.status === 'Paid').length,
          rejectedLoans: loans.filter(l => l.status === 'Rejected').length,
          totalPenalties: loans.reduce((sum, loan) => sum + (loan.totalPenalty || 0), 0),
        };
      },

      // Record payment for EMI Management
      recordPayment: (paymentRecord) => {
        set((state) => ({
          payments: [...(state.payments || []), paymentRecord]
        }));
      },

      // Get all payments
      payments: [],
      getPayments: () => get().payments || [],

      // Generate completion report for fully paid loans
      generateCompletionReport: (loanId) => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan || loan.status !== 'Paid') return null;

        const totalPaid = loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const completionDate = loan.payments?.[loan.payments.length - 1]?.paymentDate || new Date().toISOString().split('T')[0];

        return {
          loanId: loan.loanId,
          clientName: loan.clientName,
          clientPhone: loan.clientPhone,
          loanAmount: loan.loanAmount,
          interestRate: loan.interestRate,
          tenure: loan.tenure,
          appliedDate: loan.appliedDate,
          approvedDate: loan.approvedDate,
          completionDate,
          totalPaid,
          totalEMIs: loan.payments?.length || 0,
          status: 'Completed',
          generatedAt: new Date().toISOString(),
        };
      },

      // Get all completion reports
      getCompletionReports: () => {
        return get().completedLoans.map(loan => get().generateCompletionReport(loan.id)).filter(Boolean);
      },
    }),
    {
      name: 'loan-store',
      partialize: (state) => ({
        loans: state.loans,
        pendingLoans: state.pendingLoans,
        verifiedLoans: state.verifiedLoans,
        approvedLoans: state.approvedLoans,
        activeLoans: state.activeLoans,
        completedLoans: state.completedLoans,
        payments: state.payments,
      }),
    }
  )
);

export default loanStore;
