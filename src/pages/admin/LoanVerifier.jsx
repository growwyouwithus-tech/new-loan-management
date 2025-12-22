  import React, { useState, useRef, useEffect } from 'react';
import { Search, RefreshCw, Calendar as CalendarIcon, Eye, Download, Check, X, Loader2, MoreVertical, FileText, UserCheck, AlertCircle, Upload, Phone, Mic, MicOff } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format, parseISO, isWithinInterval } from 'date-fns';
import loanStore from '../../store/loanStore';
import { toast } from 'react-toastify';

// Using real API data from loanStore - no mock data

const statusColors = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Verified': 'bg-blue-100 text-blue-800',
  'Approved': '!bg-green-100 !text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Not Verified': 'bg-gray-100 text-gray-800'
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Safe property accessor helper - returns null for empty strings too
const safeGet = (obj, ...keys) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return null;
};

// Safe number formatter
const formatCurrency = (value) => {
  const num = parseInt(value) || 0;
  return num.toLocaleString('en-IN');
};

export default function LoanVerifier() {
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedCalls, setRecordedCalls] = useState({});
  
  // Verification checkboxes state
  const [verificationChecks, setVerificationChecks] = useState({
    clientName: false,
    emi: false,
    clientWorkingAddress: false,
    tenure: false,
    clientPermanentAddress: false,
    guarantorName: false,
    guarantorRelation: false,
    guarantorWorkingAddress: false,
    guarantorPermanentAddress: false
  });
  
  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentAction, setCommentAction] = useState(''); // 'reject' or 'pending'
  const [comment, setComment] = useState('');
  const fileInputRef = useRef(null);
  const clientCallRef = useRef(null);
  const guarantorCallRef = useRef(null);
  const guarantor2CallRef = useRef(null);
  
  // Get loans from store
  const { pendingLoans, updateLoanStatus: updateLoanStatusInStore, rejectLoan, deleteLoan: deleteLoanFromStore } = loanStore();
  const [loans, setLoans] = useState(pendingLoans);

  // Sync with store data
  useEffect(() => {
    setLoans(pendingLoans);
  }, [pendingLoans]);

  // Function to open loan details
  const openDetails = (loan) => {
    setSelectedLoan(loan);
    // Initialize call recordings for this loan if not exists
    setRecordedCalls(prev => ({
      ...prev,
      [loan.id]: {
        client: prev[loan.id]?.client || { file: null, uploaded: false },
        guarantor: prev[loan.id]?.guarantor || { file: null, uploaded: false },
        guarantor2: prev[loan.id]?.guarantor2 || { file: null, uploaded: false }
      }
    }));
    setShowDetailsModal(true);
  };

  // Function to close the modal
  const closeDetails = () => {
    setShowDetailsModal(false);
  };

  const applyFilters = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      let filteredLoans = [...pendingLoans];

      // Apply month filter
      if (selectedMonth !== 'All Months') {
        filteredLoans = filteredLoans.filter(loan => loan.month === selectedMonth);
      }

      // Apply date range filter
      if (fromDate && toDate) {
        const startDate = parseISO(fromDate);
        const endDate = parseISO(toDate);
        
        filteredLoans = filteredLoans.filter(loan => {
          const loanDate = parseISO(loan.appliedDate);
          return isWithinInterval(loanDate, { start: startDate, end: endDate });
        });
      }

      setLoans(filteredLoans);
      setIsLoading(false);
    }, 500);
  };

  const resetFilters = () => {
    setSelectedMonth('All Months');
    setFromDate('');
    setToDate('');
    setLoans(pendingLoans);
  };

  const updateLoanStatus = async (id, newStatus, rejectionComment = '') => {
    // For Verified status, check if all checkboxes are ticked
    if (newStatus === 'Verified') {
      const allChecked = Object.values(verificationChecks).every(checked => checked === true);
      if (!allChecked) {
        toast.error('Please verify all fields before proceeding!');
        return;
      }
    }
    
    try {
      // Update in store (async function)
      await updateLoanStatusInStore(id, newStatus, 'verifier', rejectionComment);
      
      // If there's a comment, log it
      if (rejectionComment) {
        console.log(`${newStatus} reason:`, rejectionComment);
      }
      
      toast.success(`Loan ${newStatus.toLowerCase()} successfully!`);
      // Reset states
      setSelectedLoan(null);
      setShowDetailsModal(false);
      setShowCommentModal(false);
      setComment('');
      setCommentAction('');
      // Reset verification checks
      setVerificationChecks({
        clientName: false,
        emi: false,
        clientWorkingAddress: false,
        tenure: false,
        clientPermanentAddress: false,
        guarantorName: false,
        guarantorRelation: false,
        guarantorWorkingAddress: false,
        guarantorPermanentAddress: false
      });
    } catch (error) {
      console.error('Failed to update loan status:', error);
      toast.error('Failed to update loan status');
    }
  };
  
  // Handle opening comment modal for reject/pending
  const handleOpenCommentModal = (action) => {
    setCommentAction(action);
    setShowCommentModal(true);
  };
  
  // Handle submitting comment
  const handleSubmitComment = () => {
    if (!comment.trim()) {
      toast.error('Please enter a reason!');
      return;
    }
    
    const status = commentAction === 'reject' ? 'Rejected' : 'Pending';
    updateLoanStatus(selectedLoan.id, status, comment);
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (field) => {
    setVerificationChecks(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const deleteLoan = async (id) => {
    if (window.confirm('Are you sure you want to delete this loan application?')) {
      try {
        await deleteLoanFromStore(id);
        toast.success('Loan application deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete loan application');
      }
    }
  };

  const handleDownload = (loanId, documentType) => {
    try {
      // Find the loan in the mock data
      const loan = mockLoans.find(loan => loan.id === loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Loan Application Details', 14, 22);
      doc.setLineWidth(0.5);
      doc.line(14, 25, 196, 25);
      
      // Set font for content
      doc.setFontSize(12);
      let yPosition = 40;
      
      // Add loan details
      const details = [
        `Loan ID: ${loan.id}`,
        `Client Name: ${loan.clientName}`,
        `Aadhar Number: ${loan.aadharNumber}`,
        `Pan Number: ${loan.panNumber}`,
        `Working Address: ${loan.details.workingAddress}`,
        `Father's / Spouse Name: ${loan.details.fatherOrSpouseName}`,
        `Gender: ${loan.details.gender}`,
        `Mobile: ${loan.details.mobile}`,
        `Applied Date: ${new Date(loan.appliedDate).toLocaleDateString()}`,
        '','',
        'Product Details',
        `Product: ${loan.productName}`,
        `Price: ₹${loan.price.toLocaleString('en-IN')}`,
        `Tenure: ${loan.tenure}`,
        '','',
        'Financial Details',
        `Down Payment (20%): ₹${loan.details.downPayment}`,
        `Loan Amount: ₹${loan.details.loanAmount}`,
        `Interest Rate: ${loan.details.interestRate}`,
        `EMI: ₹${loan.details.emi}`,
        `File Charge: ₹${loan.details.fileCharge}`,
        '','',
        'Address',
        loan.details.address
      ];
      
      // Add each line to the PDF
      details.forEach((line, index) => {
        if (line === '') {
          yPosition += 5; // Add extra space for empty lines
        } else if (line === 'Product Details' || line === 'Financial Details' || line === 'Address') {
          doc.setFont('helvetica', 'bold');
          doc.text(line, 14, yPosition);
          yPosition += 10;
          doc.setFont('helvetica', 'normal');
        } else {
          doc.text(line, 14, yPosition);
          yPosition += 8;
        }
      });
      
      // Add status with color
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text(`Status: ${loan.status}`, 14, yPosition + 10);
      
      // Add a border around the status
      doc.rect(12, yPosition + 3, 30, 8);
      
      // Save the PDF
      doc.save(`${documentType}_${loanId}.pdf`);
      
      // Show success message
      alert(`Successfully downloaded ${documentType} for loan ${loanId}`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate download. Please try again.');
    }
  };
  
  const handleCallUpload = (e, loanId, type) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you would upload the file to the server here
      console.log(`Uploading ${type} call recording for loan ${loanId}:`, file.name);
      
      // Update state to show the file is being uploaded
      setRecordedCalls(prev => ({
        ...prev,
        [loanId]: {
          ...prev[loanId],
          [type]: { file, uploaded: false }
        }
      }));
      
      // Simulate file upload
      setTimeout(() => {
        setRecordedCalls(prev => ({
          ...prev,
          [loanId]: {
            ...prev[loanId],
            [type]: { file, uploaded: true }
          }
        }));
        
        // Reset the file input
        if (type === 'client' && clientCallRef.current) {
          clientCallRef.current.value = '';
        } else if (type === 'guarantor' && guarantorCallRef.current) {
          guarantorCallRef.current.value = '';
        } else if (type === 'guarantor2' && guarantor2CallRef.current) {
          guarantor2CallRef.current.value = '';
        }
        
        toast.success(`${type === 'client' ? 'Client' : type === 'guarantor' ? 'Guarantor' : 'Second Guarantor'} call recording uploaded successfully!`);
      }, 1000);
    }
  };
  
  const startCallRecording = (type) => {
    // In a real app, this would use the Web Audio API to record
    console.log(`Starting ${type} call recording`);
    setIsRecording(type);
    
    // Simulate recording for 5 seconds
    setTimeout(() => {
      setIsRecording(false);
      const fakeFile = new File([`${type}-call-recording-${Date.now()}.wav`], `${type}-call.wav`, { type: 'audio/wav' });
      
      // Auto-save the recording
      setRecordedCalls(prev => ({
        ...prev,
        [selectedLoan.id]: {
          ...prev[selectedLoan.id],
          [type]: { file: fakeFile, uploaded: false }
        }
      }));
      
      // Auto-upload the recording
      setTimeout(() => {
        setRecordedCalls(prev => ({
          ...prev,
          [selectedLoan.id]: {
            ...prev[selectedLoan.id],
            [type]: { file: fakeFile, uploaded: true }
          }
        }));
        toast.success(`${type === 'client' ? 'Client' : 'Guarantor'} call recorded and saved!`);
      }, 1000);
    }, 5000);
  };
  
  const stopCallRecording = () => {
    console.log('Stopping call recording');
    setIsRecording(false);
  };

  const getStatusBadge = (status) => {
    const statusIcons = {
      'Pending': <AlertCircle className="h-3.5 w-3.5 mr-1" />,
      'Verified': <Check className="h-3.5 w-3.5 mr-1" />,
      'Rejected': <X className="h-3.5 w-3.5 mr-1" />,
      'Not Verified': <X className="h-3.5 w-3.5 mr-1" />
    };

    return (
      <div className="flex items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
          {statusIcons[status] || null}
          {status}
        </span>
      </div>
    );
  };


  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Loan Verifier</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Search className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Loans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Month Dropdown */}
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option>All Months</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Date Range Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <CalendarIcon className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
                </div>
                <span className="flex items-center">to</span>
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    disabled={!fromDate}
                  />
                  <CalendarIcon className="absolute right-2 top-2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              {selectedLoan && (
              <button
                onClick={() => handleDownload(selectedLoan.id, 'loan_details')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Details
              </button>
              )}
              <div className="relative group">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Actions
                </button>
                <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block z-10">
                  <div className="py-1">
                    <button
                      onClick={() => startCallRecording('client')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      disabled={isRecording}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording === 'client' ? 'Recording...' : 'Record Client Call'}
                    </button>
                    <button
                      onClick={() => startCallRecording('guarantor')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      disabled={isRecording}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording === 'guarantor' ? 'Recording...' : 'Record Guarantor Call'}
                    </button>
                    <button
                      onClick={() => startCallRecording('guarantor2')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      disabled={isRecording}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {isRecording === 'guarantor2' ? 'Recording...' : 'Record Second Guarantor Call'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={applyFilters}
              disabled={isLoading || (fromDate && !toDate) || (!fromDate && toDate)}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(isLoading || (fromDate && !toDate) || (!fromDate && toDate)) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Filtering...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Filter Loans
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loan Display Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aadhar Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (₹)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-gray-600">Loading loans...</span>
                    </div>
                  </td>
                </tr>
              ) : loans.length > 0 ? (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {safeGet(loan, 'clientName', 'name') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {safeGet(loan, 'clientAadharNumber', 'aadharNumber') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {loan.appliedDate ? format(parseISO(loan.appliedDate), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{safeGet(loan, 'productName') || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{safeGet(loan, 'tenure') || 'N/A'} months</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{formatCurrency(safeGet(loan, 'price'))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {/* View Button */}
                      <button
                        onClick={() => openDetails(loan)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      {/* Action Buttons Based on Status */}
                      {loan.status === 'Pending' && (
                        <div className="inline-flex space-x-2">
                          <button
                            onClick={() => updateLoanStatus(loan.id, 'Verified')}
                            className="text-xs font-medium !text-green-600 hover:!text-green-900 border !border-green-200 rounded px-2 py-1 hover:!bg-green-50"
                            title="Verify"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => updateLoanStatus(loan.id, 'Rejected')}
                            className="text-xs font-medium text-red-600 hover:text-red-900 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => deleteLoan(loan.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                        title="Delete Loan"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDownload(loan.id, 'loan_document')}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download Documents"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No loans found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Loan Application Details</h3>
                <button
                  onClick={() => {
                    setSelectedLoan(null);
                    setShowDetailsModal(false);
                  }}
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={verificationChecks.clientName}
                          onChange={() => handleCheckboxChange('clientName')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                        />
                        <h4 className="text-sm font-medium text-gray-500">Client Name</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => isRecording === 'client' ? stopCallRecording() : startCallRecording('client')}
                          className={`p-1.5 rounded-full ${isRecording === 'client' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                          title={isRecording === 'client' ? 'Stop Recording' : 'Record Call'}
                        >
                          {isRecording === 'client' ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        <input
                          type="file"
                          ref={clientCallRef}
                          accept="audio/*"
                          onChange={(e) => handleCallUpload(e, selectedLoan.id, 'client')}
                          className="hidden"
                          id={`client-call-upload-${selectedLoan.id}`}
                        />
                        <button
                          onClick={() => document.getElementById(`client-call-upload-${selectedLoan.id}`).click()}
                          className="p-1.5 rounded-full !bg-green-100 !text-green-600 hover:!bg-green-200"
                          title="Upload Call Recording"
                        >
                          <Upload size={16} />
                        </button>
                        {recordedCalls[selectedLoan.id]?.client?.uploaded && (
                          <span className="!text-green-500 text-xs">✓</span>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'clientName', 'name') || 'N/A'}</p>
                  </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Aadhar Number</h4>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'clientAadharNumber', 'aadharNumber') || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Pan Number</h4>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'clientPanNumber', 'panNumber') || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Gender</h4>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'clientGender', 'gender') || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Father's / Spouse Name</h4>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'clientFatherOrSpouseName', 'fatherOrSpouseName') || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Mobile</h4>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'clientMobile', 'mobile') || 'N/A'}</p>
                </div>
                 <div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={verificationChecks.clientWorkingAddress}
                      onChange={() => handleCheckboxChange('clientWorkingAddress')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                    />
                    <h4 className="text-sm font-medium text-gray-500">Working Address</h4>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'clientWorkingAddress', 'workingAddress') || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Applied Date</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedLoan.appliedDate ? new Date(selectedLoan.appliedDate).toLocaleDateString('en-IN') : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Product</h4>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'productName') || 'N/A'}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={verificationChecks.tenure}
                      onChange={() => handleCheckboxChange('tenure')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                    />
                    <h4 className="text-sm font-medium text-gray-500">Tenure</h4>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'tenure') || 'N/A'} months</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Price</h4>
                  <p className="mt-1 text-sm text-gray-900">₹{formatCurrency(safeGet(selectedLoan, 'price'))}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Down Payment (20%)</h4>
                  <p className="mt-1 text-sm text-gray-900">₹{formatCurrency(safeGet(selectedLoan, 'downPayment'))}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Loan Amount</h4>
                  <p className="mt-1 text-sm text-gray-900">₹{formatCurrency(safeGet(selectedLoan, 'loanAmount'))}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Interest Rate</h4>
                  <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'interestRate') || '3.5%'}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={verificationChecks.emi}
                      onChange={() => handleCheckboxChange('emi')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                    />
                    <h4 className="text-sm font-medium text-gray-500">EMI</h4>
                  </div>
                  <p className="mt-1 text-sm text-gray-900">₹{formatCurrency(safeGet(selectedLoan, 'emiAmount'))}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">File Charge</h4>
                  <p className="mt-1 text-sm text-gray-900">₹{formatCurrency(safeGet(selectedLoan, 'fileCharge', 500))}</p>
                </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={verificationChecks.clientPermanentAddress}
                        onChange={() => handleCheckboxChange('clientPermanentAddress')}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                      />
                      <h4 className="text-sm font-medium text-gray-500">Permanent Address</h4>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedLoan.clientAddress ? 
                        `${selectedLoan.clientAddress.houseNo || ''}, ${selectedLoan.clientAddress.galiNo || ''}, ${selectedLoan.clientAddress.colony || ''}, ${selectedLoan.clientAddress.area || ''}, ${selectedLoan.clientAddress.city || ''} - ${selectedLoan.clientAddress.pincode || ''}, ${selectedLoan.clientAddress.state || ''}` 
                        : 'Address not available'}
                    </p>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Client Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Client Photo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Client Photo</h4>
                      <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                        {selectedLoan.clientPhoto ? (
                          <img 
                            src={selectedLoan.clientPhoto} 
                            alt="Client Photo" 
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </div>

                    {/* Aadhar Front */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Aadhar Front</h4>
                      <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                        {selectedLoan.clientAadharFront ? (
                          <img 
                            src={selectedLoan.clientAadharFront} 
                            alt="Aadhar Front" 
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </div>

                    {/* Aadhar Back */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">Aadhar Back</h4>
                      <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                        {selectedLoan.clientAadharBack ? (
                          <img 
                            src={selectedLoan.clientAadharBack} 
                            alt="Aadhar Back" 
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </div>

                    {/* PAN Card */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500">PAN Card</h4>
                      <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                        {selectedLoan.clientPanFront ? (
                          <img 
                            src={selectedLoan.clientPanFront} 
                            alt="PAN Card" 
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guarantor Details Section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium text-gray-900 flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                      Guarantor Details
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => isRecording === 'guarantor' ? stopCallRecording() : startCallRecording('guarantor')}
                        className={`p-1.5 rounded-full ${isRecording === 'guarantor' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                        title={isRecording === 'guarantor' ? 'Stop Recording' : 'Record Call'}
                      >
                        {isRecording === 'guarantor' ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                      <input
                        type="file"
                        ref={guarantorCallRef}
                        accept="audio/*"
                        onChange={(e) => handleCallUpload(e, selectedLoan.id, 'guarantor')}
                        className="hidden"
                        id={`guarantor-call-upload-${selectedLoan.id}`}
                      />
                      <button
                        onClick={() => document.getElementById(`guarantor-call-upload-${selectedLoan.id}`).click()}
                        className="p-1.5 rounded-full !bg-green-100 !text-green-600 hover:!bg-green-200"
                        title="Upload Call Recording"
                      >
                        <Upload size={16} />
                      </button>
                      {recordedCalls[selectedLoan.id]?.guarantor?.uploaded && (
                        <span className="!text-green-500 text-xs">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={verificationChecks.guarantorName}
                          onChange={() => handleCheckboxChange('guarantorName')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                        />
                        <h4 className="text-sm font-medium text-gray-500">Guarantor Name</h4>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan.guarantor, 'name') || 'Not available'}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={verificationChecks.guarantorRelation}
                          onChange={() => handleCheckboxChange('guarantorRelation')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                        />
                        <h4 className="text-sm font-medium text-gray-500">Relation</h4>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan.guarantor, 'relation') || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Mobile</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan.guarantor, 'mobile') || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Aadhar Number</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan.guarantor, 'aadharNumber') || 'Not available'}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={verificationChecks.guarantorWorkingAddress}
                          onChange={() => handleCheckboxChange('guarantorWorkingAddress')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                        />
                        <h4 className="text-sm font-medium text-gray-500">Working Address</h4>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan.guarantor, 'workingAddress') || 'Not available'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={verificationChecks.guarantorPermanentAddress}
                          onChange={() => handleCheckboxChange('guarantorPermanentAddress')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                        />
                        <h4 className="text-sm font-medium text-gray-500">Permanent Address</h4>
                      </div>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedLoan.guarantor?.address ? 
                          `${selectedLoan.guarantor.address.houseNo || ''}, ${selectedLoan.guarantor.address.galiNo || ''}, ${selectedLoan.guarantor.address.colony || ''}, ${selectedLoan.guarantor.address.area || ''}, ${selectedLoan.guarantor.address.city || ''} - ${selectedLoan.guarantor.address.pincode || ''}, ${selectedLoan.guarantor.address.state || ''}` 
                          : 'Address not available'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Reference Name</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan.guarantor, 'referenceName') || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Reference Mobile Number</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan.guarantor, 'referenceMobileNumber') || 'Not available'}</p>
                    </div>
                  </div>
                  
                  {/* Guarantor Documents */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Guarantor Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Guarantor Photo */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">Guarantor Photo</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.photo ? (
                            <img 
                              src={selectedLoan.guarantor.photo} 
                              alt="Guarantor Photo" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div>

                      {/* Guarantor Aadhar Front */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">Aadhar Front</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.aadharFront ? (
                            <img 
                              src={selectedLoan.guarantor.aadharFront} 
                              alt="Guarantor Aadhar Front" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div>

                      {/* Guarantor Aadhar Back */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">Aadhar Back</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.aadharBack ? (
                            <img 
                              src={selectedLoan.guarantor.aadharBack} 
                              alt="Guarantor Aadhar Back" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div>

                      {/* Guarantor PAN Card */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">PAN Card</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.panFront ? (
                            <img 
                              src={selectedLoan.guarantor.panFront} 
                              alt="Guarantor PAN Card" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Guarantor Details Section */}
                {/* <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium text-gray-900 flex items-center">
                      <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                      Second Guarantor Details
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => isRecording === 'guarantor2' ? stopCallRecording() : startCallRecording('guarantor2')}
                        className={`p-1.5 rounded-full ${isRecording === 'guarantor2' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                        title={isRecording === 'guarantor2' ? 'Stop Recording' : 'Record Call'}
                      >
                        {isRecording === 'guarantor2' ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                      <input
                        type="file"
                        ref={guarantor2CallRef}
                        accept="audio/*"
                        onChange={(e) => handleCallUpload(e, selectedLoan.id, 'guarantor2')}
                        className="hidden"
                        id={`guarantor2-call-upload-${selectedLoan.id}`}
                      />
                      <button
                        onClick={() => document.getElementById(`guarantor2-call-upload-${selectedLoan.id}`).click()}
                        className="p-1.5 rounded-full !bg-green-100 !text-green-600 hover:!bg-green-200"
                        title="Upload Call Recording"
                      >
                        <Upload size={16} />
                      </button>
                      {recordedCalls[selectedLoan.id]?.guarantor2?.uploaded && (
                        <span className="!text-green-500 text-xs">✓</span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Name</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'guarantor2FullName', 'guarantor2Name') || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Relation</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'guarantor2Relation') || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Mobile</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'guarantor2Mobile') || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Aadhar Number</h4>
                      <p className="mt-1 text-sm text-gray-900">{safeGet(selectedLoan, 'guarantor2AadharNumber') || 'Not available'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {safeGet(selectedLoan, 'guarantor2HouseNo') ? 
                          `${safeGet(selectedLoan, 'guarantor2HouseNo') || ''}, ${safeGet(selectedLoan, 'guarantor2GaliNo') || ''}, ${safeGet(selectedLoan, 'guarantor2Colony') || ''}, ${safeGet(selectedLoan, 'guarantor2Area') || ''}, ${safeGet(selectedLoan, 'guarantor2City') || ''} - ${safeGet(selectedLoan, 'guarantor2Pincode') || ''}, ${safeGet(selectedLoan, 'guarantor2State') || ''}` 
                          : 'Address not available'}
                      </p>
                    </div>
                  </div> */}
                  
                  {/* Second Guarantor Documents */}
                  {/* <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Second Guarantor Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> */}
                      {/* Second Guarantor Photo */}
                      {/* <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">Guarantor Photo</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor2Photo ? (
                            <img 
                              src={selectedLoan.guarantor2Photo} 
                              alt="Second Guarantor Photo" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div> */}

                      {/* Second Guarantor Aadhar Front */}
                      {/* <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">Aadhar Front</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor2AadharFront ? (
                            <img 
                              src={selectedLoan.guarantor2AadharFront} 
                              alt="Second Guarantor Aadhar Front" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div> */}

                      {/* Second Guarantor Aadhar Back */}
                      {/* <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">Aadhar Back</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor2AadharBack ? (
                            <img 
                              src={selectedLoan.guarantor2AadharBack} 
                              alt="Second Guarantor Aadhar Back" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div> */}

                      {/* Second Guarantor PAN Card */}
                      {/* <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500">PAN Card</h5>
                        <div className="h-24 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor2PanFront ? (
                            <img 
                              src={selectedLoan.guarantor2PanFront} 
                              alt="Second Guarantor PAN Card" 
                              className="max-h-full max-w-full object-contain rounded"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No Image</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
             </div>
             
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={closeDetails}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCommentModal('pending')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Mark as Pending
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCommentModal('reject')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => updateLoanStatus(selectedLoan.id, 'Verified')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white !bg-green-500 !hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Comment Modal for Reject/Pending */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {commentAction === 'reject' ? 'Rejection Reason' : 'Mark as Pending Reason'}
              </h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please provide a reason for {commentAction === 'reject' ? 'rejecting' : 'marking as pending'} this loan application:
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter ${commentAction === 'reject' ? 'rejection' : 'pending'} reason...`}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                  setCommentAction('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitComment}
                className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  commentAction === 'reject' 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                    : 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'
                }`}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
