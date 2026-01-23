import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { DollarSign, CreditCard, Smartphone, Wallet, Calendar, AlertTriangle } from 'lucide-react'
import { db } from '../../lib/db'
import loanStore from '../../store/loanStore'

// Helper: Calculate EMI due date
const calculateEMIDueDate = (baseDateStr, emiNumber) => {
  const baseDate = new Date(baseDateStr)
  const baseDateDay = baseDate.getDate()

  let firstEMIDueDate = new Date(baseDate)

  if (baseDateDay >= 1 && baseDateDay <= 18) {
    firstEMIDueDate.setMonth(firstEMIDueDate.getMonth() + 1)
    firstEMIDueDate.setDate(2)
  } else {
    firstEMIDueDate.setMonth(firstEMIDueDate.getMonth() + 2)
    firstEMIDueDate.setDate(2)
  }

  const dueDate = new Date(firstEMIDueDate)
  dueDate.setMonth(dueDate.getMonth() + (emiNumber - 1))

  return dueDate.toISOString().split('T')[0]
}

// Helper: Calculate penalty for overdue EMI (₹20 per day)
const calculatePenalty = (dueDateStr) => {
  const dueDate = new Date(dueDateStr)
  const today = new Date()
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  if (today <= dueDate) return { amount: 0, days: 0 }

  const diffTime = today - dueDate
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const penaltyPerDay = 20
  const penaltyAmount = diffDays * penaltyPerDay

  return { amount: penaltyAmount, days: diffDays }
}

export default function CollectPayment() {
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [searchName, setSearchName] = useState('')
  const [searchAadhar, setSearchAadhar] = useState('')
  const [emiDueDate, setEmiDueDate] = useState(null)
  const [penaltyInfo, setPenaltyInfo] = useState({ amount: 0, days: 0 })
  const location = useLocation()
  const preselectedLoanId = location.state?.loanId
  const { register, handleSubmit, reset, setValue, control } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  })
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

      // Calculate EMI due date and penalty
      const existingPayments = loan.payments || []
      const nextEmiNumber = existingPayments.length + 1
      const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt
      const dueDate = calculateEMIDueDate(baseDateStr, nextEmiNumber)
      setEmiDueDate(dueDate)
      const penalty = calculatePenalty(dueDate)
      setPenaltyInfo(penalty)
      const emiAmount = loan.emiAmount || loan.loanAmount || 0
      const totalAmount = emiAmount + penalty.amount
      setValue('amount', totalAmount)
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

      // Calculate total amount due (EMI + penalty)
      const emiAmount = selectedLoan.emiAmount || selectedLoan.loanAmount || 0
      const totalAmountDue = emiAmount + penaltyInfo.amount
      const paymentAmount = parseFloat(data.amount)

      // Validate payment amount
      if (paymentAmount < totalAmountDue) {
        toast.error(
          `Payment amount (₹${paymentAmount.toLocaleString()}) is less than total amount due (₹${totalAmountDue.toLocaleString()}). Please pay the full amount including penalty.`,
          { autoClose: 5000 }
        )
        return
      }

      // Calculate EMI number based on existing payments
      const existingPayments = selectedLoan.payments || []
      const emiNumber = existingPayments.length + 1

      // Use _id for MongoDB loans
      const backendLoanId = selectedLoan._id || selectedLoan.id;

      // Create payment record for EMI Management (include penalty)
      const paymentRecord = {
        id: `PAY${Date.now()}`,
        loanId: backendLoanId,
        amount: parseFloat(data.amount),
        method: data.method,
        transactionId: data.transactionId || '',
        date: data.date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        status: 'completed',
        collectedBy: 'shopkeeper',
        emiNumber: emiNumber,
        penalty: penaltyInfo.amount, // Include penalty amount
        synced: false
      }

      // Save to IndexedDB for offline support
      await db.payments.add(paymentRecord)

      // Update loan store with payment using collectPayment function

      const result = await collectPayment(backendLoanId, {
        amount: parseFloat(data.amount),
        paymentMode: data.method,
        paymentDate: data.date || paymentRecord.date,
        collectedBy: 'shopkeeper',
        transactionId: data.transactionId || '',
        emiNumber: emiNumber,
        penalty: penaltyInfo.amount // Include penalty in backend call
      })

      if (!result) {
        throw new Error('Payment collection failed in store');
      }

      // Also record in payments array for EMI Management
      recordPayment(paymentRecord)

      toast.success(`EMI #${emiNumber} payment recorded successfully!`)
      reset({
        date: new Date().toISOString().split('T')[0]
      })
      setSelectedLoan(null)
      setSearchName('')
      setSearchAadhar('')
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to record payment')
    }
  }

  // Calculate today for date restrictions
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header - Mobile Optimized */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Payment Collection
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
                            const loan = matchingLoans[0]
                            setSelectedLoan(loan)
                            setValue('loanId', loan._id || loan.id)

                            // Calculate EMI due date and penalty
                            const existingPayments = loan.payments || []
                            const nextEmiNumber = existingPayments.length + 1
                            const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt
                            const dueDate = calculateEMIDueDate(baseDateStr, nextEmiNumber)
                            setEmiDueDate(dueDate)
                            const penalty = calculatePenalty(dueDate)
                            setPenaltyInfo(penalty)
                            const emiAmount = loan.emiAmount || loan.loanAmount || 0
                            const totalAmount = emiAmount + penalty.amount
                            setValue('amount', totalAmount)
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
                            const loan = matchingLoans[0]
                            setSelectedLoan(loan)
                            setValue('loanId', loan._id || loan.id)

                            // Calculate EMI due date and penalty
                            const existingPayments = loan.payments || []
                            const nextEmiNumber = existingPayments.length + 1
                            const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt
                            const dueDate = calculateEMIDueDate(baseDateStr, nextEmiNumber)
                            setEmiDueDate(dueDate)
                            const penalty = calculatePenalty(dueDate)
                            setPenaltyInfo(penalty)
                            const emiAmount = loan.emiAmount || loan.loanAmount || 0
                            const totalAmount = emiAmount + penalty.amount
                            setValue('amount', totalAmount)
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
                        // Calculate next EMI number
                        const existingPayments = loan.payments || []
                        const nextEmiNumber = existingPayments.length + 1

                        // Calculate EMI due date
                        const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt
                        const dueDate = calculateEMIDueDate(baseDateStr, nextEmiNumber)
                        setEmiDueDate(dueDate)

                        // Calculate penalty if overdue
                        const penalty = calculatePenalty(dueDate)
                        setPenaltyInfo(penalty)

                        // Set amount with penalty if applicable
                        const emiAmount = loan.emiAmount || loan.loanAmount || 0
                        const totalAmount = emiAmount + penalty.amount
                        setValue('amount', totalAmount)
                        console.log('Set EMI amount:', emiAmount, 'Penalty:', penalty.amount, 'Total:', totalAmount)
                      } else {
                        setEmiDueDate(null)
                        setPenaltyInfo({ amount: 0, days: 0 })
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

                        {/* EMI Due Date */}
                        {emiDueDate && (
                          <div className="col-span-2 pt-2 border-t border-blue-200">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <p className="text-xs text-blue-600 font-semibold">Next EMI Due Date</p>
                            </div>
                            <p className="text-sm md:text-base font-bold text-gray-900 mt-1">
                              {new Date(emiDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Penalty Warning Card - Only show if overdue */}
                    {penaltyInfo.amount > 0 && (
                      <div className="p-4 md:p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-300 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <p className="text-sm md:text-base font-bold text-red-900">EMI Overdue - Penalty Applied</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-red-600 font-semibold">Days Overdue</p>
                            <p className="text-lg md:text-xl font-bold text-red-900 mt-1">{penaltyInfo.days} days</p>
                          </div>
                          <div>
                            <p className="text-xs text-red-600 font-semibold">Penalty Amount</p>
                            <p className="text-lg md:text-xl font-bold text-red-900 mt-1">₹{penaltyInfo.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <p className="text-xs text-red-700 mt-3 bg-red-200/50 p-2 rounded">
                          Penalty: ₹20 per day × {penaltyInfo.days} days = ₹{penaltyInfo.amount.toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Due Amount Card */}
                    <div className="p-4 md:p-5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                      <p className="text-xs md:text-sm text-white/90 font-medium">Total Amount Due (This EMI)</p>
                      <p className="text-3xl md:text-4xl font-bold text-white mt-1">
                        ₹{((selectedLoan.emiAmount || selectedLoan.loanAmount || 0) + penaltyInfo.amount).toLocaleString()}
                      </p>
                      {penaltyInfo.amount > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/30">
                          <p className="text-xs text-white/80">EMI Amount: ₹{(selectedLoan.emiAmount || 0).toLocaleString()}</p>
                          <p className="text-xs text-white/80">+ Penalty: ₹{penaltyInfo.amount.toLocaleString()}</p>
                        </div>
                      )}
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
                  <label className="text-xs md:text-sm font-semibold">Payment Date</label>
                  <Input {...register('date')} type="date" min={today} />
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
