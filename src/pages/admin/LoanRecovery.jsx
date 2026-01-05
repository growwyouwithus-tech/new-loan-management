import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import { Search, Phone, MessageCircle, AlertTriangle, DollarSign, Calendar, User, MapPin, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, FileText, Mail } from 'lucide-react'
import { toast } from 'react-toastify'
import loanStore from '../../store/loanStore'

export default function LoanRecovery() {
  const { loans, fetchLoans, updateLoanStatus, collectPayment } = loanStore()
  const [defaultedLoans, setDefaultedLoans] = useState([])
  const [overdueLoans, setOverdueLoans] = useState([])
  const [selectedLoan, setSelectedLoan] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [recoveryAmount, setRecoveryAmount] = useState('')
  const [recoveryNotes, setRecoveryNotes] = useState('')
  const [recoveryMethod, setRecoveryMethod] = useState('cash')

  useEffect(() => {
    fetchLoans()
  }, [fetchLoans])

  useEffect(() => {
    // Filter defaulted and overdue loans
    const defaulted = loans.filter(loan => loan.status === 'Defaulted')
    const overdue = loans.filter(loan => {
      if (loan.status === 'Defaulted') return false
      if (!loan.nextDueDate) return false
      
      const dueDate = new Date(loan.nextDueDate)
      const today = new Date()
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
      
      return daysOverdue > 7 // Loans overdue by more than 7 days
    })

    setDefaultedLoans(defaulted)
    setOverdueLoans(overdue)
  }, [loans])

  // Filter loans based on search
  const filteredDefaultedLoans = defaultedLoans.filter(loan => 
    loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.customerPhone?.includes(searchTerm)
  )

  const filteredOverdueLoans = overdueLoans.filter(loan => 
    loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.customerPhone?.includes(searchTerm)
  )

  const calculateDaysOverdue = (dueDate) => {
    const due = new Date(dueDate)
    const today = new Date()
    return Math.floor((today - due) / (1000 * 60 * 60 * 24))
  }

  const calculateOutstandingAmount = (loan) => {
    const emiAmount = loan.emiAmount || 0
    const totalEmis = loan.tenure || 0
    const paidEmis = loan.emisPaid || 0
    const remainingEmis = totalEmis - paidEmis
    return emiAmount * remainingEmis
  }

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan)
    setShowDetailsModal(true)
  }

  const handleRecovery = (loan) => {
    setSelectedLoan(loan)
    setRecoveryAmount(calculateOutstandingAmount(loan).toString())
    setShowRecoveryModal(true)
  }

  const submitRecovery = async () => {
    if (!selectedLoan || !recoveryAmount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      // Record recovery payment
      await collectPayment(selectedLoan._id || selectedLoan.id, {
        amount: parseFloat(recoveryAmount),
        paymentMode: recoveryMethod,
        paymentDate: new Date().toISOString().split('T')[0],
        collectedBy: 'admin',
        notes: recoveryNotes,
        isRecovery: true
      })

      // Update loan status if fully recovered
      const outstandingAmount = calculateOutstandingAmount(selectedLoan)
      if (parseFloat(recoveryAmount) >= outstandingAmount) {
        await updateLoanStatus(selectedLoan._id || selectedLoan.id, 'Paid', 'Loan fully recovered')
        toast.success('Loan fully recovered and marked as paid')
      } else {
        toast.success(`Partial recovery of ₹${parseFloat(recoveryAmount).toLocaleString()} recorded`)
      }

      setShowRecoveryModal(false)
      setSelectedLoan(null)
      setRecoveryAmount('')
      setRecoveryNotes('')
      setRecoveryMethod('cash')
    } catch (error) {
      console.error('Recovery failed:', error)
      toast.error('Failed to record recovery. Please try again.')
    }
  }

  const handleMarkAsDefaulted = async (loan) => {
    if (window.confirm(`Are you sure you want to mark loan ${loan.loanId} as defaulted? This action cannot be undone.`)) {
      try {
        await updateLoanStatus(loan._id || loan.id, 'Defaulted', 'Loan marked as defaulted due to non-payment')
        toast.success('Loan marked as defaulted')
      } catch (error) {
        console.error('Failed to mark as defaulted:', error)
        toast.error('Failed to mark loan as defaulted')
      }
    }
  }

  const sendWhatsAppReminder = (loan) => {
    const message = "Hi " + loan.clientName + ", this is a reminder regarding your overdue loan " + loan.loanId + ". Your payment of ₹" + loan.emiAmount + " is overdue by " + calculateDaysOverdue(loan.nextDueDate) + " days. Please make immediate payment to avoid further action."
    window.open("https://wa.me/91" + loan.customerPhone?.replace(/\D/g, '') + "?text=" + encodeURIComponent(message))
  }

  const makePhoneCall = (phone) => {
    window.open("tel:" + phone)
  }

  const sendEmailReminder = (loan) => {
    const subject = "Urgent: Overdue Loan Payment - " + loan.loanId
    const body = "Dear " + loan.clientName + ",\n\nThis is an urgent reminder regarding your overdue loan payment.\n\nLoan Details:\n- Loan ID: " + loan.loanId + "\n- Outstanding Amount: ₹" + calculateOutstandingAmount(loan).toLocaleString() + "\n- Days Overdue: " + calculateDaysOverdue(loan.nextDueDate) + "\n\nPlease make immediate payment to avoid legal action.\n\nRegards,\nLoan Recovery Team"
    window.open("mailto:" + loan.customerEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Recovery</h1>
          <p className="text-muted-foreground">Manage defaulted and overdue loans</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, loan ID, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Recovery Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defaulted Loans</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{defaultedLoans.length}</div>
            <p className="text-xs text-muted-foreground">Total defaulted loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Loans</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{overdueLoans.length}</div>
            <p className="text-xs text-muted-foreground">Loans overdue &gt; 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{[...defaultedLoans, ...overdueLoans].reduce((sum, loan) => sum + calculateOutstandingAmount(loan), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total amount to recover</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loans.length > 0 ? Math.round((loans.filter(l => l.status === 'Paid').length / loans.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Loans successfully recovered</p>
          </CardContent>
        </Card>
      </div>

      {/* Defaulted Loans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Defaulted Loans ({filteredDefaultedLoans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDefaultedLoans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No defaulted loans found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Loan ID</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Outstanding</th>
                    <th className="text-left p-2">Default Date</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDefaultedLoans.map((loan) => (
                    <tr key={loan.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{loan.loanId}</td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{loan.clientName}</div>
                          <div className="text-sm text-gray-500">{loan.customerAadhaar}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span className="text-sm">{loan.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{loan.customerEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-bold text-red-600">
                          ₹{calculateOutstandingAmount(loan).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-sm text-gray-500">
                          {new Date(loan.defaultedDate || loan.updatedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(loan)}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRecovery(loan)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendWhatsAppReminder(loan)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => makePhoneCall(loan.customerPhone)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Loans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Overdue Loans ({filteredOverdueLoans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOverdueLoans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No overdue loans found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Loan ID</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">EMI Amount</th>
                    <th className="text-left p-2">Days Overdue</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverdueLoans.map((loan) => (
                    <tr key={loan.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{loan.loanId}</td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{loan.clientName}</div>
                          <div className="text-sm text-gray-500">{loan.customerAadhaar}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span className="text-sm">{loan.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span className="text-sm">{loan.customerEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-medium">
                          ₹{(loan.emiAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <Badge variant="destructive">
                          {calculateDaysOverdue(loan.nextDueDate)} days
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(loan)}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendWhatsAppReminder(loan)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendEmailReminder(loan)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => makePhoneCall(loan.customerPhone)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsDefaulted(loan)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Loan Details - {selectedLoan.loanId}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="font-semibold">{selectedLoan.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Loan Amount</label>
                    <p className="font-semibold">₹{(selectedLoan.loanAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">EMI Amount</label>
                    <p className="font-semibold">₹{(selectedLoan.emiAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tenure</label>
                    <p className="font-semibold">{selectedLoan.tenure} months</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">EMIs Paid</label>
                    <p className="font-semibold">{selectedLoan.emisPaid || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Outstanding Amount</label>
                    <p className="font-semibold text-red-600">₹{calculateOutstandingAmount(selectedLoan).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Address</label>
                  <p className="font-semibold">
                    {selectedLoan.customerAddress ? 
                      `${selectedLoan.customerAddress.houseNo}, ${selectedLoan.customerAddress.colony}, ${selectedLoan.customerAddress.city} - ${selectedLoan.customerAddress.pincode}` 
                      : 'Address not available'
                    }
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => {
                    setShowDetailsModal(false)
                    handleRecovery(selectedLoan)
                  }}>
                    Record Recovery
                  </Button>
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      {showRecoveryModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Record Recovery - {selectedLoan.loanId}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecoveryModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="font-semibold">{selectedLoan.clientName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Outstanding Amount</label>
                  <p className="font-semibold text-red-600">₹{calculateOutstandingAmount(selectedLoan).toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Recovery Amount *</label>
                  <Input
                    type="number"
                    value={recoveryAmount}
                    onChange={(e) => setRecoveryAmount(e.target.value)}
                    placeholder="Enter recovery amount"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <select
                    value={recoveryMethod}
                    onChange={(e) => setRecoveryMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Recovery Notes</label>
                  <textarea
                    value={recoveryNotes}
                    onChange={(e) => setRecoveryNotes(e.target.value)}
                    placeholder="Add recovery notes..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={submitRecovery}>
                    Record Recovery
                  </Button>
                  <Button variant="outline" onClick={() => setShowRecoveryModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
