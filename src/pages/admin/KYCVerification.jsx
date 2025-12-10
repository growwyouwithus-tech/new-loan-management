import { useState, useRef } from 'react'
import { CheckCircle, XCircle, Eye, X, Upload, Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import fileIcon from '../../assets/file.png'
import cameraIcon from '../../assets/camera.png'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
// UI Components
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { cn } from '../../lib/utils'

// Custom Select component to replace the missing Select component
const CustomSelect = ({ value, onChange, options, className = '', ...props }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="appearance-none w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
  </div>
);

// Simple Label component since it's not in the UI components
const Label = ({ children, htmlFor, className }) => (
  <label 
    htmlFor={htmlFor} 
    className={`block text-sm font-medium text-gray-700 mb-1 ${className || ''}`}
  >
    {children}
  </label>
);

// Simple Popover components since they're not in the UI components
const Popover = ({ children }) => <div className="relative">{children}</div>;
const PopoverTrigger = ({ children }) => <div>{children}</div>;
const PopoverContent = ({ children, className }) => (
  <div className={`absolute z-10 bg-white p-4 border rounded shadow-lg ${className || ''}`}>
    {children}
  </div>
);

// Simple Calendar component
const Calendar = ({ selected, onSelect, className }) => (
  <div className={`bg-white p-2 border rounded ${className || ''}`}>
    <input 
      type="date" 
      value={selected ? format(selected, 'yyyy-MM-dd') : ''} 
      onChange={(e) => onSelect(e.target.valueAsDate)}
      className="w-full p-2 border rounded"
    />
  </div>
);

export default function KYCVerification() {
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(1);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [formData, setFormData] = useState({
    // Section 1: Personal Details
    fullName: '',
    fatherName: '',
    mobileNumber: '',
    alternateNumber: '',
    aadharNumber: '',
    dateOfBirth: '',
    gender: '',
    
    // Section 2: Business Details
    shopName: '',
    businessStartDate: '',
    gstNumber: '',
    udyamNumber: '',
    tradeLicenseNumber: '',
    
    // Section 3: Address
    fullAddress: '',
    area: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    
    // Section 4: Owner Identity Documents
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    selfiePhoto: null,
    signature: null,
    
    // Section 5: Shop Proof Documents
    shopPhotoOutside: null,
    shopPhotoInside: null,
    electricityBill: null,
    tradeLicenseDoc: null,
    
    // Section 6: Bank Details
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankDocument: null,
    
    // Section 7: Verification
    verificationStatus: 'pending',
    rejectReason: '',
    verifiedBy: '',
    verificationDate: ''
  });

  const fileInputRefs = useRef({});
  
  const resetForm = () => {
    setFormData({
      fullName: '',
      fatherName: '',
      mobileNumber: '',
      alternateNumber: '',
      aadharNumber: '',
      dateOfBirth: '',
      gender: '',
      shopName: '',
      businessStartDate: '',
      gstNumber: '',
      udyamNumber: '',
      tradeLicenseNumber: '',
      fullAddress: '',
      area: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      aadharFront: null,
      aadharBack: null,
      panCard: null,
      selfiePhoto: null,
      signature: null,
      shopPhotoOutside: null,
      shopPhotoInside: null,
      electricityBill: null,
      tradeLicenseDoc: null,
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankDocument: null,
      verificationStatus: 'pending',
      rejectReason: '',
      verifiedBy: '',
      verificationDate: ''
    });
    
    // Clear file input values
    Object.keys(fileInputRefs.current).forEach(key => {
      if (fileInputRefs.current[key]) {
        fileInputRefs.current[key].value = '';
      }
    });
    
    setCurrentSection(1);
  };
  
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const handleCloseModal = () => {
    resetForm();
    setIsKYCModalOpen(false);
  };

  const triggerFileInput = (field) => {
    fileInputRefs.current[field]?.click();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Add the new KYC application to the list
    const newKYC = {
      id: Date.now(),
      ...formData,
      submissionDate: new Date().toISOString(),
      verificationStatus: 'pending'
    };
    
    setKycRequests(prev => [newKYC, ...prev]);
    
    // Reset form
    resetForm();
    setIsKYCModalOpen(false);
    toast.success('Shop KYC submitted successfully!');
  };

  const validateSection = (section) => {
    const errors = [];
    
    // Section 1: Personal Details
    if (section === 1) {
      if (!formData.fullName?.trim()) errors.push('Full Name is required');
      if (!formData.fatherName?.trim()) errors.push("Father's Name is required");
      if (!/^[6-9]\d{9}$/.test(formData.mobileNumber)) errors.push('Valid Mobile Number is required');
      if (formData.alternateNumber && !/^[6-9]\d{9}$/.test(formData.alternateNumber)) {
        errors.push('Valid Alternate Number is required');
      }
      if (formData.alternateNumber && formData.mobileNumber === formData.alternateNumber) {
        errors.push('Alternate Number must be different from Mobile Number');
      }
      if (!/^\d{12}$/.test(formData.aadharNumber)) errors.push('Valid 12-digit Aadhar Number is required');
      if (!formData.dateOfBirth) errors.push('Date of Birth is required');
      if (!formData.gender) errors.push('Gender is required');
    }
    
    // Section 2: Business Details
    else if (section === 2) {
      if (!formData.shopName?.trim()) errors.push('Shop Name is required');
      if (!formData.businessStartDate) errors.push('Business Start Date is required');
      if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstNumber)) {
        errors.push('Valid GST Number is required');
      }
      if (formData.udyamNumber && !/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i.test(formData.udyamNumber)) {
        errors.push('Valid Udyam Registration Number is required (format: UDYAM-XX-XX-XXXXXXX)');
      }
    }
    
    // Section 3: Address
    else if (section === 3) {
      if (!formData.fullAddress?.trim()) errors.push('Full Address is required');
      if (!formData.area?.trim()) errors.push('Area is required');
      if (!formData.city?.trim()) errors.push('City is required');
      if (!formData.district?.trim()) errors.push('District is required');
      if (!formData.state?.trim()) errors.push('State is required');
      if (!/^\d{6}$/.test(formData.pincode)) errors.push('Valid 6-digit Pincode is required');
    }
    
    // Section 4: Owner Identity Documents
    else if (section === 4) {
      if (!formData.aadharFront) errors.push('Aadhar Front is required');
      if (!formData.aadharBack) errors.push('Aadhar Back is required');
      if (!formData.panCard) errors.push('PAN Card is required');
      if (!formData.signature) errors.push('Signature is required');
    }
    
    // Section 5: Shop Proof Documents
    else if (section === 5) {
      if (!formData.shopPhotoOutside) errors.push('Shop Outside Photo is required');
      if (!formData.shopPhotoInside) errors.push('Shop Inside Photo is required');
      if (!formData.electricityBill) errors.push('Electricity Bill is required');
    }
    
    // Section 6: Bank Details
    else if (section === 6) {
      // Validate account number (only numbers, 9-18 digits)
      if (!formData.accountNumber?.trim()) {
        errors.push('Account Number is required');
      } else if (!/^\d{9,18}$/.test(formData.accountNumber.trim())) {
        errors.push('Account Number must contain 9 to 18 digits only');
      }
      
      // Validate IFSC Code
      if (!formData.ifscCode?.trim()) {
        errors.push('IFSC Code is required');
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode.trim())) {
        errors.push('Please enter a valid IFSC Code (e.g., HDFC0001234)');
      }
      
      // Validate account holder name
      if (!formData.accountHolderName?.trim()) {
        errors.push('Account Holder Name is required');
      }
      
      // Validate bank document
      if (!formData.bankDocument) {
        errors.push('Bank Passbook or Cancelled Cheque is required');
      }
      
      // Check if account holder is at least 18 years old
      if (formData.dateOfBirth) {
        const dob = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        
        if (age < 18) {
          errors.push('Account holder must be at least 18 years old');
        }
      }
    }
    
    if (errors.length > 0) {
      errors.forEach(error => {
        toast.error(error, { position: 'top-right', autoClose: 5000 });
      });
      return false;
    }
    return true;
  };

  const nextSection = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(prev => Math.min(prev + 1, 6));
    }
  };
  
  const prevSection = () => setCurrentSection(prev => Math.max(prev - 1, 1));

  const [kycRequests, setKycRequests] = useState([
    // Sample data with all required fields
    {
      id: 1,
      fullName: 'John Doe',
      fatherName: 'Michael Doe',
      mobileNumber: '9876543210',
      aadharNumber: '123456789012',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      shopName: 'Doe Electronics',
      businessStartDate: '2020-01-01',
      gstNumber: '22ABCDE1234F1Z5',
      udyamNumber: 'UDYAM-XX-00-0000000',
      tradeLicenseNumber: 'TL12345678',
      fullAddress: '123 Main Street',
      area: 'Downtown',
      city: 'Mumbai',
      district: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      accountNumber: '1234567890',
      ifscCode: 'HDFC0001234',
      accountHolderName: 'John Doe',
      submissionDate: new Date().toISOString(),
      verificationStatus: 'pending',
      aadharFront: 'aadhar-front.jpg',
      aadharBack: 'aadhar-back.jpg',
      panCard: 'pan.jpg',
      selfiePhoto: 'selfie.jpg',
      signature: 'signature.jpg',
      shopPhotoOutside: 'shop-outside.jpg',
      shopPhotoInside: 'shop-inside.jpg',
      electricityBill: 'electricity-bill.jpg',
      tradeLicenseDoc: 'trade-license.jpg',
      bankDocument: 'bank-doc.jpg'
    },
    {
      id: 2,
      fullName: 'Priya Sharma',
      fatherName: 'Rajesh Sharma',
      mobileNumber: '9876543211',
      aadharNumber: '123456789013',
      dateOfBirth: '1985-05-15',
      gender: 'female',
      shopName: 'Sharma Mobiles',
      businessStartDate: '2019-06-15',
      gstNumber: '27XYZDE5678G2H5',
      udyamNumber: 'UDYAM-YY-11-1111111',
      tradeLicenseNumber: 'TL87654321',
      fullAddress: '456 Market Road',
      area: 'Andheri',
      city: 'Mumbai',
      district: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
      accountNumber: '0987654321',
      ifscCode: 'ICIC0001234',
      accountHolderName: 'Priya Sharma',
      submissionDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      verificationStatus: 'pending',
      aadharFront: 'aadhar-front-2.jpg',
      aadharBack: 'aadhar-back-2.jpg',
      panCard: 'pan-2.jpg',
      selfiePhoto: 'selfie-2.jpg',
      signature: 'signature-2.jpg',
      shopPhotoOutside: 'shop-outside-2.jpg',
      shopPhotoInside: 'shop-inside-2.jpg',
      electricityBill: 'electricity-bill-2.jpg',
      tradeLicenseDoc: 'trade-license-2.jpg',
      bankDocument: 'bank-doc-2.jpg'
    }
  ])

  const columns = [
    {
      accessorKey: 'id',
      header: 'KYC ID',
      cell: ({ row }) => `KYC-${row.original.id.toString().slice(-4)}`,
      size: 100
    },
    {
      accessorKey: 'shopName',
      header: 'Shop Name',
      size: 150
    },
    {
      accessorKey: 'fullName',
      header: 'Owner Name',
      size: 150
    },
    {
      accessorKey: 'fatherName',
      header: "Father's Name",
      size: 150
    },
    {
      accessorKey: 'mobileNumber',
      header: 'Mobile',
      size: 120
    },
    {
      accessorKey: 'aadharNumber',
      header: 'Aadhar',
      cell: ({ row }) => row.original.aadharNumber ? `****-****-${row.original.aadharNumber.slice(-4)}` : '',
      size: 130
    },
    {
      accessorKey: 'gstNumber',
      header: 'GST',
      cell: ({ row }) => row.original.gstNumber || 'N/A',
      size: 150
    },
    {
      accessorKey: 'city',
      header: 'City',
      size: 120
    },
    {
      accessorKey: 'pincode',
      header: 'Pincode',
      size: 100
    },
    {
      accessorKey: 'businessStartDate',
      header: 'Business Since',
      cell: ({ row }) => row.original.businessStartDate ? new Date(row.original.businessStartDate).toLocaleDateString() : 'N/A',
      size: 120
    },
    {
      accessorKey: 'verificationStatus',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.original.verificationStatus === 'verified' ? '!bg-green-100 !text-green-800' :
          row.original.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.original.verificationStatus || 'pending'}
        </span>
      ),
      size: 100
    },
    {
      accessorKey: 'submissionDate',
      header: 'Submitted On',
      cell: ({ row }) => row.original.submissionDate ? new Date(row.original.submissionDate).toLocaleString() : 'N/A',
      size: 150
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleViewKYC(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleVerify(row.original.id, 'verified')}
            disabled={row.original.verificationStatus === 'verified'}
          >
            <CheckCircle className="h-4 w-4 !text-green-500" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const reason = window.prompt('Enter rejection reason:');
              if (reason) {
                handleVerify(row.original.id, 'rejected', reason);
              }
            }}
            disabled={row.original.verificationStatus === 'rejected'}
          >
            <XCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const handleViewKYC = (kycData) => {
    setSelectedKYC(kycData);
    setIsViewModalOpen(true);
  };

  const handleVerify = (id, status, rejectReason = '') => {
    setKycRequests(prev => 
      prev.map(k => 
        k.id === id 
          ? { 
              ...k, 
              verificationStatus: status,
              rejectReason,
              verificationDate: new Date().toISOString(),
              verifiedBy: 'Admin' // You can replace with actual admin user
            } 
          : k
      )
    );
    toast.success(`KYC ${status} successfully`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KYC Verification</h1>
          <p className="text-muted-foreground">Review and verify customer documents</p>
        </div>
        <Button
          className="bg-[#25D366] hover:bg-[#128C7E] text-white"
          style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
          onClick={() => setIsKYCModalOpen(true)}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Shop KYC
        </Button>
      </div>
      
      <Table columns={columns} data={kycRequests} />

      {/* KYC Details View Modal */}
      {isViewModalOpen && selectedKYC && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
                <h2 className="text-2xl font-bold">KYC Details - {selectedKYC.shopName || 'N/A'}</h2>
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Personal Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">1. Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Full Name" value={selectedKYC.fullName} />
                    <DetailItem label="Father's Name" value={selectedKYC.fatherName} />
                    <DetailItem label="Mobile Number" value={selectedKYC.mobileNumber} />
                    <DetailItem label="Alternate Number" value={selectedKYC.alternateNumber || 'N/A'} />
                    <DetailItem label="Aadhar Number" value={selectedKYC.aadharNumber ? `****-****-${selectedKYC.aadharNumber.slice(-4)}` : 'N/A'} />
                    <DetailItem label="Date of Birth" value={selectedKYC.dateOfBirth} />
                    <DetailItem label="Gender" value={selectedKYC.gender} />
                  </div>
                </div>
                
                {/* Business Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">2. Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Shop Name" value={selectedKYC.shopName} />
                    <DetailItem label="Business Start Date" value={selectedKYC.businessStartDate} />
                    <DetailItem label="GST Number" value={selectedKYC.gstNumber || 'N/A'} />
                    <DetailItem label="Udyam Number" value={selectedKYC.udyamNumber || 'N/A'} />
                    <DetailItem label="Trade License Number" value={selectedKYC.tradeLicenseNumber || 'N/A'} />
                  </div>
                </div>
                
                {/* Address */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">3. Address Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Full Address" value={selectedKYC.fullAddress} spanFull />
                    <DetailItem label="Area" value={selectedKYC.area} />
                    <DetailItem label="City" value={selectedKYC.city} />
                    <DetailItem label="District" value={selectedKYC.district} />
                    <DetailItem label="State" value={selectedKYC.state} />
                    <DetailItem label="Pincode" value={selectedKYC.pincode} />
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">4. Documents</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aadhar Front & Back */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Aadhar Card</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-2">
                          <p className="text-sm text-gray-500 mb-1">Front</p>
                          {selectedKYC.aadharFront ? (
                            <img 
                              src={selectedKYC.aadharFront} 
                              alt="Aadhar Front" 
                              className="w-full h-40 object-contain border rounded"
                            />
                          ) : (
                            <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="border rounded p-2">
                          <p className="text-sm text-gray-500 mb-1">Back</p>
                          {selectedKYC.aadharBack ? (
                            <img 
                              src={selectedKYC.aadharBack} 
                              alt="Aadhar Back" 
                              className="w-full h-40 object-contain border rounded"
                            />
                          ) : (
                            <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* PAN Card */}
                    <div className="space-y-2">
                      <h4 className="font-medium">PAN Card</h4>
                      <div className="h-48 bg-gray-50 rounded border flex items-center justify-center">
                        {selectedKYC.panCard ? (
                          <img 
                            src={selectedKYC.panCard} 
                            alt="PAN Card" 
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </div>

<div className="space-y-2">
                      <h4 className="font-medium">Signature</h4>
                      <div className="h-48 bg-gray-50 rounded border flex items-center justify-center">
                        {selectedKYC.signature ? (
                          <img 
                            src={selectedKYC.signature} 
                            alt="Signature" 
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400">No Image</span>
                        )}
                      </div>
                    </div>

                    {/* Shop Photos */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Shop Photos</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Outside View</p>
                          <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                            {selectedKYC.shopPhotoOutside ? (
                              <img 
                                src={selectedKYC.shopPhotoOutside} 
                                alt="Shop Outside" 
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">No Image</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Inside View</p>
                          <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                            {selectedKYC.shopPhotoInside ? (
                              <img 
                                src={selectedKYC.shopPhotoInside} 
                                alt="Shop Inside" 
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">No Image</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bank and Other Documents */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Bank Document (Passbook/Cheque)</h4>
                        <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedKYC.bankDocument ? (
                            <img 
                              src={selectedKYC.bankDocument} 
                              alt="Bank Document" 
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-gray-400">No Document</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Electricity Bill</h4>
                        <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedKYC.electricityBill ? (
                            <img 
                              src={selectedKYC.electricityBill} 
                              alt="Electricity Bill" 
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-gray-400 text-sm">No Document</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Trade License / GST Certificate</h4>
                        <div className="h-32 bg-gray-50 rounded border flex items-center justify-center">
                          {selectedKYC.tradeLicenseDoc ? (
                            <img 
                              src={selectedKYC.tradeLicenseDoc} 
                              alt="Trade License" 
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-gray-400">No Document</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bank Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">5. Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem label="Account Number" value={selectedKYC.accountNumber ? `****${selectedKYC.accountNumber.slice(-4)}` : 'N/A'} />
                    <DetailItem label="IFSC Code" value={selectedKYC.ifscCode} />
                    <DetailItem label="Account Holder Name" value={selectedKYC.accountHolderName} />
                  </div>
                </div>
                
                {/* Verification Status */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 border-b pb-2">6. Verification Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem 
                      label="Status" 
                      value={
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedKYC.verificationStatus === 'verified' ? '!bg-green-100 !text-green-800' :
                          selectedKYC.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedKYC.verificationStatus ? selectedKYC.verificationStatus.toUpperCase() : 'PENDING'}
                        </span>
                      } 
                    />
                    {selectedKYC.rejectReason && (
                      <DetailItem label="Rejection Reason" value={selectedKYC.rejectReason} className="text-red-600 font-medium" />
                    )}
                    {selectedKYC.verificationDate && (
                      <DetailItem 
                        label="Verification Date" 
                        value={new Date(selectedKYC.verificationDate).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} 
                      />
                    )}
                    {selectedKYC.verifiedBy && (
                      <DetailItem label="Verified By" value={selectedKYC.verifiedBy} className="font-medium" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end sticky bottom-0 bg-white pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Form Modal */}
      {isKYCModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[1000] flex items-start justify-center p-4 overflow-y-auto"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{
              position: 'relative',
              zIndex: 1001,
              margin: '1rem',
              maxHeight: 'calc(100vh - 2rem)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Shop KYC Verification</h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Progress Steps */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div 
                      key={step}
                      className="flex flex-col items-center flex-1"
                    >
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${currentSection >= step ? 'bg-[#25D366]' : 'bg-gray-300'}`}
                      >
                        {step}
                      </div>
                      {step < 6 && (
                        <div className={`h-1 flex-1 mt-3 ${currentSection > step ? 'bg-[#25D366]' : 'bg-gray-200'}`}></div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 px-2">
                  <span>Personal</span>
                  <span>Business</span>
                  <span>Address</span>
                  <span>ID Proof</span>
                  <span>Shop Proof</span>
                  <span>Bank</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Section 1: Personal Details */}
                {currentSection === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">1. Shopkeeper Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input 
                          name="fullName" 
                          value={formData.fullName} 
                          onChange={handleInputChange}
                          minLength={2}
                          required 
                        />
                      </div>
                      <div>
                        <Label>Father's Name *</Label>
                        <Input 
                          name="fatherName" 
                          value={formData.fatherName} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <Label>Mobile Number *</Label>
                        <Input 
                          name="mobileNumber" 
                          type="tel" 
                          pattern="[0-9]{10}"
                          maxLength={10}
                          value={formData.mobileNumber} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <Label>Alternate Number</Label>
                        <Input 
                          name="alternateNumber" 
                          type="tel" 
                          pattern="[0-9]{10}"
                          maxLength={10}
                          value={formData.alternateNumber} 
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label>Aadhar Number *</Label>
                        <Input 
                          name="aadharNumber" 
                          type="text"
                          pattern="[0-9]{12}"
                          maxLength={12}
                          value={formData.aadharNumber} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <Label>Date of Birth *</Label>
                        <Input 
                          name="dateOfBirth" 
                          type="date" 
                          value={formData.dateOfBirth} 
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            // Calculate age
                            const today = new Date();
                            const birthDate = new Date(selectedDate);
                            let age = today.getFullYear() - birthDate.getFullYear();
                            const monthDiff = today.getMonth() - birthDate.getMonth();
                            
                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                              age--;
                            }
                            
                            if (age < 18) {
                              toast.error('You must be at least 18 years old', { position: 'top-right' });
                            } else {
                              handleInputChange(e);
                            }
                          }}
                          max={(() => {
                            const today = new Date();
                            const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                            return minAgeDate.toISOString().split('T')[0];
                          })()}
                          required 
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be at least 18 years old</p>
                      </div>
                      <div>
                        <Label>Gender *</Label>
                        <CustomSelect
                          name="gender"
                          value={formData.gender}
                          onChange={(e) => setFormData(prev => ({...prev, gender: e.target.value}))}
                          options={[
                            { value: '', label: 'Select gender' },
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'other', label: 'Other' }
                          ]}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Business Details */}
                {currentSection === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">2. Shop / Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Shop/Business Name *</Label>
                        <Input 
                          name="shopName" 
                          value={formData.shopName} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <Label>Business Start Date *</Label>
                        <Input 
                          name="businessStartDate" 
                          type="month" 
                          value={formData.businessStartDate} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <Label>GST Number</Label>
                        <Input 
                          name="gstNumber" 
                          value={formData.gstNumber} 
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label>Udyam Registration Number</Label>
                        <Input 
                          name="udyamNumber" 
                          value={formData.udyamNumber} 
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label>Trade License No.</Label>
                        <Input 
                          name="tradeLicenseNumber" 
                          value={formData.tradeLicenseNumber} 
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Address */}
                {currentSection === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">3. Shop Address</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Full Address *</Label>
                        <Textarea 
                          name="fullAddress" 
                          value={formData.fullAddress} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Area / Locality *</Label>
                          <Input 
                            name="area" 
                            value={formData.area} 
                            onChange={handleInputChange}
                            required 
                          />
                        </div>
                        <div>
                          <Label>City *</Label>
                          <Input 
                            name="city" 
                            value={formData.city} 
                            onChange={handleInputChange}
                            required 
                          />
                        </div>
                        <div>
                          <Label>District *</Label>
                          <Input 
                            name="district" 
                            value={formData.district} 
                            onChange={handleInputChange}
                            required 
                          />
                        </div>
                        <div>
                          <Label>State *</Label>
                          <Input 
                            name="state" 
                            value={formData.state} 
                            onChange={handleInputChange}
                            required 
                          />
                        </div>
                        <div>
                          <Label>Pincode *</Label>
                          <Input 
                            name="pincode" 
                            type="text" 
                            pattern="[0-9]{6}"
                            value={formData.pincode} 
                            onChange={handleInputChange}
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Owner Identity Documents */}
                {currentSection === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">4. Owner Identity Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DocumentUpload 
                        label="Aadhar Front *" 
                        name="aadharFront" 
                        file={formData.aadharFront}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.aadharFront = el}
                        required
                      />
                      <DocumentUpload 
                        label="Aadhar Back *" 
                        name="aadharBack" 
                        file={formData.aadharBack}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.aadharBack = el}
                        required
                      />
                      <DocumentUpload 
                        label="PAN Card" 
                        name="panCard" 
                        file={formData.panCard}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.panCard = el}
                      />
<DocumentUpload 
                        label="Signature Upload *" 
                        name="signature" 
                        file={formData.signature}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.signature = el}
                        accept="image/*"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Section 5: Shop Proof Documents */}
                {currentSection === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">5. Shop Proof Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DocumentUpload 
                        label="Shop Photo (Outside View) *" 
                        name="shopPhotoOutside" 
                        file={formData.shopPhotoOutside}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.shopPhotoOutside = el}
                        accept="image/*"
                        required
                      />
                      <DocumentUpload 
                        label="Shop Inside Photo *" 
                        name="shopPhotoInside" 
                        file={formData.shopPhotoInside}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.shopPhotoInside = el}
                        accept="image/*"
                        required
                      />
                      <DocumentUpload 
                        label="Electricity Bill / Rent Agreement *" 
                        name="electricityBill" 
                        file={formData.electricityBill}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.electricityBill = el}
                        required
                      />
                      <DocumentUpload 
                        label="Trade License / GST Certificate" 
                        name="tradeLicenseDoc" 
                        file={formData.tradeLicenseDoc}
                        onFileChange={handleFileChange}
                        triggerFileInput={triggerFileInput}
                        inputRef={el => fileInputRefs.current.tradeLicenseDoc = el}
                      />
                    </div>
                  </div>
                )}

                {/* Section 6: Bank Details */}
                {currentSection === 6 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">6. Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Bank Account Number *</Label>
                        <Input 
                          name="accountNumber" 
                          value={formData.accountNumber} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <Label>IFSC Code *</Label>
                        <Input 
                          name="ifscCode" 
                          value={formData.ifscCode} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div>
                        <Label>Account Holder Name *</Label>
                        <Input 
                          name="accountHolderName" 
                          value={formData.accountHolderName} 
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      <div className="flex flex-col">
                        <DocumentUpload 
                          label="Passbook / Cancelled Cheque *" 
                          name="bankDocument" 
                          file={formData.bankDocument}
                          onFileChange={handleFileChange}
                          triggerFileInput={triggerFileInput}
                          inputRef={el => fileInputRefs.current.bankDocument = el}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}


                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={prevSection}
                    disabled={currentSection === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentSection < 6 ? (
                    <Button 
                      type="button" 
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-2 px-6 rounded-md shadow-sm transition-colors duration-200"
                      style={{ 
                        backgroundColor: '#25D366',
                        borderColor: '#25D366',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}
                      onClick={nextSection}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                    >
                      Submit KYC
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Detail Item Component for KYC View
function DetailItem({ label, value, className = '', spanFull = false }) {
  return (
    <div className={cn(spanFull ? 'col-span-2' : '', className)}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900 break-words">
        {value || 'N/A'}
      </p>
    </div>
  );
}

// Document Upload Component
function DocumentUpload({ label, name, file, onFileChange, triggerFileInput, inputRef, accept, required = false }) {
  // Use file icon for all fields including Owner Identity Documents
  // Only use camera icon for "Live Photo" fields
  const isCameraIcon = label.toLowerCase().includes('live photo') || label.toLowerCase().includes('take photo');
  const iconSrc = isCameraIcon ? cameraIcon : fileIcon;
  
  return (
    <div className="space-y-2">
      <Label>{label}{required && ' *'}</Label>
      <div 
        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
        onClick={() => triggerFileInput(name)}
      >
        <input
          type="file"
          ref={inputRef}
          name={name}
          onChange={(e) => onFileChange(e, name)}
          className="hidden"
          accept={accept}
          required={required && !file}
        />
        {file ? (
          <div className="text-sm !text-green-600">
            <CheckCircle className="h-5 w-5 mx-auto mb-1" />
            {file.name}
          </div>
        ) : (
          <div className="text-gray-500">
            <img 
              src={iconSrc} 
              alt={isCameraIcon ? 'camera' : 'file'} 
              className="h-8 w-8 mx-auto mb-1"
            />
            <p className="text-sm">Click to upload</p>
            <p className="text-xs text-gray-400">Max 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
