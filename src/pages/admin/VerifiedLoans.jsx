import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/imageHelper';
import { Search, RotateCcw, Check, X, Clock, UserCheck, Eye, Play, Pause, ThumbsDown } from 'lucide-react';
import loanStore from '../../store/loanStore';

// Using real API data from loanStore - no mock data

const statusColors = {
  Verified: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Approved: '!bg-green-100 !text-green-800 dark:!bg-green-900 dark:!text-green-200',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Waiting: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const schema = z.object({
  month: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  status: z.string().optional(),
});

export default function VerifiedLoans() {
  // Get verified loans from store
  const { verifiedLoans, approveLoan, rejectLoan, initializeActiveLoans, deleteLoan: deleteLoanFromStore } = loanStore();
  const [loans, setLoans] = useState(verifiedLoans);
  const [filteredLoans, setFilteredLoans] = useState(verifiedLoans);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCallPlayer, setShowCallPlayer] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Sync with store data
  useEffect(() => {
    setLoans(verifiedLoans);
    setFilteredLoans(verifiedLoans);
  }, [verifiedLoans]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let result = [...loans];
      
      if (data.month) {
        result = result.filter(loan => loan.month === data.month);
      }
      
      if (data.fromDate && data.toDate) {
        result = result.filter(loan => {
          const loanDate = new Date(loan.verifiedDate);
          const fromDate = new Date(data.fromDate);
          const toDate = new Date(data.toDate);
          return loanDate >= fromDate && loanDate <= toDate;
        });
      }
      
      if (data.status && data.status !== 'All') {
        result = result.filter(loan => loan.status === data.status);
      }
      
      setFilteredLoans(result);
      setIsLoading(false);
      toast.success(`Found ${result.length} loans matching your criteria`);
    }, 500);
  };

  const handleReset = () => {
    reset();
    setFilteredLoans(loans);
    toast.info('Filters have been reset');
  };

  const updateLoanStatus = async (id, newStatus) => {
    try {
      setIsLoading(true);
      
      if (newStatus === 'Approved') {
        await approveLoan(id);
        // Initialize active loans for collections
        initializeActiveLoans();
        toast.success('Loan approved successfully!');
      } else if (newStatus === 'Rejected') {
        await rejectLoan(id, 'Rejected by admin');
        toast.success('Loan rejected successfully!');
      } else if (newStatus === 'Pending') {
        // Update to pending status via API
        await loanStore.getState().updateLoanStatus(id, 'Pending', 'Moved back to pending');
        toast.success('Loan moved to pending successfully!');
      }
      
      // Update selected loan if it's the one being updated
      if (selectedLoan && selectedLoan.id === id) {
        setSelectedLoan(prev => ({ ...prev, status: newStatus }));
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating loan status:', error);
      toast.error('Failed to update loan status');
      setIsLoading(false);
    }
  };

  const deleteLoan = (id) => {
    if (window.confirm('Are you sure you want to delete this loan application?')) {
      const success = deleteLoanFromStore(id);
      if (success) {
        toast.success('Loan application deleted successfully!');
        if (selectedLoan && selectedLoan.id === id) {
          setShowDetailsModal(false);
          setSelectedLoan(null);
        }
      } else {
        toast.error('Failed to delete loan application');
      }
    }
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
  };

  const handlePlayCall = (callUrl, type) => {
    setCurrentCall({ url: callUrl, type });
    setShowCallPlayer(true);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const closeLoanDetails = () => {
    setShowDetailsModal(false);
    setTimeout(() => setSelectedLoan(null), 300); // Delay to allow animation
  };

  return (
    <div className="container mx-auto px-4 py-6 relative">
      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Loan Application Details</h3>
                <button
                  onClick={closeLoanDetails}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Client Name</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.clientName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhar Number</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.clientAadharNumber || selectedLoan.aadharNumber}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Applied Date</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedLoan.appliedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Verified Date</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedLoan.verifiedDate ? new Date(selectedLoan.verifiedDate).toLocaleDateString() : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Product</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.productName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tenure</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.tenure} months</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">₹{selectedLoan.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Down Payment</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">₹{selectedLoan.downPayment?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">EMI</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">₹{(selectedLoan.emiAmount || selectedLoan.emi)?.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank Name</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.bankName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Mode</h4>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.paymentMode}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${statusColors[selectedLoan.status]}`}>
                      {selectedLoan.status === 'Waiting' && <Clock className="h-3.5 w-3.5 mr-1" />}
                      {selectedLoan.status === 'Approved' && <Check className="h-3.5 w-3.5 mr-1" />}
                      {selectedLoan.status === 'Rejected' && <X className="h-3.5 w-3.5 mr-1" />}
                      {selectedLoan.status}
                    </span>
                  </div>
                </div>

                {/* Guarantor Details Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                    Guarantor Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor?.name || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Relation</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor?.relation || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor?.mobile || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhar Number</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor?.aadharNumber || selectedLoan.guarantor?.aadhar || 'Not available'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedLoan.guarantor?.address ? 
                          (typeof selectedLoan.guarantor.address === 'string' ? 
                            selectedLoan.guarantor.address :
                            `${selectedLoan.guarantor.address.houseNo}, ${selectedLoan.guarantor.address.galiNo}, ${selectedLoan.guarantor.address.colony}, ${selectedLoan.guarantor.address.area}, ${selectedLoan.guarantor.address.city} - ${selectedLoan.guarantor.address.pincode}, ${selectedLoan.guarantor.address.state}`
                          ) : 'Address not available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Second Guarantor Details Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                    Second Guarantor Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor2FullName || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Relation</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor2Relation || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor2Mobile || 'Not available'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhar Number</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedLoan.guarantor2AadharNumber || 'Not available'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h4>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedLoan.guarantor2HouseNo ? 
                          `${selectedLoan.guarantor2HouseNo}, ${selectedLoan.guarantor2GaliNo || ''}, ${selectedLoan.guarantor2Colony || ''}, ${selectedLoan.guarantor2Area || ''}, ${selectedLoan.guarantor2City || ''} - ${selectedLoan.guarantor2Pincode || ''}, ${selectedLoan.guarantor2State || ''}` 
                          : 'Address not available'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Second Guarantor Documents */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Second Guarantor Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Second Guarantor Photo */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Guarantor Photo</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
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
                      </div>

                      {/* Second Guarantor Aadhar Front */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Aadhar Front</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
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
                      </div>

                      {/* Second Guarantor Aadhar Back */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Aadhar Back</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
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
                      </div>

                      {/* Second Guarantor PAN Card */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">PAN Card</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
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
                </div>

                {/* Documents Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-blue-600" />
                    Client Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Client Photo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Client Photo</h4>
                      <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                        {selectedLoan.clientPhoto ? (
                          <img 
                            src={getImageUrl(selectedLoan.clientPhoto)} 
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
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhar Front</h4>
                      <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                        {selectedLoan.clientAadharFront ? (
                          <img 
                            src={getImageUrl(selectedLoan.clientAadharFront)} 
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
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhar Back</h4>
                      <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                        {selectedLoan.clientAadharBack ? (
                          <img 
                            src={getImageUrl(selectedLoan.clientAadharBack)} 
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
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">PAN Card</h4>
                      <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                        {selectedLoan.clientPanFront ? (
                          <img 
                            src={getImageUrl(selectedLoan.clientPanFront)} 
                            alt="PAN Card" 
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Guarantor Documents */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Guarantor Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Guarantor Photo */}
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Guarantor Photo</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.photo ? (
                            <img 
                              src={getImageUrl(selectedLoan.guarantor.photo)} 
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
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Aadhar Front</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.aadharFront ? (
                            <img 
                              src={getImageUrl(selectedLoan.guarantor.aadharFront)} 
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
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">Aadhar Back</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.aadharBack ? (
                            <img 
                              src={getImageUrl(selectedLoan.guarantor.aadharBack)} 
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
                        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">PAN Card</h5>
                        <div className="h-24 bg-gray-50 dark:bg-gray-700 rounded border flex items-center justify-center">
                          {selectedLoan.guarantor?.panFront ? (
                            <img 
                              src={getImageUrl(selectedLoan.guarantor.panFront)} 
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

                {/* Call Recordings */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <Play className="h-5 w-5 mr-2 text-blue-600" />
                    Call Recordings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {/* Client Call Recording */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Client Call Recording</h4>
                      <div className="mt-1">
                        {selectedLoan.clientCallUrl ? (
                          <button 
                            onClick={() => handlePlayCall(selectedLoan.clientCallUrl, 'Client')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Play Client Call
                          </button>
                        ) : (
                          <span className="!text-green-500 text-xs">✓ No recording available</span>
                        )}
                      </div>
                    </div>

                    {/* Guarantor Call Recording */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Guarantor Call Recording</h4>
                      <div className="mt-1">
                        {selectedLoan.guarantor?.guarantorCallUrl ? (
                          <button 
                            onClick={() => handlePlayCall(selectedLoan.guarantor.guarantorCallUrl, 'Guarantor')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Play Guarantor Call
                          </button>
                        ) : (
                          <span className="!text-green-500 text-xs">✓ No recording available</span>
                        )}
                      </div>
                    </div>

                    {/* Second Guarantor Call Recording */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500">Second Guarantor Call Recording</h4>
                      <div className="mt-1">
                        {selectedLoan.guarantor2?.guarantorCallUrl ? (
                          <button 
                            onClick={() => handlePlayCall(selectedLoan.guarantor2.guarantorCallUrl, 'Second Guarantor')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Play Second Guarantor Call
                          </button>
                        ) : (
                          <span className="!text-green-500 text-xs">✓ No recording available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeLoanDetails}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      updateLoanStatus(selectedLoan.id, 'Pending');
                      closeLoanDetails();
                    }}
                    className={`inline-flex items-center px-4 py-2 border ${selectedLoan.status === 'Pending' ? 'bg-yellow-600 text-white' : 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50'} text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
                    disabled={selectedLoan.status === 'Pending'}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {selectedLoan.status === 'Pending' ? 'Pending' : 'Mark as Pending'}
                  </button>
                  <button
                    onClick={() => {
                      updateLoanStatus(selectedLoan.id, 'Rejected');
                      closeLoanDetails();
                    }}
                    className={`inline-flex items-center px-4 py-2 border ${selectedLoan.status === 'Rejected' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border-red-300 hover:bg-red-50'} text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                    disabled={selectedLoan.status === 'Rejected'}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    {selectedLoan.status === 'Rejected' ? 'Rejected' : 'Reject'}
                  </button>
                  <button
                    onClick={() => {
                      updateLoanStatus(selectedLoan.id, 'Approved');
                      closeLoanDetails();
                    }}
                    className={`inline-flex items-center px-4 py-2 border ${selectedLoan.status === 'Approved' ? '!bg-green-500 !text-white' : 'bg-white !text-green-700 border-green-300 hover:bg-green-50'} text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                    disabled={selectedLoan.status === 'Approved'}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {selectedLoan.status === 'Approved' ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6">Verified Loans Management</h1>
      
      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Loans</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Month
              </label>
              <select
                {...register('month')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
              >
                <option value="">Select Month</option>
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                {...register('fromDate')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                {...register('toDate')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
              >
                <option value="All">All Status</option>
                <option value="Waiting">Waiting</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white !bg-green-500 !hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Filtering...' : 'Filter Loans'}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        </form>
      </div>
      
      {/* Loans Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bank Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Comment/Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {loan.clientName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {loan.clientAadharNumber || loan.aadharNumber}
                          </div>
                          <button
                            onClick={() => handleViewDetails(loan)}
                            className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View Details
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{loan.productName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Price: ₹{loan.price?.toLocaleString()}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Tenure: {loan.tenure} months</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        EMI: ₹{(loan.emiAmount || loan.emi)?.toLocaleString() || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{loan.bankName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Mode: {loan.paymentMode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[loan.status] || 'bg-gray-100 text-gray-800'}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {loan.statusComment ? (
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 dark:text-white break-words">{loan.statusComment}</p>
                          {loan.commentDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(loan.commentDate).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">No comment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                      <button
                        onClick={() => updateLoanStatus(loan.id, 'Pending')}
                        className={`p-1.5 rounded-md ${loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50' : 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/30'}`}
                        title="Mark as Pending"
                        disabled={loan.status === 'Pending'}
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateLoanStatus(loan.id, 'Rejected')}
                        className={`p-1.5 rounded-md ${loan.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/50' : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'}`}
                        title="Reject Loan"
                        disabled={loan.status === 'Rejected'}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateLoanStatus(loan.id, 'Approved')}
                        className={`p-1.5 rounded-md ${loan.status === 'Approved' ? '!bg-green-100 !text-green-700 dark:!bg-green-900/50' : '!text-green-600 hover:bg-green-50 dark:!text-green-400 dark:hover:bg-green-900/30'}`}
                        title="Approve Loan"
                        disabled={loan.status === 'Approved'}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => deleteLoan(loan.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-2"
                          title="Delete Loan"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No loans found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Call Player Modal */}
      {showCallPlayer && currentCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{currentCall.type} Call Recording</h3>
              <button 
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  }
                  setShowCallPlayer(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4">
              <audio 
                ref={audioRef}
                src={currentCall.url} 
                onEnded={() => setIsPlaying(false)}
                className="w-full mb-4"
              />
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlayPause}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <span className="text-gray-700">
                  {isPlaying ? 'Playing...' : 'Paused'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
