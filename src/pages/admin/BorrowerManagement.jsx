import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Eye, Check, X, User, Phone, Mail, MapPin, CreditCard, Calendar, FileText } from 'lucide-react'
import { toast } from 'react-toastify'
import loanStore from '../../store/loanStore'

export default function BorrowerManagement() {
  const { loans, updateCustomerKYC } = loanStore()
  const navigate = useNavigate()
  const [borrowers, setBorrowers] = useState([])
  const [viewingBorrower, setViewingBorrower] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [kycFilter, setKycFilter] = useState('all')

  // Extract unique borrowers from loans
  useEffect(() => {
    const uniqueBorrowers = loans.reduce((acc, loan) => {
      const existingBorrower = acc.find(b => b.aadharNumber === loan.clientAadharNumber)
      
      if (!existingBorrower) {
        acc.push({
          id: loan.id,
          name: loan.clientName,
          fatherName: loan.clientFatherOrSpouseName,
          phone: loan.clientMobile,
          email: loan.clientEmail,
          address: loan.clientAddress ? 
            `${loan.clientAddress.houseNo}, ${loan.clientAddress.galiNo}, ${loan.clientAddress.colony}, ${loan.clientAddress.area}, ${loan.clientAddress.city} - ${loan.clientAddress.pincode}, ${loan.clientAddress.state}` 
            : 'Address not available',
          aadharNumber: loan.clientAadharNumber,
          panNumber: loan.clientPanNumber,
          dob: loan.clientDob,
          gender: loan.clientGender,
          kycStatus: loan.kycStatus || 'pending',
          totalLoans: 1,
          activeLoans: loan.status === 'Active' ? 1 : 0,
          totalBorrowed: loan.loanAmount || 0,
          totalRepaid: (loan.payments || []).reduce((sum, payment) => sum + payment.amount, 0),
          loans: [loan],
          registrationDate: loan.appliedDate,
        })
      } else {
        existingBorrower.totalLoans += 1
        if (loan.status === 'Active') existingBorrower.activeLoans += 1
        existingBorrower.totalBorrowed += loan.loanAmount || 0
        existingBorrower.totalRepaid += (loan.payments || []).reduce((sum, payment) => sum + payment.amount, 0)
        existingBorrower.loans.push(loan)
      }
      
      return acc
    }, [])
    
    setBorrowers(uniqueBorrowers)
  }, [loans])

  const handleKYCUpdate = (borrowerId, newStatus) => {
    const borrower = borrowers.find(b => b.id === borrowerId)
    if (borrower) {
      // Update KYC status for all loans of this borrower
      borrower.loans.forEach(loan => {
        updateCustomerKYC(loan.id, newStatus)
      })
      
      // Update local state
      setBorrowers(prev => prev.map(b => 
        b.id === borrowerId ? { ...b, kycStatus: newStatus } : b
      ))
      
      toast.success(`KYC status updated to ${newStatus} for ${borrower.name}`)
    }
  }

  // Filter borrowers based on search and KYC status
  const filteredBorrowers = borrowers.filter(borrower => {
    const matchesSearch = borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         borrower.phone.includes(searchTerm) ||
                         borrower.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesKYC = kycFilter === 'all' || borrower.kycStatus === kycFilter
    
    return matchesSearch && matchesKYC
  })

  const getKYCBadgeColor = (status) => {
    switch (status) {
      case 'verified': return '!bg-green-100 !text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Helper to compute EMI schedule (full tenure) for all loans of a borrower
  const getBorrowerPaymentData = (borrower) => {
    if (!borrower) {
      return { totalPlannedEmis: 0, paidEmis: 0, payments: [] };
    }

    const rows = [];

    (borrower.loans || []).forEach((loan) => {
      const loanPayments = loan.payments || [];
      const paymentsCount = loanPayments.length;
      const tenure = loan.tenure || (loan.emisPaid || 0) + (loan.emisRemaining || 0) || paymentsCount || 0;
      const emiAmount = Number(loan.emiAmount || loan.emi || loan.loanAmount || 0) / (tenure || 1);

      const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt || new Date().toISOString();
      const baseDate = new Date(baseDateStr);

      for (let i = 1; i <= tenure; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(baseDate.getMonth() + (i - 1));

        rows.push({
          loanId: loan.loanId,
          loanInternalId: loan.id,
          emiNumber: i,
          amount: Number(loan.emiAmount || loan.emi || emiAmount || 0),
          dueDate: dueDate.toISOString(),
          isPaid: i <= paymentsCount,
        });
      }
    });

    // Sort by EMI due date
    rows.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const totalPlannedEmis = rows.length;
    const paidEmis = rows.filter(r => r.isPaid).length;

    return { totalPlannedEmis, paidEmis, payments: rows };
  };

  const handlePayNow = (loanInternalId) => {
    if (!loanInternalId) return;
    navigate('/shopkeeper/collect-payment', { state: { loanId: loanInternalId } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Borrower Management</h1>
          <p className="text-gray-600">Manage customer profiles and loan history</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All KYC Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Borrowers Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loans</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBorrowers.length > 0 ? (
                filteredBorrowers.map((borrower) => (
                  <tr key={borrower.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{borrower.name}</div>
                          <div className="text-sm text-gray-500">ID: {borrower.aadharNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{borrower.phone}</div>
                      <div className="text-sm text-gray-500">{borrower.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Total: {borrower.totalLoans}</div>
                      <div className="text-sm text-gray-500">Active: {borrower.activeLoans}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{borrower.totalBorrowed.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Repaid: ₹{borrower.totalRepaid.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setViewingBorrower(borrower)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No borrowers found matching the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed View Modal */}
      {viewingBorrower && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Borrower Details</h3>
                <button
                  onClick={() => setViewingBorrower(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              {(() => {
                const paymentData = getBorrowerPaymentData(viewingBorrower);
                const pendingEmis = Math.max((paymentData.totalPlannedEmis || 0) - (paymentData.paidEmis || 0), 0);
                return (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">EMI Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <p className="text-2xl font-bold text-yellow-800">{pendingEmis}</p>
                      </div>
                    </div>

                    {/* EMI History Table */}
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-3">EMI Schedule (Date-wise)</h4>
                      {paymentData.payments.length === 0 ? (
                        <p className="text-sm text-gray-500">No EMI payments recorded yet for this borrower.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loan ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.R. No.</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month &amp; Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {paymentData.payments
                                .map((p, idx) => {
                                  const d = new Date(p.dueDate);
                                  let dateLabel = 'N/A';
                                  if (!isNaN(d.getTime())) {
                                    dateLabel = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
                                  }
                                  return (
                                    <tr key={idx}>
                                      <td className="px-4 py-2 text-sm text-gray-900">{p.loanId}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{p.emiNumber}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">{dateLabel}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900">₹{Number(p.amount || 0).toLocaleString()}</td>
                                      <td className="px-4 py-2 text-sm">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          p.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {p.isPaid ? 'Paid' : 'Pending'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-sm">
                                        {!p.isPaid && (
                                          <button
                                            onClick={() => handlePayNow(p.loanInternalId)}
                                            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700"
                                          >
                                            Pay Now
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Personal Information */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{viewingBorrower.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Father's Name</p>
                    <p className="font-medium">{viewingBorrower.fatherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{viewingBorrower.dob}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium capitalize">{viewingBorrower.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aadhar Number</p>
                    <p className="font-medium">{viewingBorrower.aadharNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="font-medium">{viewingBorrower.panNumber}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 !text-green-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Mobile Number</p>
                    <p className="font-medium">{viewingBorrower.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium">{viewingBorrower.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{viewingBorrower.address}</p>
                  </div>
                </div>
              </div>

              {/* KYC Status */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  KYC Status
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getKYCBadgeColor(viewingBorrower.kycStatus)}`}>
                      {viewingBorrower.kycStatus}
                    </span>
                    {viewingBorrower.kycStatus === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleKYCUpdate(viewingBorrower.id, 'verified')}
                          className="px-3 py-1 !bg-green-500 !hover:bg-green-600 text-white text-sm rounded-md"
                        >
                          Verify KYC
                        </button>
                        <button
                          onClick={() => handleKYCUpdate(viewingBorrower.id, 'rejected')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Reject KYC
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-yellow-600" />
                  Financial Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total Loans</p>
                    <p className="text-2xl font-bold text-blue-800">{viewingBorrower.totalLoans}</p>
                  </div>
                  <div className="!bg-green-50 p-4 rounded-lg">
                    <p className="text-sm !text-green-600">Total Borrowed</p>
                    <p className="text-2xl font-bold !text-green-800">₹{viewingBorrower.totalBorrowed.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Total Repaid</p>
                    <p className="text-2xl font-bold text-purple-800">₹{viewingBorrower.totalRepaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Loan History */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Loan History</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Loan ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Applied Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewingBorrower.loans.map((loan) => (
                        <tr key={loan.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{loan.loanId}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{loan.productName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">₹{loan.loanAmount?.toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              loan.status === 'Active' ? '!bg-green-100 !text-green-800' :
                              loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              loan.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                              loan.status === 'Paid' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">{loan.appliedDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
