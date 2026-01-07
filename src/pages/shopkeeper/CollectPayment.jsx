import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { DollarSign, CreditCard, Smartphone, Wallet } from 'lucide-react'
import { db } from '../../lib/db'
import loanStore from '../../store/loanStore'

export default function CollectPayment() {
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [searchName, setSearchName] = useState('')
  const [searchAadhar, setSearchAadhar] = useState('')
  const location = useLocation()
  const preselectedLoanId = location.state?.loanId
  const { register, handleSubmit, reset, setValue, control } = useForm()
  const { activeLoans, approvedLoans, loans: allLoans, recordPayment, collectPayment, initializeActiveLoans } = loanStore()

  // Initialize active loans from approved loans when component mounts
  useEffect(() => {
    if (approvedLoans.length > 0) {
      initializeActiveLoans()
    }
  }, [approvedLoans, initializeActiveLoans])

  // Get loans that are due for payment (active loans + approved loans that haven't been moved to active yet)
  const availableLoans = [
    ...activeLoans.filter(loan =>
      (loan.status === 'Active' || loan.status === 'Overdue')
    ),
    ...approvedLoans.filter(loan =>
      loan.status === 'Approved'
    ),
    // Fallback: get all loans from main loans array that are not yet paid or rejected
    ...allLoans.filter(loan =>
      (loan.status === 'Active' || loan.status === 'Overdue' || loan.status === 'Approved' || loan.status === 'Verified' || loan.status === 'Pending') &&
      !activeLoans.find(al => al.id === loan.id) &&
      !approvedLoans.find(al => al.id === loan.id)
    )
  ]

  // Remove duplicates based on loan ID
  const loans = availableLoans.filter((loan, index, self) =>
    index === self.findIndex(l => l.id === loan.id)
  )

  // Apply filters by client name and Aadhar number
  const filteredLoans = loans.filter((loan) => {
    const clientName = loan.clientName || loan.customerName || '';
    const matchesName = searchName
      ? clientName.toLowerCase().includes(searchName.toLowerCase())
      : true

    const aadharNumber = loan.clientAadharNumber || loan.customerAadhaar || '';
    const matchesAadhar = searchAadhar
      ? aadharNumber.includes(searchAadhar)
      : true

    return matchesName && matchesAadhar
  })

  // If navigated with a specific loanId in route state, preselect that loan
  useEffect(() => {
    if (!preselectedLoanId) return
    const loan = loans.find(l => l.id === preselectedLoanId)
    if (loan) {
      setValue('loanId', String(loan.id))
      setSelectedLoan(loan)
    }
  }, [preselectedLoanId, loans, setValue])

  // Debug logging
  console.log('Active Loans:', activeLoans)
  console.log('Approved Loans:', approvedLoans)
  console.log('Available Loans:', availableLoans)
  console.log('Final Loans for dropdown:', loans)

  const onSubmit = async (data) => {
    try {
      console.log('Form data:', data);
      console.log('Selected loan from state:', selectedLoan);

      // Use the selectedLoan from state instead of searching again
      if (!selectedLoan) {
        toast.error('Please select a loan first')
        return
      }

      // Calculate EMI number based on existing payments
      const existingPayments = selectedLoan.payments || []
      const emiNumber = existingPayments.length + 1

      // Use _id for MongoDB loans
      const backendLoanId = selectedLoan._id || selectedLoan.id;

      // Create payment record for EMI Management
      const paymentRecord = {
        id: `PAY${Date.now()}`,
        loanId: backendLoanId,
        amount: parseFloat(data.amount),
        method: data.method,
        transactionId: data.transactionId || '',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: 'completed',
        collectedBy: 'shopkeeper',
        emiNumber: emiNumber,
        synced: false
      }

      // Save to IndexedDB for offline support
      await db.payments.add(paymentRecord)

      // Update loan store with payment using collectPayment function

      const result = await collectPayment(backendLoanId, {
        amount: parseFloat(data.amount),
        paymentMode: data.method,
        paymentDate: paymentRecord.date,
        collectedBy: 'shopkeeper',
        transactionId: data.transactionId || '',
        emiNumber: emiNumber
      })

      if (!result) {
        throw new Error('Payment collection failed in store');
      }

      // Also record in payments array for EMI Management
      recordPayment(paymentRecord)

      toast.success(`EMI #${emiNumber} payment recorded successfully!`)
      reset()
      setSelectedLoan(null)
      setSearchName('')
      setSearchAadhar('')
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to record payment')
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Mobile Optimized */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Collect Payment
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Record customer payments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Record Payment</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="text-xs md:text-sm font-semibold">Search by Name</label>
                    <Input
                      value={searchName}
                      onChange={(e) => {
                        const nameValue = e.target.value
                        setSearchName(nameValue)
                        setSelectedLoan(null)
                        setValue('loanId', '')

                        // Auto-fill Aadhaar if name matches a loan
                        if (nameValue.trim()) {
                          const matchingLoans = loans.filter(loan => {
                            const clientName = loan.clientName || loan.customerName || ''
                            return clientName.toLowerCase().includes(nameValue.toLowerCase())
                          })

                          if (matchingLoans.length === 1) {
                            // Auto-fill Aadhaar
                            const aadhar = matchingLoans[0].clientAadharNumber || matchingLoans[0].customerAadhaar || ''
                            setSearchAadhar(aadhar)

                            // Auto-select the loan
                            setSelectedLoan(matchingLoans[0])
                            setValue('loanId', matchingLoans[0]._id || matchingLoans[0].id)
                            setValue('amount', matchingLoans[0].emiAmount || matchingLoans[0].loanAmount || 0)
                          }
                        }
                      }}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <label className="text-xs md:text-sm font-semibold">Search by Aadhar Number</label>
                    <Input
                      value={searchAadhar}
                      onChange={(e) => {
                        const aadharValue = e.target.value
                        setSearchAadhar(aadharValue)
                        setSelectedLoan(null)
                        setValue('loanId', '')

                        // Auto-fill Name if Aadhaar matches a loan
                        if (aadharValue.trim()) {
                          const matchingLoans = loans.filter(loan => {
                            const aadharNumber = loan.clientAadharNumber || loan.customerAadhaar || ''
                            return aadharNumber.includes(aadharValue)
                          })

                          if (matchingLoans.length === 1) {
                            // Auto-fill Name
                            const name = matchingLoans[0].clientName || matchingLoans[0].customerName || ''
                            setSearchName(name)

                            // Auto-select the loan
                            setSelectedLoan(matchingLoans[0])
                            setValue('loanId', matchingLoans[0]._id || matchingLoans[0].id)
                            setValue('amount', matchingLoans[0].emiAmount || matchingLoans[0].loanAmount || 0)
                          }
                        }
                      }}
                      placeholder="Enter Aadhar number"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold">Select Loan</label>
                  {loans.length === 0 && (
                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-md mb-2">
                      <p className="text-sm text-yellow-800">
                        No active loans available for payment collection.
                        <br />
                        Debug info: Active: {activeLoans.length}, Approved: {approvedLoans.length}, All: {allLoans.length}
                      </p>
                    </div>
                  )}
                  <select
                    className="w-full rounded-lg border-2 border-gray-200 py-2.5 px-3 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-400 hover:border-gray-300"
                    onChange={(e) => {
                      const loanIdValue = e.target.value
                      console.log('Dropdown changed, selected value:', loanIdValue)
                      console.log('Filtered loans:', filteredLoans)

                      // Search in filteredLoans to ensure we find the loan after filtering
                      const loan = filteredLoans.find((l) =>
                        String(l.id) === String(loanIdValue) ||
                        String(l._id) === String(loanIdValue)
                      )

                      console.log('Found loan:', loan)
                      setSelectedLoan(loan)

                      // Set the loanId in the form
                      setValue('loanId', loanIdValue)

                      // Auto-fill form fields when loan is selected
                      if (loan) {
                        const emiAmount = loan.emiAmount || loan.loanAmount || 0
                        setValue('amount', emiAmount)
                        console.log('Set EMI amount:', emiAmount)
                      }
                    }}
                  >
                    <option value="">Select loan</option>
                    {filteredLoans.map((loan) => (
                      <option key={loan._id || loan.id} value={loan._id || loan.id}>
                        {loan.loanId || loan.id} - {loan.clientName || loan.customerName} - ₹{loan.emiAmount || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLoan && (
                  <div className="space-y-3">
                    {/* Loan Details Card */}
                    <div className="p-4 md:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Client Name</p>
                          <p className="text-sm md:text-base font-bold text-gray-900 mt-1">{selectedLoan.clientName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Aadhar Number</p>
                          <p className="text-sm md:text-base font-bold text-gray-900 mt-1">{selectedLoan.clientAadharNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Loan ID</p>
                          <p className="text-sm md:text-base font-bold text-gray-900 mt-1">{selectedLoan.loanId || selectedLoan.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Loan Status</p>
                          <p className="text-sm md:text-base font-bold text-gray-900 mt-1">{selectedLoan.status || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Total Loan Amount</p>
                          <p className="text-sm md:text-base font-bold text-gray-900 mt-1">₹{(selectedLoan.loanAmount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">Tenure (Months)</p>
                          <p className="text-sm md:text-base font-bold text-gray-900 mt-1">{selectedLoan.tenure || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">EMIs Paid</p>
                          <p className="text-sm md:text-base font-bold text-green-600 mt-1">{selectedLoan.emisPaid || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">EMIs Remaining</p>
                          <p className="text-sm md:text-base font-bold text-orange-600 mt-1">{selectedLoan.emisRemaining || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Due Amount Card */}
                    <div className="p-4 md:p-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                      <p className="text-xs md:text-sm text-white/90 font-medium">Due Amount (This EMI)</p>
                      <p className="text-3xl md:text-4xl font-bold text-white mt-1">₹{(selectedLoan.emiAmount || selectedLoan.loanAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs md:text-sm font-semibold">Payment Amount</label>
                  <Input {...register('amount')} type="number" placeholder="Enter amount" />
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold">Payment Method</label>
                  <Select {...register('method')}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="wallet">Wallet</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs md:text-sm font-semibold">Transaction ID (Optional)</label>
                  <Input {...register('transactionId')} placeholder="Enter transaction ID" />
                </div>

                <Button type="submit" className="!bg-green-500 !hover:bg-green-600 !text-white w-full h-12 md:h-10 text-sm font-semibold shadow-lg">
                  Record Payment
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}
