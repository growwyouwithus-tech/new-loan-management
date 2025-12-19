  import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Calendar, CreditCard, ChevronDown, ChevronUp, Briefcase, Banknote, Building, Hash, ChevronsRight, ArrowRight, ArrowLeft, Printer, X, Camera } from 'lucide-react';
import loanStore from '../../store/loanStore';
import fileIcon from '../../assets/file.png';
import cameraIcon from '../../assets/camera.png';
import '../../styles/printStyles.css';

// Camera Modal Component
const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permission.');
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          stopCamera();
          onClose();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative bg-white rounded-lg p-4 max-w-2xl w-full mx-4">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Take Photo</h3>
          
          {error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>
              
              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center mx-auto gap-2"
              >
                <Camera className="h-5 w-5" />
                Capture Photo
              </button>
            </>
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

// Reusable Input Component
const FormInput = ({ name, label, register, errors, icon: Icon, className = '', isMissing = false, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <div className="relative">
      {Icon && <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isMissing ? 'text-red-500' : 'text-gray-400'}`} />}
      <input
        {...register(name)}
        className={`w-full rounded-lg border-2 py-2.5 px-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${isMissing ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-400 hover:border-gray-300'} ${Icon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
    {errors[name] && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors[name].message}</p>}
    {isMissing && !errors[name] && <p className="mt-1.5 text-sm text-red-600 font-medium">This field is required</p>}
  </div>
);

// Reusable File Input
const FileInput = ({ name, label, register, errors, resetKey, isMissing = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const fileInputRef = React.useRef(null);
  const galleryInputRef = React.useRef(null);

  // Reset selected file when resetKey changes
  useEffect(() => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  }, [resetKey]);

  const {
    ref,
    name: fieldName,
    onBlur,
    onChange: onChangeRHF,
  } = register(name);

  const handleCameraCapture = (file) => {
    setSelectedFile(file.name);
    
    // Create a synthetic event for react-hook-form
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.files = dataTransfer.files;
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', { value: fileInputRef.current, enumerable: true });
      onChangeRHF(event);
    }
    
    if (galleryInputRef.current) {
      galleryInputRef.current.files = dataTransfer.files;
    }
  };

  const handleGalleryChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file.name);
      onChangeRHF(e);
      // Sync file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${isMissing ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-gray-300'}`}>
        <input
          type="file"
          accept="image/*"
          name={fieldName}
          ref={(el) => {
            ref(el);
            fileInputRef.current = el;
          }}
          onBlur={onBlur}
          className="hidden"
          id={`file-${name}-hidden`}
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id={`file-${name}-gallery`}
          onChange={handleGalleryChange}
          ref={galleryInputRef}
        />
        <div className="flex items-center justify-start space-x-3">
          <button
            type="button"
            onClick={() => setShowCameraModal(true)}
            className={`flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${isMissing ? 'opacity-60' : ''}`}
          >
            <img
              src={cameraIcon}
              alt="camera"
              className="h-8 w-8"
            />
          </button>
          <label
            htmlFor={`file-${name}-gallery`}
            className={`flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${isMissing ? 'opacity-60' : ''}`}
          >
            <img
              src={fileIcon}
              alt="gallery"
              className="h-8 w-8"
            />
          </label>
          {selectedFile && (
            <span className="ml-2 text-sm text-gray-600">{selectedFile}</span>
          )}
        </div>
      </div>
      <CameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
      {errors[name] && <p className="mt-1 text-sm text-red-600">{errors[name].message}</p>}
      {isMissing && !errors[name] && <p className="mt-1 text-sm text-red-600">This field is required</p>}
    </div>
  );
};

// Address Accordion
const AddressFields = ({ register, errors, isOpen, toggle, prefix = '', missingFields = [] }) => (
  <div className="md:col-span-2">
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-between w-full text-left text-sm font-semibold py-2 px-3 rounded-lg transition-all duration-200 ${missingFields.some(f => f.includes('HouseNo') || f.includes('GaliNo') || f.includes('Colony') || f.includes('Landmark') || f.includes('City') || f.includes('Pincode') || f.includes('State')) ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
    >
      <span>{prefix ? `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ` : ''}Permanent Address</span>
      {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </button>
    {isOpen && (
      <div className="mt-3 p-5 border-2 border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput name={prefix ? `${prefix}HouseNo` : "houseNo"} label="House No *" register={register} errors={errors} isMissing={missingFields.includes(prefix ? `${prefix}HouseNo` : "houseNo")} />
        <FormInput name={prefix ? `${prefix}GaliNo` : "galiNo"} label="Gali No *" register={register} errors={errors} isMissing={missingFields.includes(prefix ? `${prefix}GaliNo` : "galiNo")} />
        <FormInput name={prefix ? `${prefix}Colony` : "colony"} label="Colony *" register={register} errors={errors} isMissing={missingFields.includes(prefix ? `${prefix}Colony` : "colony")} />
        <FormInput name={prefix ? `${prefix}Landmark` : "landmark"} label="Landmark *" register={register} errors={errors} isMissing={missingFields.includes(prefix ? `${prefix}Landmark` : "landmark")} />
        <FormInput name={prefix ? `${prefix}City` : "city"} label="City *" register={register} errors={errors} isMissing={missingFields.includes(prefix ? `${prefix}City` : "city")} />
        <FormInput name={prefix ? `${prefix}Pincode` : "pincode"} label="Pincode *" register={register} errors={errors} isMissing={missingFields.includes(prefix ? `${prefix}Pincode` : "pincode")} maxLength={6} />
        <FormInput name={prefix ? `${prefix}State` : "state"} label="State *" register={register} errors={errors} isMissing={missingFields.includes(prefix ? `${prefix}State` : "state")} />
      </div>
    )}
  </div>
);

// Zod Schemas
const fileSchema = z.any().optional();

const clientObjectSchema = z.object({
  fullName: z.string().optional(),
  fatherOrSpouseName: z.string().optional(),
  gender: z.string().optional(),
  mobile: z.string().optional(),
  workingAddress: z.string().optional(),
  houseNo: z.string().optional(),
  galiNo: z.string().optional(),
  colony: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  state: z.string().optional(),
  photo: fileSchema,
  aadharNumber: z.string().optional(),
  aadharFront: fileSchema,
  aadharBack: fileSchema,
  panNumber: z.string().optional(),
  panFront: fileSchema,
});

const clientSchema = clientObjectSchema;

const guarantorSchema = z.object({
  relation: z.string().optional(),
  guarantorFullName: z.string().optional(),
  guarantorGender: z.string().optional(),
  guarantorMobile: z.string().optional(),
  guarantorWorkingAddress: z.string().optional(),
  guarantorHouseNo: z.string().optional(),
  guarantorGaliNo: z.string().optional(),
  guarantorColony: z.string().optional(),
  guarantorLandmark: z.string().optional(),
  guarantorCity: z.string().optional(),
  guarantorPincode: z.string().optional(),
  guarantorState: z.string().optional(),
  guarantorPhoto: fileSchema,
  guarantorAadharNumber: z.string().optional(),
  guarantorAadharFront: fileSchema,
  guarantorAadharBack: fileSchema,
  referenceName: z.string().optional(),
  referenceNumber: z.string().optional(),
  skipGuarantor: z.boolean().optional(),
});

const productSchema = z.object({
  category: z.string().optional(),
  productName: z.string().optional(),
  productCompany: z.string().optional(),
  price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().max(20000, 'Price cannot exceed ₹20,000').optional()
  ),
  downPayment: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
  ),
  serialNumber: z.string().optional(),
  securityKey: z.string(),
  tenure: z.string().optional(),
  emiStartDate: z.string().optional(),
}).refine(
  (data) => {
    if (!data.price || !data.downPayment) return true;
    const minDownPayment = Math.ceil(data.price * 0.25);
    return data.downPayment >= minDownPayment;
  },
  {
    message: 'Down payment must be at least 25% of the price',
    path: ['downPayment'],
  }
);

const bankSchema = z.object({
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  paymentMode: z.string().optional(),
});

const shopProofSchema = z.object({
  shopPhotoOutside: fileSchema,
  shopPhotoInside: fileSchema,
  electricityBill: fileSchema,
  tradeLicenseDoc: z.any().optional(),
});

const signatureSchema = z.object({
  signature: fileSchema,
});

// Preview schema - no validation needed
const previewSchema = z.object({});

const stepSchemas = [clientSchema, guarantorSchema, productSchema, bankSchema, signatureSchema, previewSchema];

export default function ApplyLoan() {
  const navigate = useNavigate();
  const location = useLocation();
  const editLoan = location.state?.editLoan;
  
  // Stage management: 'aadhar' -> 'mode' -> 'form'
  const [stage, setStage] = useState(editLoan ? 'form' : 'aadhar');
  
  // Aadhar check page state
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarSearched, setAadhaarSearched] = useState(false);
  const [aadhaarMatches, setAadhaarMatches] = useState([]);
  
  // Mode selection state
  const [applicationMode, setApplicationMode] = useState(editLoan ? 'edit' : null);
  
  // Form state
  const [step, setStep] = useState(0);
  const [isAddressOpen, setIsAddressOpen] = useState(true);
  const [allFormData, setAllFormData] = useState({});
  const [resetKey, setResetKey] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  const [isEditMode, setIsEditMode] = useState(!!editLoan);
  
  const { addLoanApplication, loans, updateLoan } = loanStore();

  const resetForm = () => {
    setStep(0);
    setAllFormData({});
    reset(); // Clear all form fields
    setResetKey(prev => prev + 1); // Reset file inputs
    setAadhaarInput('');
    setAadhaarSearched(false);
    setAadhaarMatches([]);
  };

  const currentSchema = stepSchemas[step];
  const { register, handleSubmit, watch, trigger, formState: { errors, isValid }, reset, setValue } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onChange',
  });

  // Populate form when editing
  useEffect(() => {
    if (editLoan && isEditMode) {
      // Populate all form data from editLoan
      const formData = {
        // Client details
        fullName: editLoan.customerName || editLoan.clientName || '',
        fatherOrSpouseName: editLoan.fatherOrSpouseName || '',
        gender: editLoan.gender || '',
        mobile: editLoan.customerPhone || editLoan.mobile || '',
        workingAddress: editLoan.workingAddress || '',
        houseNo: editLoan.houseNo || '',
        galiNo: editLoan.galiNo || '',
        colony: editLoan.colony || '',
        landmark: editLoan.landmark || '',
        city: editLoan.city || '',
        pincode: editLoan.pincode || '',
        state: editLoan.state || '',
        aadharNumber: editLoan.customerAadhaar || editLoan.clientAadharNumber || '',
        panNumber: editLoan.customerPan || '',
        
        // Guarantor details
        relation: editLoan.guarantorRelationship || '',
        guarantorFullName: editLoan.guarantorName || '',
        guarantorGender: editLoan.guarantorGender || '',
        guarantorMobile: editLoan.guarantorPhone || '',
        guarantorWorkingAddress: editLoan.guarantorWorkingAddress || '',
        guarantorHouseNo: editLoan.guarantorHouseNo || '',
        guarantorGaliNo: editLoan.guarantorGaliNo || '',
        guarantorColony: editLoan.guarantorColony || '',
        guarantorLandmark: editLoan.guarantorLandmark || '',
        guarantorCity: editLoan.guarantorCity || '',
        guarantorPincode: editLoan.guarantorPincode || '',
        guarantorState: editLoan.guarantorState || '',
        guarantorAadharNumber: editLoan.guarantorAadhaar || '',
        referenceName: editLoan.referenceName || '',
        referenceNumber: editLoan.referenceNumber || '',
        
        // Product details
        category: editLoan.productCategory || '',
        productName: editLoan.productName || '',
        productCompany: editLoan.productCompany || '',
        price: editLoan.productPrice || editLoan.price || editLoan.loanAmount || '',
        downPayment: editLoan.downPayment || '',
        serialNumber: editLoan.serialNumber || '',
        securityKey: editLoan.securityKey || '',
        tenure: editLoan.tenure || '',
        emiStartDate: editLoan.emiStartDate || '',
        
        // Bank details
        bankName: editLoan.bankName || '',
        accountNumber: editLoan.accountNumber || '',
        ifscCode: editLoan.ifscCode || '',
        paymentMode: editLoan.paymentMode || '',
      };
      
      setAllFormData(formData);
      
      // Set values for current step
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          setValue(key, formData[key]);
        }
      });
      
      toast.info('Editing loan application. Update the details as needed.');
    }
  }, [editLoan, isEditMode, setValue]);

  const price = watch('price');
  const tenure = watch('tenure');
  const customDownPayment = watch('downPayment');
  const minDownPayment = price ? Math.ceil(price * 0.25) : 0;
  const downPayment = customDownPayment && customDownPayment > 0 ? customDownPayment : minDownPayment;
  const loanAmount = price ? price - downPayment : 0;
  
  // Dynamic interest rate based on down payment percentage
  const getInterestRate = () => {
    if (!price || !downPayment) return 0.0375; // Default 3.75%
    const downPaymentPercentage = (downPayment / price) * 100;
    
    if (downPaymentPercentage >= 35) {
      return 0.03; // 3%
    } else if (downPaymentPercentage > 25) {
      return 0.035; // 3.5%
    } else {
      return 0.0375; // 3.75%
    }
  };
  
  const interest = getInterestRate();
  const fileCharge = 300;

  const calculateEMI = () => {
    if (!loanAmount || !tenure) return 0;
    const n = parseInt(tenure);
    // Simple flat interest: Monthly interest = loanAmount × 3.5%
    const monthlyInterest =    loanAmount * interest;
    // Total interest for all months
    const totalInterest = monthlyInterest * n;
    // Total payable = loan amount + total interest
    const totalPayable =  loanAmount + totalInterest;
    // EMI = total payable / number of months
    const emi = totalPayable / n;
    return Math.ceil(emi);
  };
  const emi = calculateEMI();

  const handleCheckAadhaar = () => {
    const trimmed = aadhaarInput.trim();
    if (!trimmed) {
      toast.error('Please enter Aadhar number to check status.');
      return;
    }

    const matches = loans.filter((loan) => {
      const clientAadhar = (loan.clientAadharNumber || '').toString();
      const loanId = (loan.loanId || '').toString();
      return clientAadhar === trimmed || loanId === trimmed;
    });

    setAadhaarMatches(matches);
    setAadhaarSearched(true);
  };

  const handleSkipAadhaarCheck = () => {
    // Move to mode selection page
    setStage('mode');
  };

  const handleModeSelection = (mode) => {
    setApplicationMode(mode);
    // Move to form page
    setStage('form');
  };

  const handleAddExistingCustomer = () => {
    // Directly move to form page with max_born_group mode for existing customer
    setApplicationMode('max_born_group');
    setStage('form');
  };

  const getRequiredFieldsForStep = (mode, currentStep, isBankDetailsFilled = false, paymentMode = '') => {
    // For SELF mode, only client's Aadhar number is mandatory on step 0
    if (mode === 'self') {
      if (currentStep === 0) {
        return ['aadharNumber'];
      }
      return [];
    }

    if (mode !== 'max_born_group') return [];

    switch (currentStep) {
      case 0:
        return [
          'fullName',
          'fatherOrSpouseName',
          'gender',
          'mobile',
          'workingAddress',
          'houseNo',
          'galiNo',
          'colony',
          'landmark',
          'city',
          'pincode',
          'state',
          'photo',
          'aadharNumber',
          'aadharFront',
          'aadharBack',
          'panNumber',
          'panFront',
        ];
      case 1:
        // If payment mode is 'cash', bank details are optional
        if (paymentMode === 'cash') {
          return [];
        }
        return [
          'bankName',
          'accountNumber',
          'ifscCode',
          'paymentMode',
        ];
      case 2:
        // If bank details are filled, guarantor is optional
        if (isBankDetailsFilled) {
          return [];
        }
        return [
          'relation',
          'guarantorFullName',
          'guarantorGender',
          'guarantorMobile',
          'guarantorWorkingAddress',
          'guarantorHouseNo',
          'guarantorGaliNo',
          'guarantorColony',
          'guarantorLandmark',
          'guarantorCity',
          'guarantorPincode',
          'guarantorState',
          'guarantorPhoto',
          'guarantorAadharNumber',
          'guarantorAadharFront',
          'guarantorAadharBack',
        ];
      case 3:
        return [
          'category',
          'productName',
          'productCompany',
          'price',
          'serialNumber',
          'tenure',
          'emiStartDate',
        ];
      case 4:
        return ['signature'];
      case 5:
        return []; // Preview step has no validation
      default:
        return [];
    }
  };

  const validateCurrentStep = () => {
    const paymentMode = watch('paymentMode');
    const requiredFields = getRequiredFieldsForStep(applicationMode, step, !!bankAccountFilled, paymentMode);
    if (!requiredFields.length) {
      setMissingFields([]);
      return true;
    }

    const values = watch();
    const missing = requiredFields.filter((field) => {
      const value = values[field];
      if (value === undefined || value === null) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      // Check for FileList or File objects
      if (value instanceof FileList) return value.length === 0;
      if (value instanceof File) return false; // File object exists, field is filled
      // Check if it's an array of files (some form libraries use this)
      if (Array.isArray(value)) return value.length === 0;
      return false;
    });

    if (missing.length > 0) {
      setMissingFields(missing);
      toast.error(`Please fill all required fields before continuing. (${missing.length} field(s) missing)`);
      return false;
    }

    setMissingFields([]);
    return true;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) return;
    const currentData = watch();
    setAllFormData(prev => ({ 
      ...prev, 
      [`step${step}`]: currentData,
      ...currentData 
    }));
    // Prevent going beyond the last step to avoid accidental auto-submit or skipping
    setStep((s) => (s >= steps.length - 1 ? s : s + 1));
  };

  const prevStep = () => setStep(s => s - 1);

  const handlePrint = () => {
    window.print();
  };

  const onSubmit = (data) => {
    console.log('Submit called on step:', step);
    console.log('Form data:', data);
    
    // Skip validation on preview step (step 5)
    if (step !== 5 && !validateCurrentStep()) {
      console.log('Validation failed on step:', step);
      return;
    }
    
    console.log('Validation passed, proceeding with submission');
    
    // Combine all form data from all steps
    const completeFormData = { ...allFormData, ...data };
    
    // Structure the loan application data
    const loanApplicationData = {
      // Client Details
      clientName: completeFormData.fullName,
      clientFatherOrSpouseName: completeFormData.fatherOrSpouseName,
      clientGender: completeFormData.gender,
      clientMobile: completeFormData.mobile,
      clientWorkingAddress: completeFormData.workingAddress,
      clientAddress: {
        houseNo: completeFormData.houseNo,
        galiNo: completeFormData.galiNo,
        colony: completeFormData.colony,
        landmark: completeFormData.landmark,
        city: completeFormData.city,
        pincode: completeFormData.pincode,
        state: completeFormData.state,
      },
      clientAadharNumber: completeFormData.aadharNumber,
      clientPanNumber: completeFormData.panNumber,
      
      // Guarantor Details - Get from step 1 form data
      guarantor: {
        name: completeFormData.guarantorFullName || allFormData.guarantorFullName || 'Guarantor Name',
        gender: completeFormData.guarantorGender || allFormData.guarantorGender || 'male',
        mobile: completeFormData.guarantorMobile || allFormData.guarantorMobile || '9999999999',
        workingAddress: completeFormData.guarantorWorkingAddress || allFormData.guarantorWorkingAddress || '',
        relation: completeFormData.relation || allFormData.relation || 'friend',
        address: {
          houseNo: completeFormData.guarantorHouseNo || allFormData.guarantorHouseNo || '123',
          galiNo: completeFormData.guarantorGaliNo || allFormData.guarantorGaliNo || 'Main Street',
          colony: completeFormData.guarantorColony || allFormData.guarantorColony || 'Colony',
          landmark: completeFormData.guarantorLandmark || allFormData.guarantorLandmark || 'Landmark',
          city: completeFormData.guarantorCity || allFormData.guarantorCity || 'City',
          pincode: completeFormData.guarantorPincode || allFormData.guarantorPincode || '123456',
          state: completeFormData.guarantorState || allFormData.guarantorState || 'State',
        },
        aadharNumber: completeFormData.guarantorAadharNumber || allFormData.guarantorAadharNumber || '123456789012',
        referenceName: completeFormData.referenceName || allFormData.referenceName || '',
        referenceNumber: completeFormData.referenceNumber || allFormData.referenceNumber || '',
      },
      
      // Product Details
      productCategory: completeFormData.category,
      productName: completeFormData.productName,
      productCompany: completeFormData.productCompany,
      price: completeFormData.price ? parseInt(completeFormData.price) : undefined,
      serialNumber: completeFormData.serialNumber,
      tenure: completeFormData.tenure ? parseInt(completeFormData.tenure) : undefined,
      emiStartDate: completeFormData.emiStartDate,
      
      // Calculated Financial Details
      downPayment: downPayment,
      loanAmount: loanAmount,
      emiAmount: emi,
      interestRate: interest,
      fileCharge: fileCharge,
      
      // Bank Details
      bankName: completeFormData.bankName,
      accountNumber: completeFormData.accountNumber,
      ifscCode: completeFormData.ifscCode,
      paymentMode: completeFormData.paymentMode,
      
      // Additional metadata
      month: new Date().toLocaleString('default', { month: 'long' }),
      applicationMode,
    };

    try {
      // Add to loan store
      const newLoan = addLoanApplication(loanApplicationData);
      
      console.log('Loan Application Submitted:', newLoan);
      toast.success(`Loan application submitted successfully! Loan ID: ${newLoan.loanId}`);
      
      // Reset form
      resetForm();
      
      // Redirect to My Loans page after 1.5 seconds
      setTimeout(() => {
        navigate('/shopkeeper/my-loans');
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting loan application:', error);
      toast.error('Failed to submit loan application. Please try again.');
    }
  };

  const formatSummaryValue = (value) => {
    if (value === undefined || value === null) return 'Not Filled';
    if (typeof value === 'string' && value.trim() === '') return 'Not Filled';
    return value;
  };

  const steps = [
    { name: 'Client Details' },
    { name: 'Bank Details' },
    { name: 'Guarantor Details' },
    { name: 'Product Details' },
    { name: 'Signature Upload' },
    { name: 'Preview & Confirm' },
  ];

  const bankAccountFilled = watch('bankName') && watch('accountNumber') && watch('ifscCode') && watch('paymentMode');

  const renderStepContent = () => {
    switch (step) {
      case 0: // Client Details
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
              <FormInput name="fullName" label="Full Name *" register={register} errors={errors} icon={User} placeholder="Enter full name" isMissing={missingFields.includes('fullName')} />
              <FormInput name="fatherOrSpouseName" label="Father's / Spouse Name *" register={register} errors={errors} icon={User} placeholder="Enter name" isMissing={missingFields.includes('fatherOrSpouseName')} />
              <FormInput name="workingAddress" label="Working Address *" register={register} errors={errors} icon={Briefcase} placeholder="Enter working address" isMissing={missingFields.includes('workingAddress')} />
              <FormInput name="mobile" label="Mobile Number *" type="tel" register={register} errors={errors} icon={Phone} maxLength={10} placeholder="10-digit number" isMissing={missingFields.includes('mobile')} />
              <div>
                <label className={`block text-sm font-semibold mb-2 ${missingFields.includes('gender') ? 'text-red-600' : 'text-gray-700'}`}>Gender *</label>
                <div className="flex space-x-6 mt-3">
                  {['male', 'female', 'other'].map(g => <label key={g} className="inline-flex items-center cursor-pointer group"><input type="radio" value={g} {...register('gender')} className="h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer" /><span className="ml-2.5 capitalize font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{g}</span></label>)}
                </div>
                {errors.gender && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.gender.message}</p>}
                {missingFields.includes('gender') && !errors.gender && <p className="mt-1.5 text-sm text-red-600 font-medium">This field is required</p>}
              </div>
              
              <AddressFields register={register} errors={errors} isOpen={isAddressOpen} toggle={() => setIsAddressOpen(!isAddressOpen)} missingFields={missingFields} />
              <FileInput name="photo" label="Live Photo Upload *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('photo')} />
              <FormInput name="aadharNumber" label="Aadhar Number *" register={register} errors={errors} icon={CreditCard} maxLength={12} placeholder="12-digit number" isMissing={missingFields.includes('aadharNumber')} />
              <FileInput name="aadharFront" label="Aadhar Front Photo *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('aadharFront')} />
              <FileInput name="aadharBack" label="Aadhar Back Photo *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('aadharBack')} />
              <FormInput name="panNumber" label="PAN Number *" type="text" register={register} errors={errors} icon={CreditCard} maxLength={10} placeholder="ABCDE1234F" className="uppercase" isMissing={missingFields.includes('panNumber')} />
              <FileInput name="panFront" label="PAN Front Photo *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('panFront')} />
            </div>
          </div>
        );
      case 1: // Bank Details
        const paymentModeValue = watch('paymentMode');
        const isCashMode = paymentModeValue === 'cash';
        return (
          <div className="space-y-4">
            {isCashMode && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ℹ️ Cash Payment Mode:</span> Bank details are optional for cash payments. You can skip this section and proceed to the next step.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput name="bankName" label={`Bank Name ${!isCashMode ? '*' : ''}`} register={register} errors={errors} icon={Building} isMissing={missingFields.includes('bankName')} />
              <FormInput name="accountNumber" label={`Account Number ${!isCashMode ? '*' : ''}`} register={register} errors={errors} icon={Hash} isMissing={missingFields.includes('accountNumber')} />
              <FormInput name="ifscCode" label={`IFSC Code ${!isCashMode ? '*' : ''}`} register={register} errors={errors} icon={Hash} maxLength={11} className="uppercase" isMissing={missingFields.includes('ifscCode')} />
              <div>
                <label className={`block text-sm font-semibold mb-2 ${missingFields.includes('paymentMode') ? 'text-red-600' : 'text-gray-700'}`}>Payment Mode *</label>
                <div className="flex space-x-6 mt-3">
                  {['auto_debit', 'manual', 'cash'].map(m => <label key={m} className="inline-flex items-center cursor-pointer group"><input type="radio" value={m} {...register('paymentMode')} className="h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer" /><span className="ml-2.5 capitalize font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{m.replace('_', ' ')}</span></label>)}
                </div>
                {errors.paymentMode && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.paymentMode.message}</p>}
                {missingFields.includes('paymentMode') && !errors.paymentMode && <p className="mt-1.5 text-sm text-red-600 font-medium">This field is required</p>}
              </div>
            </div>
          </div>
        );
      case 2: // Guarantor Details
        return (
            <div className="space-y-4">
                {bankAccountFilled && (
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        // Skip to next step without validation
                        const currentData = watch();
                        setAllFormData(prev => ({ 
                          ...prev, 
                          [`step${step}`]: currentData,
                          ...currentData 
                        }));
                        setStep(s => (s >= steps.length - 1 ? s : s + 1));
                      }}
                      className="px-3 py-1.5 text-xs text-blue-700 font-medium border border-blue-300 bg-white hover:bg-blue-50 rounded transition"
                    >
                      Skip
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${missingFields.includes('relation') ? 'text-red-600' : 'text-gray-700'}`}>Relation *</label>
                        <select {...register('relation')} className={`w-full rounded-lg border-2 py-2.5 px-3 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${missingFields.includes('relation') ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-400 hover:border-gray-300'}`}>
                            <option value="">Select Relation</option>
                            {[, 'father', 'elder_brother', 'elder_sister', 'colleague','neighbor'].map(r => <option key={r} value={r} className="capitalize">{r.replace('_', ' ')}</option>)}
                        </select>
                        {errors.relation && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.relation.message}</p>}
                        {missingFields.includes('relation') && !errors.relation && <p className="mt-1.5 text-sm text-red-600 font-medium">This field is required</p>}
                    </div>
                    <div className="md:col-span-2"></div> {/* Spacer */}
                    <FormInput name="guarantorFullName" label="Full Name *" register={register} errors={errors} icon={User} placeholder="Enter guarantor full name" isMissing={missingFields.includes('guarantorFullName')} />
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${missingFields.includes('guarantorGender') ? 'text-red-600' : 'text-gray-700'}`}>Gender *</label>
                        <div className="flex space-x-6 mt-3">
                            {['male', 'female', 'other'].map(g => <label key={g} className="inline-flex items-center cursor-pointer group"><input type="radio" value={g} {...register('guarantorGender')} className="h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer" /><span className="ml-2.5 capitalize font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{g}</span></label>)}
                        </div>
                        {errors.guarantorGender && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.guarantorGender.message}</p>}
                        {missingFields.includes('guarantorGender') && !errors.guarantorGender && <p className="mt-1.5 text-sm text-red-600 font-medium">This field is required</p>}
                    </div>
                    <FormInput name="guarantorMobile" label="Mobile Number *" type="tel" register={register} errors={errors} icon={Phone} maxLength={10} placeholder="10-digit number" isMissing={missingFields.includes('guarantorMobile')} />
                    <FormInput name="guarantorWorkingAddress" label="Working Address *" register={register} errors={errors} icon={Briefcase} placeholder="Enter working address" isMissing={missingFields.includes('guarantorWorkingAddress')} />
                    <AddressFields register={register} errors={errors} isOpen={isAddressOpen} toggle={() => setIsAddressOpen(!isAddressOpen)} prefix="guarantor" missingFields={missingFields} />
                    <FileInput name="guarantorPhoto" label="Live Photo Upload *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('guarantorPhoto')} />
                    <FormInput name="guarantorAadharNumber" label="Aadhar Number *" register={register} errors={errors} icon={CreditCard} maxLength={12} placeholder="12-digit number" isMissing={missingFields.includes('guarantorAadharNumber')} />
                    <FileInput name="guarantorAadharFront" label="Aadhar Front Photo *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('guarantorAadharFront')} />
                    <FileInput name="guarantorAadharBack" label="Aadhar Back Photo *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('guarantorAadharBack')} />
                    <FormInput name="referenceName" label="Reference Name" register={register} errors={errors} icon={User} placeholder="Enter reference name" isMissing={missingFields.includes('referenceName')} />
                    <FormInput name="referenceNumber" label="Reference Mobile Number" type="tel" register={register} errors={errors} icon={Phone} maxLength={10} placeholder="10-digit number" isMissing={missingFields.includes('referenceNumber')} />
                </div>
            </div>
        );
      case 3: // Product Details
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${missingFields.includes('category') ? 'text-red-600' : 'text-gray-700'}`}>Category *</label>
                <select {...register('category')} className={`w-full rounded-lg border-2 py-2.5 px-3 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${missingFields.includes('category') ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-400 hover:border-gray-300'}`}>
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="appliances">Home Appliances</option>
                  <option value="mobile">Mobile</option>
                </select>
                {errors.category && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.category.message}</p>}
                {missingFields.includes('category') && !errors.category && <p className="mt-1.5 text-sm text-red-600 font-medium">This field is required</p>}
              </div>
              <FormInput name="productName" label="Product Name *" register={register} errors={errors} icon={Briefcase} isMissing={missingFields.includes('productName')} />
              <FormInput name="productCompany" label="Product Company *" register={register} errors={errors} icon={Building} isMissing={missingFields.includes('productCompany')} />
              <FormInput name="price" label="Price (Max ₹20,000) *" type="number" register={register} errors={errors} icon={Banknote} min={1} max={20000} isMissing={missingFields.includes('price')} />
              <FormInput name="serialNumber" label="Serial Number *" register={register} errors={errors} icon={Hash} isMissing={missingFields.includes('serialNumber')} />
              <FormInput name="securityKey" label="Security Key" register={register} errors={errors} icon={Hash} placeholder="Enter security key" isMissing={missingFields.includes('securityKey')} />
              <div>
                <label className={`block text-sm font-semibold mb-2 ${missingFields.includes('tenure') ? 'text-red-600' : 'text-gray-700'}`}>Tenure *</label>
                <select
                  {...register('tenure')}
                  className={`w-full rounded-lg border-2 py-2.5 px-3 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${missingFields.includes('tenure') ? 'border-red-400 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-400 hover:border-gray-300'}`}
                >
                  <option value="">Select Tenure</option>
                  <option value="3">3 months</option>
                  <option value="4">4 months</option>
                  <option value="5">5 months</option>
                  <option value="6">6 months</option>
                  <option value="7">7 months</option>
                  <option value="8">8 months</option>
                </select>
                {errors.tenure && <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.tenure.message}</p>}
                {missingFields.includes('tenure') && !errors.tenure && <p className="mt-1.5 text-sm text-red-600 font-medium">This field is required</p>}
              </div>
              <FormInput name="emiStartDate" label="EMI Start Date (Backdate Allowed)" type="date" register={register} errors={errors} icon={Calendar} isMissing={missingFields.includes('emiStartDate')} />
              <FormInput name="downPayment" label={`Down Payment (Min ₹${minDownPayment.toLocaleString()} - 25%)`} type="number" register={register} errors={errors} icon={Banknote} min={minDownPayment} max={price} isMissing={missingFields.includes('downPayment')} />
            </div>
            {price > 0 && (
              <div className="md:col-span-2 mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <h3 className="text-lg font-medium mb-3">EMI Schedule Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Product Price:</span><span>₹{price.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Down Payment {customDownPayment && customDownPayment > minDownPayment ? `(${((customDownPayment / price) * 100).toFixed(1)}%)` : '(25%)'}:</span><span>- ₹{downPayment.toLocaleString()}</span></div>
                  {customDownPayment && customDownPayment > minDownPayment && (
                    <div className="flex justify-between text-green-600 text-xs"><span>Additional Down Payment:</span><span>+ ₹{(customDownPayment - minDownPayment).toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-2"><span className="text-gray-800">Loan Amount:</span><span>₹{loanAmount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Monthly EMI ({tenure} months @ {(interest * 100).toFixed(2)}%):</span><span>₹{emi.toLocaleString()}</span></div>
                  <div className="flex justify-between text-red-600"><span className="text-gray-600">File Charge (1st EMI):</span><span>+ ₹{fileCharge.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span className="text-gray-800">First EMI Total:</span><span>₹{(emi + fileCharge).toLocaleString()}</span></div>
                </div>
              </div>
            )}
          </div>
        );
      case 4: // Signature Upload
        const summaryData = { ...allFormData, ...watch() };
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">Signature Upload</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <FileInput name="signature" label="Signature Upload *" register={register} errors={errors} resetKey={resetKey} isMissing={missingFields.includes('signature')} />
              </div>
            </div>

            <div className="border rounded-md bg-white shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3">Confirm Details Before Submit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">Client Details</p>
                  <p className="text-gray-700">Name: <span className="font-medium">{formatSummaryValue(summaryData.fullName)}</span></p>
                  <p className="text-gray-700">Mobile: <span className="font-medium">{formatSummaryValue(summaryData.mobile)}</span></p>
                  <p className="text-gray-700">Working Address: <span className="font-medium">{formatSummaryValue(summaryData.workingAddress)}</span></p>
                  <p className="text-gray-700">Aadhar: <span className="font-medium">{formatSummaryValue(summaryData.aadharNumber)}</span></p>
                  <p className="text-gray-700">PAN: <span className="font-medium">{formatSummaryValue(summaryData.panNumber)}</span></p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">Guarantor Details</p>
                  <p className="text-gray-700">Name: <span className="font-medium">{formatSummaryValue(summaryData.guarantorFullName)}</span></p>
                  <p className="text-gray-700">Mobile: <span className="font-medium">{formatSummaryValue(summaryData.guarantorMobile)}</span></p>
                  <p className="text-gray-700">Working Address: <span className="font-medium">{formatSummaryValue(summaryData.guarantorWorkingAddress)}</span></p>
                  <p className="text-gray-700">Relation: <span className="font-medium">{formatSummaryValue(summaryData.relation)}</span></p>
                  <p className="text-gray-700">Aadhar: <span className="font-medium">{formatSummaryValue(summaryData.guarantorAadharNumber)}</span></p>
                  <p className="text-gray-700">Reference Name: <span className="font-medium">{formatSummaryValue(summaryData.referenceName)}</span></p>
                  <p className="text-gray-700">Reference Number: <span className="font-medium">{formatSummaryValue(summaryData.referenceNumber)}</span></p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">Product Details</p>
                  <p className="text-gray-700">Category: <span className="font-medium">{formatSummaryValue(summaryData.category)}</span></p>
                  <p className="text-gray-700">Product: <span className="font-medium">{formatSummaryValue(summaryData.productName)}</span></p>
                  <p className="text-gray-700">Company: <span className="font-medium">{formatSummaryValue(summaryData.productCompany)}</span></p>
                  <p className="text-gray-700">Price: <span className="font-medium">{formatSummaryValue(summaryData.price)}</span></p>
                  <p className="text-gray-700">Serial Number: <span className="font-medium">{formatSummaryValue(summaryData.serialNumber)}</span></p>
                  <p className="text-gray-700">Security Key: <span className="font-medium">{formatSummaryValue(summaryData.securityKey)}</span></p>
                  <p className="text-gray-700">Tenure (months): <span className="font-medium">{formatSummaryValue(summaryData.tenure)}</span></p>
                  <p className="text-gray-700">EMI Start Date: <span className="font-medium">{formatSummaryValue(summaryData.emiStartDate)}</span></p>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">Bank Details</p>
                  <p className="text-gray-700">Bank Name: <span className="font-medium">{formatSummaryValue(summaryData.bankName)}</span></p>
                  <p className="text-gray-700">Account No.: <span className="font-medium">{formatSummaryValue(summaryData.accountNumber)}</span></p>
                  <p className="text-gray-700">IFSC: <span className="font-medium">{formatSummaryValue(summaryData.ifscCode)}</span></p>
                  <p className="text-gray-700">Payment Mode: <span className="font-medium">{formatSummaryValue(summaryData.paymentMode)}</span></p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Please review all details above. Fields showing "Not Filled" will be treated as empty for this application.
              </p>
            </div>
          </div>
        );
      case 5: // Preview & Confirmation
        const previewData = { ...allFormData, ...watch() };
        return (
          <div id="print-section" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Review Your Application</h2>
              <p className="text-gray-600 mt-1">Please verify all details before final submission</p>
            </div>

            {/* Client Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.fullName)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Father's / Spouse Name</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.fatherOrSpouseName)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</p>
                    <p className="text-base font-medium text-gray-900 mt-1 capitalize">{formatSummaryValue(previewData.gender)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.mobile)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Working Address</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.workingAddress)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aadhar Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.aadharNumber)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PAN Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.panNumber)}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Permanent Address</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p className="text-gray-700"><span className="font-medium">House No:</span> {formatSummaryValue(previewData.houseNo)}</p>
                    <p className="text-gray-700"><span className="font-medium">Gali No:</span> {formatSummaryValue(previewData.galiNo)}</p>
                    <p className="text-gray-700"><span className="font-medium">Colony:</span> {formatSummaryValue(previewData.colony)}</p>
                    <p className="text-gray-700"><span className="font-medium">Landmark:</span> {formatSummaryValue(previewData.landmark)}</p>
                    <p className="text-gray-700"><span className="font-medium">City:</span> {formatSummaryValue(previewData.city)}</p>
                    <p className="text-gray-700"><span className="font-medium">Pincode:</span> {formatSummaryValue(previewData.pincode)}</p>
                    <p className="text-gray-700"><span className="font-medium">State:</span> {formatSummaryValue(previewData.state)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guarantor Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Guarantor Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Relation</p>
                    <p className="text-base font-medium text-gray-900 mt-1 capitalize">{formatSummaryValue(previewData.relation)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.guarantorFullName)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gender</p>
                    <p className="text-base font-medium text-gray-900 mt-1 capitalize">{formatSummaryValue(previewData.guarantorGender)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mobile Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.guarantorMobile)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Working Address</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.guarantorWorkingAddress)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aadhar Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.guarantorAadharNumber)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference Name</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.referenceName)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.referenceNumber)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</p>
                    <p className="text-base font-medium text-gray-900 mt-1 capitalize">{formatSummaryValue(previewData.category)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.productName)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.productCompany)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Serial Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.serialNumber)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Security Key</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.securityKey)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</p>
                    <p className="text-base font-medium text-gray-900 mt-1">₹{previewData.price ? parseInt(previewData.price).toLocaleString() : 'Not Filled'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tenure (Months)</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.tenure)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">EMI Start Date</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.emiStartDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Bank Information</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bank Name</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.bankName)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Number</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.accountNumber)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IFSC Code</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{formatSummaryValue(previewData.ifscCode)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Mode</p>
                    <p className="text-base font-medium text-gray-900 mt-1 capitalize">{formatSummaryValue(previewData.paymentMode?.replace('_', ' '))}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            {previewData.price > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Product Price:</span>
                      <span className="font-semibold text-gray-900">₹{parseInt(previewData.price).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Down Payment {previewData.downPayment && parseInt(previewData.downPayment) > Math.ceil(parseInt(previewData.price) * 0.25) ? `(${((parseInt(previewData.downPayment) / parseInt(previewData.price)) * 100).toFixed(1)}%)` : '(25%)'}:</span>
                      <span className="font-semibold text-gray-900">- ₹{(previewData.downPayment ? parseInt(previewData.downPayment) : Math.ceil(parseInt(previewData.price) * 0.25)).toLocaleString()}</span>
                    </div>
                    {previewData.downPayment && parseInt(previewData.downPayment) > Math.ceil(parseInt(previewData.price) * 0.25) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 text-green-600 text-xs">
                        <span>Additional Down Payment:</span>
                        <span>+ ₹{(parseInt(previewData.downPayment) - Math.ceil(parseInt(previewData.price) * 0.25)).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-blue-50 px-3 rounded">
                      <span className="text-gray-700 font-medium">Loan Amount:</span>
                      <span className="font-bold text-lg text-blue-600">₹{(parseInt(previewData.price) - (previewData.downPayment ? parseInt(previewData.downPayment) : Math.ceil(parseInt(previewData.price) * 0.25))).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Monthly EMI ({previewData.tenure} months @ {(interest * 100).toFixed(2)}%):</span>
                      <span className="font-semibold text-gray-900">₹{emi.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">File Charge (1st EMI):</span>
                      <span className="font-semibold text-red-600">+ ₹{fileCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded font-bold text-lg">
                      <span className="text-gray-800">First EMI Total:</span>
                      <span className="text-green-600">₹{(emi + fileCharge).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Application Mode Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Application Mode</p>
                    <p className="text-base font-medium text-gray-900 mt-1 capitalize">{applicationMode === 'self' ? 'Self Loan' : 'Max Born Group'}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-semibold text-white ${applicationMode === 'self' ? 'bg-blue-600' : 'bg-green-600'}`}>
                    {applicationMode === 'self' ? 'Self' : 'Max Born Group'}
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Eligibility Notice</p>
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">कस्टमर द्वारा भुगतान पूरा न करने के कारण आप (गारंटर) ऋण स्वीकृति या गारंटर बनने के लिए पात्र नहीं हैं।</span>
                    <br />
                    <span className="font-semibold">You (Guarantor) are not eligible for loan approval or to act as a guarantor due to incomplete or pending payment by the customer.</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="border-l-4 border-orange-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">1. Mobile Loss or Theft</p>
                    <p className="text-sm text-gray-700 mt-1">
                      मोबाइल खोने या चोरी होने पर कंपनी की कोई गारंटी नहीं होगी
                    </p>
                    <p className="text-xs text-gray-600 mt-2">The company will not provide any guarantee in case of mobile loss or theft.</p>
                    <div className="mt-3 flex items-center space-x-2">
                      <input type="checkbox" id="tc1" className="h-4 w-4 text-blue-600 rounded" />
                      <label htmlFor="tc1" className="text-xs text-gray-700">I agree to this term</label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Sign: _______________</p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">2. Late EMI Penalty</p>
                    <p className="text-sm text-gray-700 mt-1">
                      मोबाइल किस्त लेट होने पर पेनल्टी चार्ज होगी
                    </p>
                    <p className="text-xs text-gray-600 mt-2">Penalty charges will be applicable if EMI payment is delayed.</p>
                    <div className="mt-3 flex items-center space-x-2">
                      <input type="checkbox" id="tc2" className="h-4 w-4 text-blue-600 rounded" />
                      <label htmlFor="tc2" className="text-xs text-gray-700">I agree to this term</label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Sign: _______________</p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">3. Mobile Damage Service</p>
                    <p className="text-sm text-gray-700 mt-1">
                      मोबाइल खराब होने पर यूजर को सर्विस सेल्फ सेंटर जाना होगा
                    </p>
                    <p className="text-xs text-gray-600 mt-2">In case of mobile damage, the user must visit the authorized service center for repairs.</p>
                    <div className="mt-3 flex items-center space-x-2">
                      <input type="checkbox" id="tc3" className="h-4 w-4 text-blue-600 rounded" />
                      <label htmlFor="tc3" className="text-xs text-gray-700">I agree to this term</label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Sign: _______________</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Note:</span> By proceeding, you acknowledge and agree to all the terms and conditions mentioned above. Please ensure all checkboxes are marked and signed before submission.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">✓ Please review all details carefully.</span> Once you confirm, this application will be submitted to the system. You can edit details by going back to previous steps.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // PAGE 1: Aadhar Status Check
  const renderAadharPage = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Check Loan Status</h1>
          <p className="text-gray-600 mt-2">Enter your Aadhar number to check existing loans</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Aadhar Number</label>
            <input
              type="text"
              maxLength={12}
              value={aadhaarInput}
              onChange={(e) => setAadhaarInput(e.target.value)}
              placeholder="Enter 12-digit Aadhar Number"
              className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCheckAadhaar}
              className="flex-1 px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md transition transform hover:scale-105"
            >
              Check Status
            </button>
            <button
              type="button"
              onClick={handleSkipAadhaarCheck}
              className="flex-1 px-6 py-3 rounded-lg text-gray-700 font-semibold border-2 border-gray-300 bg-white hover:bg-gray-50 transition"
            >
              Add Customer
            </button>
          </div>

          {/* <div className="flex gap-4">
            <button
             type="button"
              onClick={handleAddExistingCustomer}
              className="flex-1 px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md transition transform hover:scale-105"
            >
              Add Existing Customer
            </button>
          </div> */}

          {aadhaarSearched && (
            <div className="border-t-2 pt-6 mt-6 space-y-4">
              {aadhaarMatches.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 text-lg">✓ No existing loans found for this Aadhar number</p>
                  <p className="text-gray-500 text-sm mt-2">You can proceed with a new loan application</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-semibold text-gray-800 text-lg">Found {aadhaarMatches.length} loan(s):</p>
                  {aadhaarMatches.map((loan) => {
                    const paymentsCount = (loan.payments?.length || loan.emisPaid || 0);
                    const tenure = loan.tenure || (loan.emisPaid || 0) + (loan.emisRemaining || 0) || paymentsCount;
                    const remaining = Math.max(
                      loan.emisRemaining != null ? loan.emisRemaining : tenure - paymentsCount,
                      0
                    );
                    const isCompleted = loan.status === 'Paid' || remaining === 0;
                    const isOverdue = loan.status === 'Overdue';
                    const hasLateEmis = (loan.penalties && loan.penalties.length > 0);
                    const isHistoryOpen = remaining > 0 && !isOverdue;

                    return (
                      <div
                        key={loan.id}
                        className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900 text-lg">Loan ID: {loan.loanId}</p>
                            <p className="text-gray-600 mt-1">Amount: <span className="font-semibold">₹{(loan.loanAmount || 0).toLocaleString()}</span></p>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${isCompleted ? 'bg-green-600' : isOverdue ? 'bg-red-600' : 'bg-blue-600'}`}>
                              {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : loan.status || 'Active'}
                            </span>
                            {isHistoryOpen && (
                              <span className="px-2 py-1 rounded text-xs font-semibold text-blue-700 bg-blue-100">
                                History Open
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total EMIs</p>
                            <p className="font-semibold text-gray-900">{tenure}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">EMIs Paid</p>
                            <p className="font-semibold text-green-600">{paymentsCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Remaining</p>
                            <p className="font-semibold text-orange-600">{remaining}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Late EMI</p>
                            <p className={`font-semibold ${hasLateEmis ? 'text-red-600' : 'text-green-600'}`}>
                              {hasLateEmis ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // PAGE 2: Mode Selection
  const renderModePage = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setStage('aadhar')}
          className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Select Loan Type</h1>
          <p className="text-gray-600 mt-2">Choose how you want to apply for a loan</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleModeSelection('max_born_group')}
            className="w-full p-8 rounded-xl border-2 border-gray-200 bg-white hover:border-green-500 hover:bg-green-50 transition shadow-md hover:shadow-lg"
          >
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-900">Max Born Group</h2>
              <p className="text-gray-600 mt-2">Apply with guarantor and complete documentation</p>
              <div className="mt-4 space-y-1 text-sm text-gray-700">
                <p>✓ Requires guarantor details</p>
                <p>✓ All fields mandatory</p>
                <p>✓ Higher loan amount eligible</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleModeSelection('self')}
            className="w-full p-8 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition shadow-md hover:shadow-lg"
          >
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-900">Self Loan</h2>
              <p className="text-gray-600 mt-2">Quick application with minimal requirements</p>
              <div className="mt-4 space-y-1 text-sm text-gray-700">
                <p>✓ Only Aadhar number required</p>
                <p>✓ Most fields optional</p>
                <p>✓ Fast approval process</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // PAGE 3+: Form Steps
  const renderFormPage = () => (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setStage('mode')}
          className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">New Loan Application</h1>
            <p className="text-gray-600 text-sm">Complete the form to apply for a loan</p>
          </div>
          <div className={`px-5 py-2.5 rounded-full font-bold text-white text-sm shadow-lg bg-gradient-to-r from-green-600 to-emerald-600`}>
            {applicationMode === 'self' ? '🔵 Self Loan' : '🟢 Max Born Group'}
          </div>
        </div>
        
        {/* Stepper */}
        <div className="flex items-center mb-10 mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          {steps.map((item, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-md ${step >= index ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white scale-110' : 'bg-gray-100 text-gray-400'}`}>
                  {index + 1}
                </div>
                <p className={`text-xs mt-2 text-center font-medium transition-all duration-200 ${step >= index ? 'text-blue-600' : 'text-gray-400'}`}>{item.name}</p>
              </div>
              {index < steps.length - 1 && <div className={`flex-1 h-1.5 mx-3 rounded-full transition-all duration-300 ${step > index ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gray-200'}`}></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-8 text-gray-900 pb-3 border-b-2 border-gray-100">{steps[step].name}</h2>
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex justify-between gap-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0}
                className="inline-flex items-center px-8 py-3 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Previous
              </button>

              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-lg shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              ) : step === steps.length - 1 ? (
                <div className="flex gap-3 no-print">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-sm font-semibold rounded-lg shadow-md text-blue-600 bg-white hover:bg-blue-50 transition-all duration-200"
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Submit button clicked on step:', step);
                      onSubmit(watch());
                    }}
                    className="inline-flex items-center px-10 py-3 border border-transparent text-base font-bold rounded-lg shadow-xl text-white bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105"
                  >
                    ✓ Confirm & Submit Application
                  </button>
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Render based on stage
  if (stage === 'aadhar') {
    return renderAadharPage();
  } else if (stage === 'mode') {
    return renderModePage();
  } else {
    return renderFormPage();
  }
}
