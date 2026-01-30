import { useState, useEffect } from 'react'
import { Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, User, CreditCard, Eye, Filter, Search } from 'lucide-react'
import { toast } from 'react-toastify'
import loanStore from '../../store/loanStore'
import shopkeeperStore from '../../store/shopkeeperStore'

// Calculate EMI due date for a specific EMI number
const calculateEMIDueDate = (baseDateStr, emiNumber) => {
  const baseDate = new Date(baseDateStr)
  const baseDateDay = baseDate.getDate()

  let firstEMIDueDate = new Date(baseDate)

  if (baseDateDay >= 1 && baseDateDay <= 18) {
    // If loan date is 1-18, first EMI is on 2nd of next month
    firstEMIDueDate.setMonth(firstEMIDueDate.getMonth() + 1)
    firstEMIDueDate.setDate(2)
  } else {
    // If loan date is 19-end of month, first EMI is on 2nd of month after next
    firstEMIDueDate.setMonth(firstEMIDueDate.getMonth() + 2)
    firstEMIDueDate.setDate(2)
  }

  // Calculate subsequent EMI dates by adding months
  const dueDate = new Date(firstEMIDueDate)
  dueDate.setMonth(dueDate.getMonth() + (emiNumber - 1))

  return dueDate.toISOString().split('T')[0]
}

export default function RepaymentManagement() {
  const { loans, activeLoans, collectPayment, applyPenalty, checkAndApplyPenalties, fetchStatistics, stats: storeStats, getPayments } = loanStore()
  const { shopkeepers, fetchShopkeepers } = shopkeeperStore()
  const [repayments, setRepayments] = useState([])
  const [filteredRepayments, setFilteredRepayments] = useState([])
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [shopkeeperFilter, setShopkeeperFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMode: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentProof: '',
  })

  // Fetch statistics on mount
  useEffect(() => {
    fetchStatistics()
  }, [])

  const stats = storeStats || {
    totalPenalties: 0
  }
  const allPayments = getPayments()

  // Generate repayment schedule from active loans and sync with EMI payments
  useEffect(() => {
    const repaymentSchedule = activeLoans.flatMap(loan => {
      const schedule = []
      const baseDateStr = loan.approvedDate || loan.appliedDate

      // Get emisPaid from loan object (backend tracks this)
      const emisPaidCount = loan.emisPaid || 0;

      console.log(`Loan ${loan.loanId}: emisPaid=${emisPaidCount}, tenure=${loan.tenure}, payments array length=${loan.payments?.length || 0}`);

      for (let i = 0; i < (loan.tenure || 0); i++) {
        const emiNumber = i + 1
        const dueDateStr = calculateEMIDueDate(baseDateStr, emiNumber)
        const dueDate = new Date(dueDateStr)

        // Check if this EMI is paid based on emisPaid count from backend
        // If emiNumber <= emisPaid, then this EMI is paid
        const isPaid = emiNumber <= emisPaidCount

        // Also check loan.payments array as backup
        const paymentFromArray = loan.payments?.[i];

        console.log(`Loan ${loan.loanId} EMI ${emiNumber}: isPaid=${isPaid} (emisPaid=${emisPaidCount}), hasPaymentInArray=${!!paymentFromArray}`)
        const isOverdue = new Date() > dueDate && !isPaid

        schedule.push({
          id: `${loan.id}-${i}`,
          loanId: loan.loanId,
          loanDbId: loan.id,
          borrower: loan.clientName,
          borrowerPhone: loan.clientMobile,
          amount: loan.emiAmount || 0,
          penalty: isOverdue ? 500 : 0,
          totalAmount: (loan.emiAmount || 0) + (isOverdue ? 500 : 0),
          dueDate: dueDateStr,
          emiNumber: emiNumber,
          status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
          loan: loan,
          paymentDetails: paymentFromArray || null,
          appliedDate: loan.appliedDate || 'N/A',
          shopkeeperId: loan.shopkeeperId?._id || loan.shopkeeperId // Add shopkeeperId for filtering
        })
      }

      return schedule
    })

    setRepayments(repaymentSchedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)))
  }, [activeLoans, allPayments])

  // Fetch shopkeepers on mount
  useEffect(() => {
    fetchShopkeepers()
  }, [])

  // Check for penalties daily
  useEffect(() => {
    checkAndApplyPenalties()
  }, [])

  // Filter repayments based on shopkeeper and search term
  useEffect(() => {
    let filtered = repayments

    // Filter by shopkeeper
    if (shopkeeperFilter !== 'all') {
      filtered = filtered.filter(r => {
        // Get the shopkeeper ID from the repayment data
        const repaymentShopkeeperId = r.shopkeeperId
        if (!repaymentShopkeeperId) return false

        // Convert both to strings for comparison
        const repaymentIdStr = (typeof repaymentShopkeeperId === 'object' ? repaymentShopkeeperId._id || repaymentShopkeeperId.toString() : repaymentShopkeeperId).toString()
        const filterIdStr = shopkeeperFilter.toString()

        return repaymentIdStr === filterIdStr
      })
    }

    // Filter by search term (loan ID or borrower name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.loanId?.toLowerCase().includes(term) ||
        r.borrower?.toLowerCase().includes(term)
      )
    }

    // Filter by date range (Due Date)
    if (dateRange.start) {
      filtered = filtered.filter(r => {
        // Ensure due date is YYYY-MM-DD
        const dueDate = new Date(r.dueDate).toISOString().split('T')[0]
        return dueDate >= dateRange.start
      })
    }
    if (dateRange.end) {
      filtered = filtered.filter(r => {
        const dueDate = new Date(r.dueDate).toISOString().split('T')[0]
        return dueDate <= dateRange.end
      })
    }

    setFilteredRepayments(filtered)
  }, [repayments, shopkeeperFilter, searchTerm, dateRange])

  const handleRecordPayment = (repayment) => {
    setSelectedLoan(repayment)
    setPaymentData({
      ...paymentData,
      amount: repayment.totalAmount.toString(),
    })
    setShowPaymentModal(true)
  }

  const submitPayment = () => {
    if (!selectedLoan || !paymentData.amount) {
      toast.error('Please fill all required fields')
      return
    }

    const success = collectPayment(selectedLoan.loanDbId, {
      amount: parseFloat(paymentData.amount),
      paymentMode: paymentData.paymentMode,
      paymentDate: paymentData.paymentDate,
      paymentProof: paymentData.paymentProof,
      collectedBy: 'admin',
    })

    if (success) {
      toast.success('Payment recorded successfully!')
      setShowPaymentModal(false)
      setSelectedLoan(null)
      setPaymentData({
        amount: '',
        paymentMode: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentProof: '',
      })

      // Force refresh of repayments to update status
      setTimeout(() => {
        const repaymentSchedule = activeLoans.flatMap(loan => {
          const schedule = []
          const baseDateStr = loan.approvedDate || loan.appliedDate

          // Get emisPaid from loan object (backend tracks this)
          const emisPaidCount = loan.emisPaid || 0;

          for (let i = 0; i < (loan.tenure || 0); i++) {
            const emiNumber = i + 1
            const dueDateStr = calculateEMIDueDate(baseDateStr, emiNumber)
            const dueDate = new Date(dueDateStr)

            // Check if this EMI is paid based on emisPaid count from backend
            const isPaid = emiNumber <= emisPaidCount
            const isOverdue = new Date() > dueDate && !isPaid

            schedule.push({
              id: `${loan.id}-${i}`,
              loanId: loan.loanId,
              loanDbId: loan.id,
              borrower: loan.clientName,
              borrowerPhone: loan.clientMobile,
              amount: loan.emiAmount || 0,
              penalty: isOverdue ? 500 : 0,
              totalAmount: (loan.emiAmount || 0) + (isOverdue ? 500 : 0),
              dueDate: dueDateStr,
              emiNumber: emiNumber,
              status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
              loan: loan,
              paymentDetails: emiPayment || null,
              appliedDate: loan.appliedDate || 'N/A',
            })
          }

          return schedule
        })

        setRepayments(repaymentSchedule.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)))
      }, 100)
    } else {
      toast.error('Failed to record payment')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return '!bg-green-100 !text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Filter repayments for stats (use filtered data)
  const pendingRepayments = filteredRepayments.filter(r => r.status === 'pending')
  const overdueRepayments = filteredRepayments.filter(r => r.status === 'overdue')
  const paidRepayments = filteredRepayments.filter(r => r.status === 'paid')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repayment Management</h1>
          <p className="text-gray-600">Track and manage loan repayments and EMI collections</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Loan ID or Borrower Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Shopkeeper Filter */}
          <div className="md:w-64">
            <select
              value={shopkeeperFilter}
              onChange={(e) => setShopkeeperFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Shopkeepers</option>
              {/* Use unique shopkeeper IDs from repayments to avoid ID mismatch */}
              {Array.from(new Set(repayments.map(r => r.shopkeeperId).filter(Boolean))).map(shopkeeperId => {
                const repayment = repayments.find(r => r.shopkeeperId === shopkeeperId)
                const shopkeeperName = repayment?.loan?.shopkeeperId?.fullName ||
                  repayment?.loan?.shopkeeperId?.username ||
                  `Shopkeeper ${shopkeeperId.slice(-4)}`
                return (
                  <option key={shopkeeperId} value={shopkeeperId}>
                    {shopkeeperName}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Start Date"
              />
            </div>
            <span className="text-gray-500">-</span>
            <div className="relative">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || shopkeeperFilter !== 'all' || dateRange.start || dateRange.end) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setShopkeeperFilter('all')
                setDateRange({ start: '', end: '' })
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Clear Filters
            </button>
          )}
        </div>
        {(searchTerm || shopkeeperFilter !== 'all') && (
          <p className="text-sm text-gray-600 mt-2">
            Showing {filteredRepayments.length} of {repayments.length} repayments
          </p>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending EMIs</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingRepayments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue EMIs</p>
              <p className="text-2xl font-bold text-red-600">{overdueRepayments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 !text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid EMIs</p>
              <p className="text-2xl font-bold !text-green-600">{paidRepayments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Penalties</p>
              <p className="text-2xl font-bold text-purple-600">₹{stats.totalPenalties?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Repayments Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">EMI Repayment Schedule</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Track all EMI payments and manage collections</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRepayments.length > 0 ? (
                filteredRepayments.map((repayment) => (
                  <tr key={repayment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{repayment.loanId}</div>
                      <div className="text-sm text-gray-500">EMI #{repayment.emiNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{repayment.borrower}</div>
                          <div className="text-sm text-gray-500">{repayment.borrowerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{repayment.amount.toLocaleString()}</div>
                      {repayment.penalty > 0 && (
                        <div className="text-sm text-red-600">+ ₹{repayment.penalty} penalty</div>
                      )}
                      <div className="text-sm font-medium text-gray-900">Total: ₹{repayment.totalAmount.toLocaleString()}</div>
                      {repayment.paymentDetails && (
                        <div className="text-xs text-green-600 mt-1">
                          Paid: ₹{repayment.paymentDetails.amount.toLocaleString()} via {repayment.paymentDetails.method}
                          <br />
                          By: {repayment.paymentDetails.collectedBy} on {repayment.paymentDetails.date}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{repayment.dueDate}</div>
                      {repayment.status === 'overdue' && (
                        <div className="text-sm text-red-600">
                          {Math.ceil((new Date() - new Date(repayment.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-600">{repayment.appliedDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(repayment.status)}`}>
                        {getStatusIcon(repayment.status)}
                        <span className="ml-1 capitalize">{repayment.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {repayment.status === 'paid' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-green-600 text-xs">✓ Paid</span>
                          {repayment.paymentDetails && (
                            <button
                              onClick={() => {
                                toast.info(`Payment Details:\nAmount: ₹${repayment.paymentDetails.amount.toLocaleString()}\nMode: ${repayment.paymentDetails.method}\nCollected By: ${repayment.paymentDetails.collectedBy}\nDate: ${repayment.paymentDetails.date}`)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Payment Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRecordPayment(repayment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Record Payment"
                        >
                          <CreditCard className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No repayment schedule available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Recording Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Record Payment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Loan ID: {selectedLoan.loanId}</p>
                  <p className="text-sm text-gray-500">Borrower: {selectedLoan.borrower}</p>
                  <p className="text-sm text-gray-500">EMI #{selectedLoan.emiNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                  <select
                    value={paymentData.paymentMode}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Proof (Optional)</label>
                  <input
                    type="text"
                    value={paymentData.paymentProof}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentProof: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Reference number, receipt ID, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitPayment}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Record Payment
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
