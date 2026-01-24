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

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    applicationType: 'all',
    loanStatus: 'all',
    shopkeeperId: 'all'
  })

  useEffect(() => {
    fetchLoans()
    fetchShopkeepers()
  }, [])

  const stats = getStatistics()

  // Filter loans based on all criteria
  const filteredVerifiedLoans = loans.filter(loan => {
    // 1. Status Filter (Default to Verified for this page unless specified)
    // Since this page is "Verified Loans", we might default to showing Verified, but if user filters "all" or specific status, we respect it?
    // The user stores 'verifiedLoans' in store but uses 'loans' here which has ALL loans.
    // The previous code filtered from 'loans' effectively relying on 'verifiedLoans' mainly? No, line 30 imports 'verifiedLoans' but line 45 uses 'loans'.
    // Use 'loans' as base but filter by the selected status if provided, or default to logic relevant for this page?
    // The original code was: const filteredVerifiedLoans = loans.filter(...)
    // WITHOUT checking for status='Verified'. This suggests 'loans' in this component MIGHT be intended to be just verified ones?
    // Wait, line 30: const { loans, verifiedLoans... } = loanStore().
    // Line 45: const filteredVerifiedLoans = loans.filter(...)
    // If 'loans' contains ALL loans (pending, approved, etc), then the previous code was showing ALL loans for that shopkeeper, not just verified ones.
    // BUT the variable name is 'filteredVerifiedLoans'.
    // Let's look at loanStore line 37: it fetches all loans.
    // So current code was actually showing ALL loans for the shopkeeper, regardless of status?
    // Wait, if I scroll down to the original table, it says "Verified Loans Awaiting Approval".
    // If the previous code didn't filter by status, it was showing everything?
    // Let's ASSUME for this "Verified Loans" page, we should ostensibly default to 'Verified' or 'Pending Approval' status,
    // BUT the user asked to "add filters". One of them is "Loan Status". This implies they want to control it.
    // So I will filter by the selected status. If 'all', maybe I should show all?
    // However, usually these pages are specific.
    // Let's stick to the user's request: Add "Loan Status" filter.

    // Status Check
    const matchesStatus = filters.loanStatus === 'all' ||
      (loan.status || '').toLowerCase() === filters.loanStatus.toLowerCase();

    // Shopkeeper Check (Using Shop Name for robust matching)
    const matchesShopkeeper = filters.shopkeeperId === 'all' ||
      (loan.shopName || '').trim().toLowerCase() === (filters.shopkeeperId || '').trim().toLowerCase();

    // Date Range Check (Applied Date)
    let matchesDate = true;
    if (filters.startDate || filters.endDate) {
      const loanDate = new Date(loan.appliedDate);
      if (filters.startDate) {
        matchesDate = matchesDate && loanDate >= new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Add one day to end date to include the full day
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && loanDate <= end;
      }
    }

    // Application Type Check
    const matchesAppType = filters.applicationType === 'all' ||
      (loan.applicationMode || '').toLowerCase() === filters.applicationType.toLowerCase();

    return matchesStatus && matchesShopkeeper && matchesDate && matchesAppType;
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

        <div className="bg-white p-4 rounded-lg border shadow-sm w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Date Range */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Application Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Application Type</label>
              <select
                value={filters.applicationType}
                onChange={(e) => setFilters({ ...filters, applicationType: e.target.value })}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="self">Self</option>
                <option value="max_born_group">Max Born Group</option>
              </select>
            </div>

            {/* Loan Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Loan Status</label>
              <select
                value={filters.loanStatus}
                onChange={(e) => setFilters({ ...filters, loanStatus: e.target.value })}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Approved">Approved</option>
                <option value="Active">Active</option>
                <option value="Overdue">Overdue</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Shopkeeper Filter - Full Width or separate row based on design, putting below for now */}
            <div className="md:col-span-2 lg:col-span-4 border-t pt-3 mt-1">
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Shopkeeper wise</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filters.shopkeeperId}
                  onChange={(e) => setFilters({ ...filters, shopkeeperId: e.target.value })}
                  className="w-full pl-9 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Shopkeepers</option>
                  {shopkeepers.map(sk => (
                    <option key={sk._id || sk.id} value={sk.shopName}>
                      {sk.shopName || sk.name} ({sk.fullName || sk.ownerName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shopkeeper</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App.  Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App. Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVerifiedLoans.length > 0 ? (
                filteredVerifiedLoans.map((loan) => {
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loan.loanId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loan.shopName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                        <div className="text-sm text-gray-500">{loan.clientMobile}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loan.applicationMode || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{loan.productName}</div>
                        <div className="text-sm text-gray-500">₹{loan.price?.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loan.appliedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{loan.loanAmount?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{loan.tenure} months @ 3.5%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{loan.emiAmount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.status === 'Verified' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {loan.status}
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
                  )
                })
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500">
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
