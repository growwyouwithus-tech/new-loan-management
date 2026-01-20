import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Eye, Calendar, DollarSign, User, CheckCircle, Clock, Filter, Search } from 'lucide-react'
import loanStore from '../../store/loanStore'
import shopkeeperStore from '../../store/shopkeeperStore'
import { format } from 'date-fns'

export default function EMIManagement() {
  const [emis, setEmis] = useState([])
  const [filteredEmis, setFilteredEmis] = useState([])
  const [selectedEMI, setSelectedEMI] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showDateFilter, setShowDateFilter] = useState(true) // Always true or remove usage
  const [shopkeeperFilter, setShopkeeperFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { loans, getPayments, activeLoans } = loanStore()
  const { shopkeepers, fetchShopkeepers } = shopkeeperStore()

  // Get all payments from store (show ALL payments, including completed loans)
  const allPayments = getPayments()

  console.log('=== EMI Management Debug ===')
  console.log('Total Payments:', allPayments.length)
  console.log('Total Loans:', loans.length)
  console.log('Active Loans:', activeLoans.length)
  console.log('All Payments:', allPayments)

  useEffect(() => {
    console.log('=== Checking Loan Payments ===')
    loans.forEach((loan, index) => {
      console.log(`Loan ${index + 1} (${loan.loanId}):`, {
        status: loan.status,
        paymentsCount: loan.payments?.length || 0,
        payments: loan.payments
      })
    })

    // If loanStore.payments is empty, try to get payments from loan.payments array
    let paymentsToUse = allPayments

    if (allPayments.length === 0) {
      console.log('loanStore.payments is empty, using loan.payments instead')
      // Extract payments from each loan's payments array
      paymentsToUse = loans.flatMap(loan =>
        (loan.payments || []).map((payment, index) => ({
          id: payment._id || `${loan.id}-${index}`,
          loanId: loan.id,
          amount: payment.amount || 0,
          date: payment.paymentDate,
          method: payment.paymentMode,
          collectedBy: payment.collectedBy,
          transactionId: payment.transactionId,
          status: 'Paid',
          emiNumber: index + 1,
          timestamp: payment.createdAt
        }))
      )
      console.log('Extracted payments from loans:', paymentsToUse.length)
    }

    // Use payments from store (recorded from shopkeeper panel) or from loans
    const allEMIs = paymentsToUse.map((payment, index) => {
      const loan = loans.find(l => l.id === payment.loanId)
      const isFirstEMI = payment.emiNumber === 1
      const fileCharge = 500
      const baseEMIAmount = loan?.emiAmount || (loan?.loanAmount / (loan?.tenure || 1)) || 0
      const emiAmountWithFileCharge = isFirstEMI ? baseEMIAmount + fileCharge : baseEMIAmount

      return {
        id: payment.id,
        emiId: `EMI-${payment.loanId}-${payment.emiNumber || (index + 1)}`,
        loanId: payment.loanId,
        loanCustomer: loan?.clientName || 'Unknown',
        loanAmount: loan?.loanAmount || 0,
        emiAmount: emiAmountWithFileCharge,
        baseEMIAmount: baseEMIAmount,
        fileCharge: isFirstEMI ? fileCharge : 0,
        paymentAmount: payment.amount || 0,
        paymentDate: payment.date,
        paymentMode: payment.method,
        collectedBy: payment.collectedBy || 'Shopkeeper',
        transactionId: payment.transactionId,
        status: payment.status || 'Paid',
        dueDate: loan?.dueDate,
        emiNumber: payment.emiNumber || (index + 1),
        totalEMIs: loan?.tenure || 12,
        customerPhone: loan?.clientPhone || 'N/A',
        customerEmail: loan?.clientEmail || 'N/A',
        timestamp: payment.timestamp,
        isFirstEMI: isFirstEMI,
        appliedDate: loan?.appliedDate || 'N/A',
        shopkeeperId: loan?.shopkeeperId?._id || loan?.shopkeeperId // Add shopkeeperId for filtering
      }
    })

    console.log('Total EMIs created:', allEMIs.length)
    setEmis(allEMIs)
    setFilteredEmis(allEMIs)
  }, [loans, allPayments])

  useEffect(() => {
    fetchShopkeepers()
  }, [])

  // Filter EMIs by date, shopkeeper, and search term
  const handleDateFilter = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }))
  }

  useEffect(() => {
    let filtered = emis

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(emi => {
        const emiDate = new Date(emi.paymentDate).toISOString().split('T')[0]
        return emiDate >= dateRange.start
      })
    }
    if (dateRange.end) {
      filtered = filtered.filter(emi => {
        const emiDate = new Date(emi.paymentDate).toISOString().split('T')[0]
        return emiDate <= dateRange.end
      })
    }

    // Filter by shopkeeper
    if (shopkeeperFilter !== 'all') {
      filtered = filtered.filter(emi => {
        // Get the shopkeeper ID from the EMI data
        const emiShopkeeperId = emi.shopkeeperId
        if (!emiShopkeeperId) return false

        // Convert both to strings for comparison
        const emiIdStr = (typeof emiShopkeeperId === 'object' ? emiShopkeeperId._id || emiShopkeeperId.toString() : emiShopkeeperId).toString()
        const filterIdStr = shopkeeperFilter.toString()

        return emiIdStr === filterIdStr
      })
    }

    // Filter by search term (loan ID or borrower name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(emi =>
        emi.emiId?.toLowerCase().includes(term) ||
        emi.loanCustomer?.toLowerCase().includes(term)
      )
    }

    setFilteredEmis(filtered)
  }, [emis, dateRange, shopkeeperFilter, searchTerm, loans])

  const handleViewDetails = (emi) => {
    setSelectedEMI(emi)
    setShowDetailsModal(true)
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy')
    } catch {
      return dateString
    }
  }

  const columns = [
    {
      header: 'EMI ID',
      accessorKey: 'emiId',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-blue-600">
            {row.original.emiId}
          </span>
          <div className="text-xs text-gray-500">
            {row.original.emiNumber}/{row.original.totalEMIs}
          </div>
        </div>
      )
    },
    {
      header: 'Customer Name',
      accessorKey: 'loanCustomer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.loanCustomer}</div>
          <div className="text-sm text-gray-500">{row.original.customerPhone}</div>
        </div>
      )
    },
    {
      header: 'Loan Amount',
      accessorKey: 'loanAmount',
      cell: ({ row }) => (
        <span className="font-medium">
          ₹{row.original.loanAmount.toLocaleString()}
        </span>
      )
    },
    {
      header: 'EMI Amount',
      accessorKey: 'emiAmount',
      cell: ({ row }) => (
        <div>
          <span className="font-medium !text-green-600">
            ₹{row.original.emiAmount.toLocaleString()}
          </span>
          {row.original.isFirstEMI && (
            <div className="text-xs text-orange-600">
              Base: ₹{row.original.baseEMIAmount.toLocaleString()} + File Charge: ₹{row.original.fileCharge}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Paid Amount',
      accessorKey: 'paymentAmount',
      cell: ({ row }) => (
        <span className="font-medium text-blue-600">
          ₹{(row.original.paymentAmount || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Payment Date',
      accessorKey: 'paymentDate',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{formatDate(row.original.paymentDate)}</span>
        </div>
      )
    },
    {
      header: 'Applied Date',
      accessorKey: 'appliedDate',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-blue-600">{formatDate(row.original.appliedDate)}</span>
        </div>
      )
    },
    {
      header: 'Payment Mode',
      accessorKey: 'paymentMode',
      cell: ({ row }) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {row.original.paymentMode}
        </span>
      )
    },
    {
      header: 'Collected By',
      accessorKey: 'collectedBy',
      cell: ({ row }) => (
        <div>
          <span className="text-sm font-medium capitalize">{row.original.collectedBy}</span>
          <div className="text-xs text-gray-500">
            {row.original.collectedBy === 'Shopkeeper' && '👨‍💼'}
            {row.original.collectedBy === 'Collections Officer' && '🏦'}
            {row.original.collectedBy === 'Admin' && '⚙️'}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 !text-green-500" />
          <span className="px-2 py-1 text-xs font-medium rounded-full !bg-green-100 !text-green-800">
            Paid
          </span>
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          onClick={() => handleViewDetails(row.original)}
          className="!bg-green-500 hover:!bg-green-600 text-white"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">EMI Management</h1>
        <p className="text-muted-foreground">View all EMI payments collected by shopkeepers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total EMIs Collected</p>
                <p className="text-2xl font-bold">{emis.length}</p>
              </div>
              <DollarSign className="h-8 w-8 !text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount Collected</p>
                <p className="text-2xl font-bold">
                  ₹{emis.reduce((sum, emi) => sum + emi.paymentAmount, 0).toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">
                  {emis.filter(emi => {
                    const paymentDate = new Date(emi.paymentDate)
                    const currentMonth = new Date().getMonth()
                    const currentYear = new Date().getFullYear()
                    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-2xl font-bold">
                  {loans.filter(loan => loan.status === 'Active').length}
                </p>
              </div>
              <User className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateFilter('start', e.target.value)}
                className="max-w-xs"
              />
            </div>
            <span className="mt-5 text-gray-400">-</span>
            <div>
              <label className="text-xs text-gray-500 block mb-1">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateFilter('end', e.target.value)}
                className="max-w-xs"
              />
            </div>
            <div className="mt-5">
              <Button
                variant="outline"
                onClick={() => setDateRange({ start: '', end: '' })}
              >
                Clear Filter
              </Button>
            </div>
          </div>
          {(dateRange.start || dateRange.end) && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredEmis.length} payments {dateRange.start ? `from ${formatDate(dateRange.start)}` : ''} {dateRange.end ? `to ${formatDate(dateRange.end)}` : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shopkeeper and Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by EMI ID or Customer Name..."
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
                {/* Use unique shopkeeper IDs from EMIs to avoid ID mismatch */}
                {Array.from(new Set(emis.map(e => e.shopkeeperId).filter(Boolean))).map(shopkeeperId => {
                  const emi = emis.find(e => e.shopkeeperId === shopkeeperId)
                  const loan = loans.find(l => l.id === emi?.loanId)
                  const shopkeeperName = loan?.shopkeeperId?.fullName ||
                    loan?.shopkeeperId?.username ||
                    `Shopkeeper ${shopkeeperId.slice(-4)}`
                  return (
                    <option key={shopkeeperId} value={shopkeeperId}>
                      {shopkeeperName}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || shopkeeperFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setShopkeeperFilter('all')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Clear
              </button>
            )}
          </div>
          {(searchTerm || shopkeeperFilter !== 'all' || dateRange.start || dateRange.end) && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredEmis.length} of {emis.length} EMI payments
            </p>
          )}
        </CardContent>
      </Card>

      {/* EMI Table */}
      <Card>
        <CardHeader>
          <CardTitle>All EMI Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmis.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No EMI payments found</h3>
              <p className="text-gray-500">
                {(dateRange.start || dateRange.end) ? 'No payments found for selected date range' : 'No EMI payments have been collected yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.header} className="px-6 py-3">
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmis.map((emi) => (
                    <tr key={emi.id} className="bg-white border-b hover:bg-gray-50">
                      {columns.map((column) => (
                        <td key={column.header} className="px-6 py-4">
                          {column.cell ? column.cell({ row: { original: emi } }) : emi[column.accessorKey]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EMI Details Modal */}
      {showDetailsModal && selectedEMI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">EMI Payment Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">EMI ID</label>
                    <p className="font-medium text-blue-600">{selectedEMI.emiId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">EMI Number</label>
                    <p className="font-medium">{selectedEMI.emiNumber}/{selectedEMI.totalEMIs}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 !text-green-500" />
                      <span className="px-2 py-1 text-xs font-medium rounded-full !bg-green-100 !text-green-800">
                        Paid
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Collected By</label>
                    <p className="font-medium capitalize">{selectedEMI.collectedBy}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="font-medium">{selectedEMI.loanCustomer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="font-medium">{selectedEMI.customerPhone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Loan Amount</label>
                    <p className="font-medium">₹{selectedEMI.loanAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">EMI Amount</label>
                    <div>
                      <p className="font-medium !text-green-600">₹{selectedEMI.emiAmount.toLocaleString()}</p>
                      {selectedEMI.isFirstEMI && (
                        <p className="text-xs text-orange-600">
                          Base EMI: ₹{selectedEMI.baseEMIAmount.toLocaleString()} + File Charge: ₹{selectedEMI.fileCharge}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Paid Amount</label>
                    <p className="font-medium text-blue-600">₹{(selectedEMI.paymentAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Date</label>
                    <p className="font-medium">{formatDate(selectedEMI.paymentDate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Mode</label>
                    <p className="font-medium">{selectedEMI.paymentMode}</p>
                  </div>
                  {selectedEMI.transactionId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                      <p className="font-medium">{selectedEMI.transactionId}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
