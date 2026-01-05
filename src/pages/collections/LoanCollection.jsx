import { useState, useRef, useEffect } from 'react';
import { Search, Filter, Phone, MessageCircle, DollarSign, Calendar, User, MapPin, Clock, CheckCircle, AlertTriangle, Download, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import loanStore from '../../store/loanStore';

// Mock data for approved loans ready for collection
const mockApprovedLoans = [
  {
    id: 1,
    loanId: 'LN001',
    clientName: 'Rahul Sharma',
    mobile: '9876543210',
    address: '123, Green Park, New Delhi - 110016',
    productName: 'Samsung Galaxy S23',
    loanAmount: 59999,
    emiAmount: 13208,
    tenure: 6,
    emisPaid: 2,
    emisRemaining: 4,
    nextDueDate: '2025-11-15',
    status: 'Active',
    paymentMode: 'UPI',
    lastPaymentDate: '2025-10-15',
    guarantor: {
      name: 'Vikram Singh',
      mobile: '9876543200',
      relation: 'Friend'
    }
  },
  {
    id: 2,
    loanId: 'LN002',
    clientName: 'Priya Patel',
    mobile: '8765432109',
    address: '456, Lokhandwala, Mumbai - 400053',
    productName: 'iPhone 15 Pro',
    loanAmount: 103920,
    emiAmount: 15742,
    tenure: 9,
    emisPaid: 1,
    emisRemaining: 8,
    nextDueDate: '2025-11-12',
    status: 'Overdue',
    paymentMode: 'Bank Transfer',
    lastPaymentDate: '2025-10-12',
    guarantor: {
      name: 'Rahul Mehta',
      mobile: '8765432111',
      relation: 'Brother'
    }
  },
  {
    id: 3,
    loanId: 'LN003',
    clientName: 'Amit Kumar',
    mobile: '7654321098',
    address: '789, Koramangala, Bengaluru - 560034',
    productName: 'Sony Bravia 55" 4K TV',
    loanAmount: 71992,
    emiAmount: 15833,
    tenure: 6,
    emisPaid: 3,
    emisRemaining: 3,
    nextDueDate: '2025-11-20',
    status: 'Active',
    paymentMode: 'Cash',
    lastPaymentDate: '2025-10-20',
    guarantor: {
      name: 'Arjun Reddy',
      mobile: '7654321000',
      relation: 'Cousin'
    }
  }
];

const statusColors = {
  'Active': '!bg-green-100 !text-green-800',
  'Overdue': 'bg-red-100 text-red-800',
  'Paid': 'bg-blue-100 text-blue-800'
};

export default function LoanCollection() {
  // Get active loans from store
  const { activeLoans, collectPayment } = loanStore();
  const [loans, setLoans] = useState(activeLoans);
  const [filteredLoans, setFilteredLoans] = useState(activeLoans);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentProof, setPaymentProof] = useState(null);
  const fileInputRef = useRef(null);

  // Sync with store data
  useEffect(() => {
    setLoans(activeLoans);
    setFilteredLoans(activeLoans);
  }, [activeLoans]);

  // Filter loans based on search and status
  const handleFilter = () => {
    let filtered = [...loans];

    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.mobile.includes(searchTerm)
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    setFilteredLoans(filtered);
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
  };

  const handleCollectPayment = (loan) => {
    setSelectedLoan(loan);
    setPaymentAmount(loan.emiAmount.toString());
    setPaymentMode(loan.paymentMode);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = () => {
    if (!paymentAmount || !paymentMode || !paymentDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const paymentData = {
      amount: parseInt(paymentAmount),
      paymentMode,
      paymentDate,
      paymentProof,
      collectedBy: 'collections'
    };

    const success = collectPayment(selectedLoan.id, paymentData);

    if (success) {
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMode('');
      setPaymentProof(null);

      toast.success(`Payment of ₹${paymentAmount} collected successfully!`);
    } else {
      toast.error('Failed to collect payment. Please try again.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
      toast.success('Payment proof uploaded successfully');
    }
  };

  const getDaysOverdue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Collection</h1>
          <p className="text-gray-600">Manage EMI collections and loan payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, loan ID, or mobile"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Overdue">Overdue</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 inline mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      {/* Desktop View - Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMI Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                        <div className="text-sm text-gray-500">{loan.mobile}</div>
                        <div className="text-xs text-gray-400">{loan.loanId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{loan.productName}</div>
                    <div className="text-sm text-gray-500">₹{loan.loanAmount.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{loan.tenure} months</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{loan.emiAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{loan.emisPaid}/{loan.tenure} paid</div>
                    <div className="text-xs text-gray-400">Due: {loan.nextDueDate}</div>
                    {loan.status === 'Overdue' && (
                      <div className="text-xs text-red-500">
                        {getDaysOverdue(loan.nextDueDate)} days overdue
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[loan.status]}`}>
                      {loan.status === 'Active' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {loan.status === 'Overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {loan.status === 'Paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewDetails(loan)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      View
                    </button>
                    {loan.status !== 'Paid' && (
                      <button
                        onClick={() => handleCollectPayment(loan)}
                        className="!text-green-600 hover:!text-green-900"
                        title="Collect Payment"
                      >
                        Collect
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`tel:${loan.mobile}`)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Call Client"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.open(`https://wa.me/91${loan.mobile.replace(/\D/g, '')}?text=Hi ${loan.clientName}, this is regarding your loan ${loan.loanId}. Your EMI of ₹${loan.emiAmount} is due on ${loan.nextDueDate}. Please make the payment to avoid late charges.`)}
                      className="text-green-600 hover:text-green-900"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Cards */}
      <div className="md:hidden space-y-4">
        {filteredLoans.map((loan) => (
          <div key={loan.id} className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                  <div className="text-xs text-gray-500">{loan.loanId}</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColors[loan.status]}`}>
                    {loan.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">₹{loan.emiAmount.toLocaleString()}</div>
                <div className="text-xs text-gray-500">EMI Amount</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-gray-100 py-3">
              <div>
                <p className="text-gray-500 text-xs">Due Date</p>
                <p className="font-medium">{loan.nextDueDate}</p>
                {loan.status === 'Overdue' && (
                  <p className="text-xs text-red-500">{getDaysOverdue(loan.nextDueDate)} days overdue</p>
                )}
              </div>
              <div>
                <p className="text-gray-500 text-xs">Progress</p>
                <p className="font-medium">{loan.emisPaid}/{loan.tenure} Paid</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Mobile</p>
                <p className="font-medium">{loan.mobile}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Product</p>
                <p className="font-medium truncate">{loan.productName}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {loan.status !== 'Paid' && (
                <button
                  onClick={() => handleCollectPayment(loan)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Collect
                </button>
              )}
              <button
                onClick={() => handleViewDetails(loan)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Details
              </button>
              <button
                onClick={() => window.open(`tel:${loan.mobile}`)}
                className="p-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                title="Call"
              >
                <Phone className="h-5 w-5" />
              </button>
              <button
                onClick={() => window.open(`https://wa.me/91${loan.mobile.replace(/\D/g, '')}?text=Hi ${loan.clientName}, this is regarding your loan ${loan.loanId}.`)}
                className="p-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                title="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Loan Details - {selectedLoan.loanId}</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* Client Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Client Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mobile:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.mobile}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Address:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.address}</span>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Loan Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Product:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.productName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Loan Amount:</span>
                    <span className="ml-2 text-gray-900">₹{selectedLoan.loanAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">EMI Amount:</span>
                    <span className="ml-2 text-gray-900">₹{selectedLoan.emiAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tenure:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.tenure} months</span>
                  </div>
                  <div>
                    <span className="text-gray-500">EMIs Paid:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.emisPaid}/{selectedLoan.tenure}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Next Due Date:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.nextDueDate}</span>
                  </div>
                </div>
              </div>

              {/* Guarantor Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Guarantor Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.guarantor.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mobile:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.guarantor.mobile}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Relation:</span>
                    <span className="ml-2 text-gray-900">{selectedLoan.guarantor.relation}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedLoan.status !== 'Paid' && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCollectPayment(selectedLoan);
                  }}
                  className="px-4 py-2 !bg-green-500 !hover:bg-green-600 text-white rounded-md text-sm font-medium"
                >
                  Collect Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Collection Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Collect Payment</h3>
              <p className="text-sm text-gray-600">Loan ID: {selectedLoan.loanId} - {selectedLoan.clientName}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Proof (Optional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-left text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  {paymentProof ? paymentProof.name : 'Upload payment proof'}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="px-4 py-2 !bg-green-500 !hover:bg-green-600 text-white rounded-md text-sm font-medium"
              >
                Collect Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
