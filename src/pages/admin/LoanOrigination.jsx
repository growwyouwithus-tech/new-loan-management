import { useState, useEffect } from 'react'
import { Plus, Eye, CheckCircle, XCircle, Clock, User, Calendar, CreditCard, ArrowRight, FileText, Filter } from 'lucide-react'
import { toast } from 'react-toastify'
import loanStore from '../../store/loanStore'
import shopkeeperStore from '../../store/shopkeeperStore'
import { useNavigate } from 'react-router-dom'

// Calculate next EMI due date based on loan date
const calculateNextEMIDueDate = (loanDateStr) => {
  const loanDate = new Date(loanDateStr)
  const loanDay = loanDate.getDate()

  let nextDueDate = new Date(loanDate)

  if (loanDay >= 1 && loanDay <= 18) {
    // If loan date is 1-18, next EMI is on 2nd of next month
    nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    nextDueDate.setDate(2)
  } else {
    // If loan date is 19-end of month, next EMI is on 2nd of month after next
    nextDueDate.setMonth(nextDueDate.getMonth() + 2)
    nextDueDate.setDate(2)
  }

  return nextDueDate.toISOString().split('T')[0]
}

export default function LoanOrigination() {
  const navigate = useNavigate()
  const { loans, verifiedLoans, approveLoan, rejectLoan, setNextDueDate, getStatistics, fetchLoans, loading } = loanStore()
  const { shopkeepers, fetchShopkeepers } = shopkeeperStore()
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedShopkeeper, setSelectedShopkeeper] = useState('all')

  useEffect(() => {
    fetchLoans()
    fetchShopkeepers()
  }, [])

  const stats = getStatistics()

  // Filter loans based on selected shopkeeper
  // Filter loans based on selected shopkeeper (Show All Loans)
  const filteredVerifiedLoans = loans.filter(loan => {
    // Shopkeeper check
    const rawId = loan.shopkeeperId;
    // Handle both populated object and direct ID string
    const loanShopkeeperId = rawId?._id || rawId?.id || rawId;

    const matchesShopkeeper = selectedShopkeeper === 'all' ||
      String(loanShopkeeperId || '').trim().toLowerCase() === String(selectedShopkeeper || '').trim().toLowerCase();

    return matchesShopkeeper
  })

  const handleApproveLoan = (loanId) => {
    const success = approveLoan(loanId)
    if (success) {
      // Get the loan to find its approval date
      const loan = loans.find(l => l.id === loanId)
      if (loan) {
        // Calculate next due date based on approval date
        const approvalDate = loan.approvedDate || new Date().toISOString().split('T')[0]
        const nextDueDate = calculateNextEMIDueDate(approvalDate)
        setNextDueDate(loanId, nextDueDate)
      }

      toast.success('Loan approved successfully and moved to collections!')
      setShowApprovalModal(false)
      setSelectedLoan(null)
    } else {
      toast.error('Failed to approve loan')
    }
  }

  const handleRejectLoan = (loanId, reason) => {
    const success = rejectLoan(loanId, reason)
    if (success) {
      toast.success('Loan rejected successfully')
      setShowApprovalModal(false)
      setSelectedLoan(null)
    } else {
      toast.error('Failed to reject loan')
    }
  }

  const openApprovalModal = (loan) => {
    setSelectedLoan(loan)
    setShowApprovalModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Origination</h1>
          <p className="text-gray-600">Manage verified loan applications for final approval</p>
        </div>

        {/* Shopkeeper Filter */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedShopkeeper}
            onChange={(e) => setSelectedShopkeeper(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer outline-none"
          >
            <option value="all">All Shopkeepers</option>
            {shopkeepers.map(sk => (
              <option key={sk._id || sk.id} value={sk._id || sk.id}>
                {sk.shopName || sk.name} ({sk.fullName || sk.ownerName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4">
        {/* ... existing summary cards ... */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Verified Loans</p>
              <p className="text-2xl font-bold text-blue-600">{stats.verifiedLoans}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 !text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold !text-green-600">{stats.approvedLoans}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeLoans}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueLoans}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Loans Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Verified Loans Awaiting Approval</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Review and approve verified loan applications</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVerifiedLoans.length > 0 ? (
                filteredVerifiedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{loan.loanId}</div>
                      <div className="text-sm text-gray-500">Applied: {loan.appliedDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                          <div className="text-sm text-gray-500">{loan.clientMobile}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{loan.productName}</div>
                      <div className="text-sm text-gray-500">₹{loan.price?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{loan.loanAmount?.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{loan.tenure} months @ 3.5%</div>
                      <div className="text-sm text-gray-500">EMI: ₹{loan.emiAmount?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.kycStatus === 'verified' ? '!bg-green-100 !text-green-800' :
                        loan.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {loan.kycStatus || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openApprovalModal(loan)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Review & Approve"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleApproveLoan(loan.id)}
                        className="!text-green-600 hover:!text-green-900"
                        title="Quick Approve"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleRejectLoan(loan.id, 'Rejected by origination')}
                        className="text-red-600 hover:text-red-900"
                        title="Reject"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No verified loans awaiting approval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Loan Approval Review</h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Loan ID</p>
                    <p className="font-medium">{selectedLoan.loanId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Borrower</p>
                    <p className="font-medium">{selectedLoan.clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Product</p>
                    <p className="font-medium">{selectedLoan.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Loan Amount</p>
                    <p className="font-medium">₹{selectedLoan.loanAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">EMI Amount</p>
                    <p className="font-medium">₹{selectedLoan.emiAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tenure</p>
                    <p className="font-medium">{selectedLoan.tenure} months</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectLoan(selectedLoan.id, 'Rejected after review')}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveLoan(selectedLoan.id)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white !bg-green-500 !hover:bg-green-600"
                  >
                    Approve & Send to Collections
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
