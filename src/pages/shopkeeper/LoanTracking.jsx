import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PrintAgreement from '../../components/PrintAgreement'
import { Eye, CreditCard, Calendar, DollarSign, Trash2, User, Users, Package, Building, FileText, Search, Printer, Edit } from 'lucide-react'
import loanStore from '../../store/loanStore'
import { toast } from 'react-toastify'
import '../../styles/printStyles.css'
import '../../styles/loanDetailPrintStyles.css'

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

export default function LoanTracking() {
  // Get all loans from store
  const { loans: allLoans = [], deleteLoan, fetchLoans } = loanStore();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-refresh loans every 10 seconds to get latest status updates
  useEffect(() => {
    fetchLoans(); // Initial fetch
    const interval = setInterval(() => {
      fetchLoans(); // Auto-refresh every 10 seconds
    }, 10000);
    
    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchLoans]);

  // Sync with store data
  useEffect(() => {
    if (Array.isArray(allLoans)) {
      // Filter loans to only show those submitted by the current shopkeeper
      // For now, we'll show all loans. In a real app, you'd filter by shopkeeper ID
      const shopkeeperLoans = allLoans.map(loan => ({
        ...loan,
        // Ensure all required fields have default values
        loanId: loan.loanId || `LN${String(loan.id).slice(-6)}`,
        clientName: loan.clientName || 'N/A',
        productName: loan.productName || 'N/A',
        loanAmount: loan.loanAmount || loan.price || 0,
        emiAmount: loan.emiAmount || loan.emi || 0,
        status: loan.status || 'Pending',
        appliedDate: loan.appliedDate || new Date().toISOString().split('T')[0]
      }));
      setLoans(shopkeeperLoans);
      setFilteredLoans(shopkeeperLoans);
    }
  }, [allLoans]);

  // Search functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLoans(loans);
    } else {
      const filtered = loans.filter(loan => 
        loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.clientPhone?.includes(searchTerm) ||
        loan.appliedDate?.includes(searchTerm)
      );
      setFilteredLoans(filtered);
    }
  }, [searchTerm, loans]);

  const handleDeleteLoan = async (loanId) => {
    if (window.confirm('Are you sure you want to delete this loan application?')) {
      try {
        await deleteLoan(loanId);
        toast.success('Loan application deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete loan application');
      }
    }
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
  };

  const handleEditLoan = (loan) => {
    // Navigate to apply loan page with loan data for editing
    navigate('/shopkeeper/apply-loan', { state: { editLoan: loan } });
  };

  const getLoanPaymentData = (loan) => {
    if (!loan) {
      return { totalPlannedEmis: 0, paidEmis: 0, pendingEmis: 0, schedule: [] };
    }

    const payments = loan.payments || [];
    const paymentsCount = payments.length;
    const tenure = loan.tenure || (loan.emisPaid || 0) + (loan.emisRemaining || 0) || paymentsCount || 0;
    const emiAmountBase = Number(loan.emiAmount || loan.emi || loan.loanAmount || 0) / (tenure || 1);

    const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt || new Date().toISOString();

    const schedule = [];
    for (let i = 1; i <= tenure; i++) {
      const dueDateStr = calculateEMIDueDate(baseDateStr, i);
      schedule.push({
        emiNumber: i,
        amount: Number(loan.emiAmount || loan.emi || emiAmountBase || 0),
        dueDate: dueDateStr,
        isPaid: i <= paymentsCount,
      });
    }

    const totalPlannedEmis = tenure;
    const paidEmis = paymentsCount;
    const pendingEmis = Math.max(totalPlannedEmis - paidEmis, 0);

    return { totalPlannedEmis, paidEmis, pendingEmis, schedule };
  };

  const handlePayNow = (loan) => {
    if (!loan) return;
    const loanId = loan._id || loan.id;
    navigate('/shopkeeper/collect-payment', { state: { loanId, loan } });
  };

  const handlePrintLoanDetails = () => {
    window.print();
  };

  const columns = [
    { 
      accessorKey: 'loanId', 
      header: 'Loan ID',
      cell: ({ row }) => row.original.loanId || `LN${String(row.original.id).slice(-6)}`
    },
    {
      accessorKey: 'statusComment',
      header: 'Verifier Note',
      cell: ({ row }) => {
        const reason = row.original.statusComment || row.original.rejectionReason || row.original.verifierComment || row.original.adminComment;
        if (!reason) return <span className="text-muted-foreground text-sm">No comment</span>;
        return (
          <div className="max-w-xs">
            <p className="text-sm font-medium">{reason}</p>
          </div>
        );
      },
    },
    { 
      accessorKey: 'clientName', 
      header: 'Client Name',
      cell: ({ row }) => row.original.clientName || 'N/A'
    },
    { 
      accessorKey: 'productName', 
      header: 'Product',
      cell: ({ row }) => row.original.productName || 'N/A'
    },
    {
      accessorKey: 'loanAmount',
      header: 'Loan Amount',
      cell: ({ row }) => `₹${Number(row.original.loanAmount || row.original.price || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'emiAmount',
      header: 'EMI',
      cell: ({ row }) => `₹${Number(row.original.emiAmount || row.original.emi || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const colors = { 
          Pending: 'warning', 
          Verified: 'info', 
          Approved: 'success', 
          Active: 'success',
          Rejected: 'destructive',
          Overdue: 'destructive',
          Paid: 'success'
        }
        return <Badge variant={colors[row.original.status] || 'secondary'}>{row.original.status}</Badge>
      },
    },
    {
      accessorKey: 'appliedDate',
      header: 'Applied Date',
      cell: ({ row }) => {
        try {
          const date = row.original.appliedDate || row.original.createdAt || new Date().toISOString();
          return new Date(date).toLocaleDateString();
        } catch (e) {
          return 'N/A';
        }
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => handleViewDetails(row.original)} title="View Details">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleEditLoan(row.original)} title="Edit Loan">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDeleteLoan(row.original.id)} title="Delete Loan">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          My Loans
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Track all your loan applications</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Date, LID, Name, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredLoans.length} loan(s) matching "{searchTerm}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredLoans.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No loans found matching your search' : 'No loan applications found'}
          </div>
        ) : filteredLoans.map((loan, index) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl shadow-lg ${
                      loan.status === 'active' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      loan.status === 'overdue' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                      'bg-gradient-to-br from-yellow-500 to-yellow-600'
                    }`}>
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{loan.loanId || `LN${String(loan.id).slice(-6)}`}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{loan.clientName || 'N/A'}</p>
                    </div>
                  </div>
                  <Badge variant={
                    loan.status === 'Active' || loan.status === 'Approved' || loan.status === 'Paid' ? 'success' :
                    loan.status === 'Overdue' || loan.status === 'Rejected' ? 'destructive' : 
                    loan.status === 'Verified' ? 'info' : 'warning'
                  }>
                    {loan.status || 'Pending'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <DollarSign className="h-3 w-3" />
                      <span>Amount</span>
                    </div>
                    <p className="text-lg font-bold">₹{Number(loan.loanAmount || loan.price || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <DollarSign className="h-3 w-3" />
                      <span>EMI</span>
                    </div>
                    <p className="text-lg font-bold">₹{Number(loan.emiAmount || loan.emi || 0).toLocaleString()}</p>
                  </div>
                  {loan.nextDue && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        <span>Next Due</span>
                      </div>
                      <p className="text-sm font-semibold">{loan.nextDue}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleViewDetails(loan)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEditLoan(loan)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDeleteLoan(loan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        {filteredLoans.length > 0 ? (
          <Table columns={columns} data={filteredLoans} searchPlaceholder="Search loans..." />
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              {searchTerm ? 'No loans found matching your search' : 'No loan applications found'}
            </p>
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Loan Details - ${selectedLoan?.loanId || `LN${String(selectedLoan?.id).slice(-6)}`}`}
        size="xl"
      >
        {selectedLoan && (
          <div id="loan-print-section" className="space-y-6 print-section">
            {(() => {
              const paymentData = getLoanPaymentData(selectedLoan);
              return (
                <Card className="print-section">
                  <CardHeader className="print-section">
                    <CardTitle>EMI Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="print-section">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Total Planned EMIs</p>
                        <p className="text-2xl font-bold text-blue-800">{paymentData.totalPlannedEmis || 0}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">EMIs Paid</p>
                        <p className="text-2xl font-bold text-green-800">{paymentData.paidEmis || 0}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600">EMIs Pending</p>
                        <p className="text-2xl font-bold text-yellow-800">{paymentData.pendingEmis || 0}</p>
                      </div>
                    </div>
                    {paymentData.schedule.length === 0 ? (
                      <p className="text-sm text-gray-500">No EMI schedule available for this loan.</p>
                    ) : (
                      <div className="overflow-x-auto emi-summary-table">
                        <table className="min-w-full divide-y divide-gray-200 print-table">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b-2 border-gray-200">S.R. No.</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b-2 border-gray-200">Month &amp; Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b-2 border-gray-200">Amount</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b-2 border-gray-200">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase border-b-2 border-gray-200 no-print">Action</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paymentData.schedule.map((row) => {
                                const d = new Date(row.dueDate);
                                let dateLabel = 'N/A';
                                if (!isNaN(d.getTime())) {
                                  dateLabel = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
                                }
                                return (
                                  <tr key={row.emiNumber}>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">{row.emiNumber}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">{dateLabel}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">₹{Number(row.amount || 0).toLocaleString()}</td>
                                    <td className="px-4 py-2 text-sm border-b border-gray-100">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        row.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {row.isPaid ? 'Paid' : 'Pending'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-sm border-b border-gray-100 no-print">
                                      {!row.isPaid && (
                                        <Button
                                          size="sm"
                                          className="!bg-green-500 !hover:bg-green-600 !text-white"
                                          onClick={() => handlePayNow(selectedLoan)}
                                        >
                                          Pay Now
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Loan Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Loan Amount</p>
                    <p className="text-2xl font-bold !text-green-500">
                      ₹{Number(selectedLoan.loanAmount || selectedLoan.price || 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">EMI Amount</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{Number(selectedLoan.emiAmount || selectedLoan.emi || 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Tenure</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedLoan.tenure || 12} months
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="font-semibold">{selectedLoan.customerName || selectedLoan.clientName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="font-semibold">{selectedLoan.customerPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="font-semibold">{selectedLoan.customerEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="font-semibold">{selectedLoan.customerAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Aadhaar Number</label>
                      <p className="font-semibold">{selectedLoan.customerAadhaar || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">PAN Number</label>
                      <p className="font-semibold">{selectedLoan.customerPan || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Client Photo</label>
                      <div className="mt-2">
                        {selectedLoan.customerPhoto ? (
                          <img 
                            src={selectedLoan.customerPhoto} 
                            alt="Client Photo" 
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Aadhaar Card</label>
                      <div className="mt-2">
                        {selectedLoan.aadhaarFrontImage ? (
                          <img 
                            src={selectedLoan.aadhaarFrontImage} 
                            alt="Aadhaar Front" 
                            className="w-32 h-20 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Guarantor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Guarantor Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="font-semibold">{selectedLoan.guarantorName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="font-semibold">{selectedLoan.guarantorPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <p className="font-semibold">{selectedLoan.guarantorEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="font-semibold">{selectedLoan.guarantorAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Aadhaar Number</label>
                      <p className="font-semibold">{selectedLoan.guarantorAadhaar || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Relationship</label>
                      <p className="font-semibold">{selectedLoan.guarantorRelationship || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Guarantor Photo</label>
                      <div className="mt-2">
                        {selectedLoan.guarantorPhoto ? (
                          <img 
                            src={selectedLoan.guarantorPhoto} 
                            alt="Guarantor Photo" 
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Users className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Guarantor Aadhaar</label>
                      <div className="mt-2">
                        {selectedLoan.guarantorAadhaarImage ? (
                          <img 
                            src={selectedLoan.guarantorAadhaarImage} 
                            alt="Guarantor Aadhaar" 
                            className="w-32 h-20 object-cover rounded-lg border"
                          />
                        ) : (
                          <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Name</label>
                    <p className="font-semibold">{selectedLoan.productName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="font-semibold">{selectedLoan.productCategory || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Product Price</label>
                    <p className="font-semibold">₹{Number(selectedLoan.productPrice || 0).toLocaleString()}</p>
                  </div>
                </div>
                {selectedLoan.productImage && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Product Image</label>
                    <div className="mt-2">
                      <img 
                        src={selectedLoan.productImage} 
                        alt="Product" 
                        className="w-48 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Bank Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bank Name</label>
                    <p className="font-semibold">{selectedLoan.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Number</label>
                    <p className="font-semibold">{selectedLoan.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                    <p className="font-semibold">{selectedLoan.ifscCode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Branch Name</label>
                    <p className="font-semibold">{selectedLoan.branchName || 'N/A'}</p>
                  </div>
                </div>
                {selectedLoan.passbookImage && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Passbook/Cheque</label>
                    <div className="mt-2">
                      <img 
                        src={selectedLoan.passbookImage} 
                        alt="Passbook" 
                        className="w-48 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verifier/Admin Comments */}
            {(selectedLoan.statusComment || selectedLoan.verifierComment || selectedLoan.adminComment) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 w-5" />
                    Status Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg border-l-4 ${
                    selectedLoan.status === 'Rejected' ? 'bg-red-50 border-red-500' :
                    selectedLoan.status === 'Verified' ? 'bg-blue-50 border-blue-500' :
                    selectedLoan.status === 'Approved' ? 'bg-green-50 border-green-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {selectedLoan.status === 'Rejected' ? (
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 text-xl">⚠️</span>
                          </div>
                        ) : selectedLoan.status === 'Verified' ? (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-xl">✓</span>
                          </div>
                        ) : selectedLoan.status === 'Approved' ? (
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-green-600 text-xl">✓</span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <span className="text-yellow-600 text-xl">ℹ️</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold mb-2 ${
                          selectedLoan.status === 'Rejected' ? 'text-red-900' :
                          selectedLoan.status === 'Verified' ? 'text-blue-900' :
                          selectedLoan.status === 'Approved' ? 'text-green-900' :
                          'text-yellow-900'
                        }`}>
                          {selectedLoan.status === 'Rejected' ? 'Rejection Reason:' :
                           selectedLoan.status === 'Verified' ? 'Verification Note:' :
                           selectedLoan.status === 'Approved' ? 'Approval Note:' :
                           'Status Comment:'}
                        </p>
                        <p className={`text-sm ${
                          selectedLoan.status === 'Rejected' ? 'text-red-800' :
                          selectedLoan.status === 'Verified' ? 'text-blue-800' :
                          selectedLoan.status === 'Approved' ? 'text-green-800' :
                          'text-yellow-800'
                        }`}>
                          {selectedLoan.statusComment || selectedLoan.verifierComment || selectedLoan.adminComment}
                        </p>
                        {selectedLoan.commentDate && (
                          <p className="text-xs text-gray-600 mt-2">
                            Date: {new Date(selectedLoan.commentDate).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Eligibility Notice</p>
                    <p className="text-sm text-red-800">
                      <span className="font-semibold">You are not eligible for loan and guarantee</span> if you fail to make payment as per the agreed terms.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="border-l-4 border-orange-500 pl-4 py-2">
                      <p className="text-sm font-semibold text-gray-900">1. Mobile Loss or Theft</p>
                      <p className="text-sm text-gray-700 mt-1">
                        मोबाइल खोने या चोरी होने पर कंपनी की कोई गारंटी नहीं होगी
                      </p>
                      <p className="text-xs text-gray-600 mt-2">The company will not provide any guarantee in case of mobile loss or theft.</p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4 py-2">
                      <p className="text-sm font-semibold text-gray-900">2. Late EMI Penalty</p>
                      <p className="text-sm text-gray-700 mt-1">
                        मोबाइल किस्त लेट होने पर पेनल्टी चार्ज होगी
                      </p>
                      <p className="text-xs text-gray-600 mt-2">Penalty charges will be applicable if EMI payment is delayed.</p>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4 py-2">
                      <p className="text-sm font-semibold text-gray-900">3. Mobile Damage Service</p>
                      <p className="text-sm text-gray-700 mt-1">
                        मोबाइल खराब होने पर यूजर को सर्विस सेल्फ सेंटर जाना होगा
                      </p>
                      <p className="text-xs text-gray-600 mt-2">In case of mobile damage, the user must visit the authorized service center for repairs.</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                    <p className="text-xs text-yellow-800">
                      <span className="font-semibold">Note:</span> By accepting this loan, you acknowledge and agree to all the terms and conditions mentioned above.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Print Agreement Button - Show when Approved */}
            {/* Action Buttons */}
            <div className="flex gap-3 no-print">
              <Button
                onClick={handlePrintLoanDetails}
                className="!bg-blue-600 !hover:bg-blue-700 !text-white flex items-center gap-2 flex-1 no-print"
              >
                <Printer className="w-4 h-4" />
                Print Loan Details
              </Button>
              {selectedLoan?.status === 'Approved' && (
                <Button
                  onClick={() => setShowPrintModal(true)}
                  className="!bg-green-600 !hover:bg-green-700 !text-white flex items-center gap-2 flex-1 no-print"
                >
                  <Printer className="w-4 h-4" />
                  Print Agreement
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Print Agreement Modal */}
      {showPrintModal && (
        <PrintAgreement
          loan={selectedLoan}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  )
}
