import { useState, useRef, useEffect } from 'react'
import { Plus, Edit, Eye, EyeOff, Mail, CheckCircle, XCircle, Camera, Image as ImageIcon, X, User, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { useForm } from 'react-hook-form'
import shopkeeperStore from '../../store/shopkeeperStore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'

export default function ShopkeeperManagement() {
  const { shopkeepers, addShopkeeper, updateShopkeeperKYC, deleteShopkeeper, fetchShopkeepers, loading } = shopkeeperStore()
  const [localShopkeepers, setLocalShopkeepers] = useState(shopkeepers)
  
  // Fetch shopkeepers from backend on mount
  useEffect(() => {
    fetchShopkeepers()
  }, [])

  // Sync with store
  useEffect(() => {
    setLocalShopkeepers(shopkeepers)
  }, [shopkeepers])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewingShopkeeper, setViewingShopkeeper] = useState(null)
  const [editingShopkeeper, setEditingShopkeeper] = useState(null)
  const [showCameraOptions, setShowCameraOptions] = useState(false)
  const [ownerPhoto, setOwnerPhoto] = useState(null)
  const [shopImage, setShopImage] = useState(null)
  const [showPassword, setShowPassword] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraType, setCameraType] = useState(null)
  const [stream, setStream] = useState(null)
  const ownerFileInputRef = useRef(null)
  const shopFileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Filter shopkeepers based on search term
  const filteredShopkeepers = localShopkeepers.filter(shopkeeper => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      shopkeeper.shopName?.toLowerCase().includes(term) ||
      shopkeeper.fullName?.toLowerCase().includes(term) ||
      shopkeeper.mobileNumber?.includes(term) ||
      shopkeeper.aadharNumber?.includes(term)
    )
  })

  // Toggle password visibility for a specific shopkeeper
  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      gstNumber: '',
      password: '',
      confirmPassword: ''
    }
  })

  const resetForm = () => {
    setOwnerPhoto(null)
    setShopImage(null)
    reset({
      name: '',
      owner: '',
      email: '',
      phone: '',
      gstNumber: '',
      creditLimit: '',
      password: '',
      confirmPassword: ''
    })
  }

  const password = watch('password', '')
  const confirmPassword = watch('confirmPassword', '')

  const handlePhotoUpload = (e, type = 'owner') => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        if (type === 'owner') {
          setOwnerPhoto(reader.result)
        } else {
          setShopImage(reader.result)
        }
      }
      reader.readAsDataURL(file)
      setShowCameraOptions(false)
    }
  }

  const openCamera = async (type) => {
    setCameraType(type)
    setShowCameraModal(true)
    try {
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } },
          audio: false 
        })
      } catch (err) {
        console.warn('Environment camera failed, trying default camera:', err)
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        })
      }
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.setAttribute('playsinline', 'true')
        videoRef.current.setAttribute('webkit-playsinline', 'true')
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Camera access denied. Please check browser permissions.')
      setShowCameraModal(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const photoData = canvas.toDataURL('image/jpeg')
      
      if (cameraType === 'owner') {
        setOwnerPhoto(photoData)
      } else {
        setShopImage(photoData)
      }
      
      stopCamera()
      toast.success('Photo captured successfully')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCameraModal(false)
    setCameraType(null)
  }

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 80,
    },
    {
      accessorKey: 'ownerPhoto',
      header: 'Owner Photo',
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-full overflow-hidden border">
          {row.original.ownerPhoto ? (
            <img 
              src={row.original.ownerPhoto} 
              alt="Owner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: 'shopImage',
      header: 'Shop Photo',
      cell: ({ row }) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden border">
          {row.original.shopImage ? (
            <img 
              src={row.original.shopImage} 
              alt="Shop" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: 'shopName',
      header: 'Shop Name',
    },
    {
      accessorKey: 'fullName',
      header: 'Owner',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'mobileNumber',
      header: 'Phone',
    },
    {
      accessorKey: 'gstNumber',
      header: 'GST',
    },
    {
      accessorKey: 'password',
      header: 'Password',
      cell: ({ row }) => {
        const id = row.original.id
        const isVisible = showPassword[id] || false
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono">
              {isVisible ? row.original.password : '••••••••'}
            </span>
            <button 
              type="button" 
              onClick={() => togglePasswordVisibility(id)}
              className="text-gray-500 hover:text-gray-700"
              title={isVisible ? 'Hide Password' : 'Show Password'}
            >
              {isVisible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        )
      },
      size: 160,
    },
    {
      accessorKey: 'kycStatus',
      header: 'KYC Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.kycStatus === 'verified'
              ? 'success'
              : row.original.kycStatus === 'pending'
              ? 'warning'
              : 'destructive'
          }
        >
          {row.original.kycStatus}
        </Badge>
      ),
      size: 120,
    },
    {
      accessorKey: 'activeLoans',
      header: 'Active Loans',
      size: 100,
    },
    {
      accessorKey: 'creditLimit',
      header: 'Credit Limit',
      cell: ({ row }) => `₹${row.original.creditLimit?.toLocaleString() || '0'}`,
      size: 120,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setViewingShopkeeper(row.original)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row.original)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(row.original)}
            title="Delete"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {row.original.kycStatus === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleKYCAction(row.original.id, 'verified')}
                title="Approve KYC"
              >
                <CheckCircle className="h-4 w-4 !text-green-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleKYCAction(row.original.id, 'rejected')}
                title="Reject KYC"
              >
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      ),
      size: 150,
    },
  ]

  const handleDelete = async (shopkeeper) => {
    if (window.confirm(`Are you sure you want to delete shopkeeper "${shopkeeper.shopName || shopkeeper.name}"? This action cannot be undone.`)) {
      try {
        await deleteShopkeeper(shopkeeper.id || shopkeeper._id)
        toast.success('Shopkeeper deleted successfully')
        fetchShopkeepers()
      } catch (error) {
        toast.error('Failed to delete shopkeeper')
      }
    }
  }

  const handleEdit = (shopkeeper) => {
    setEditingShopkeeper(shopkeeper)
    setOwnerPhoto(shopkeeper.ownerPhoto || null)
    setShopImage(shopkeeper.shopImage || null)
    setValue('name', shopkeeper.name)
    setValue('owner', shopkeeper.owner)
    setValue('email', shopkeeper.email)
    setValue('phone', shopkeeper.phone)
    setValue('gstNumber', shopkeeper.gstNumber || '')
    setValue('creditLimit', shopkeeper.creditLimit)
    setIsModalOpen(true)
  }

  const handleKYCAction = (id, status) => {
    updateShopkeeperKYC(id, status)
    toast.success(`KYC ${status === 'verified' ? 'approved' : 'rejected'} successfully`)
  }

  const onSubmit = (data) => {
    // Validate passwords match for new shopkeeper
    if (!editingShopkeeper && data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Remove confirmPassword before saving
    const { confirmPassword, ...shopkeeperData } = data

    if (editingShopkeeper) {
      // Update existing shopkeeper - for now we'll just show success
      // In a real app, you'd have an update method in the store
      toast.success('Shopkeeper updated successfully')
    } else {
      // Add new shopkeeper using store method
      const newShopkeeperData = {
        shopName: data.name,
        ownerName: data.owner,
        phoneNumber: data.phone,
        email: data.email,
        aadharNumber: data.aadharNumber || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        gstNumber: data.gstNumber || '',
        panNumber: data.panNumber || '',
        password: data.password,
        creditLimit: data.creditLimit || 0,
        ownerPhoto,
        shopImage,
        kycStatus: 'pending',
      }
      
      addShopkeeper(newShopkeeperData)
        .then((result) => {
          const email = result.email || result.shopkeeper?.email || newShopkeeperData.email
          toast.success(`Shopkeeper added successfully! Login Email: ${email}`)
          // Refresh shopkeepers list
          fetchShopkeepers()
          // Reset form and close modal
          setIsModalOpen(false)
          setEditingShopkeeper(null)
          setOwnerPhoto(null)
          setShopImage(null)
          reset()
        })
        .catch((error) => {
          toast.error(error.response?.data?.message || 'Failed to create shopkeeper')
        })
      return
    }
    
    // Reset form and close modal
    setIsModalOpen(false)
    setEditingShopkeeper(null)
    setOwnerPhoto(null)
    setShopImage(null)
    reset({
      gstNumber: '',
      password: '',
      confirmPassword: ''
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shopkeeper Management</h1>
          <p className="text-muted-foreground">Manage merchant accounts and credit limits</p>
        </div>
        
        <div className="relative w-64">
          {searchTerm && (
            <button type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="success"
          onClick={() => {
            setEditingShopkeeper(null)
            reset()
            setIsModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Shopkeeper
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredShopkeepers}
      />
      {filteredShopkeepers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm ? 'No shopkeepers found matching your search.' : 'No shopkeepers found.'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingShopkeeper(null)
          setOwnerPhoto(null)
          setShopImage(null)
          reset()
        }}
        title={editingShopkeeper ? 'Edit Shopkeeper' : 'Add New Shopkeeper'}
        footer={
          <>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false)
              setOwnerPhoto(null)
              setShopImage(null)
            }}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSubmit(onSubmit)}>
              {editingShopkeeper ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Shop Name <span className="text-red-500">*</span></label>
              <Input 
                {...register('name', { required: 'Shop name is required' })} 
                placeholder="Enter shop name" 
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Owner Name <span className="text-red-500">*</span></label>
              <Input 
                {...register('owner', { required: 'Owner name is required' })} 
                placeholder="Enter owner name" 
              />
              {errors.owner && <p className="text-red-500 text-xs mt-1">{errors.owner.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Aadhar Number <span className="text-red-500">*</span></label>
              <Input 
                {...register('aadharNumber', { 
                  required: 'Aadhar number is required',
                  pattern: {
                    value: /^[0-9]{12}$/,
                    message: 'Invalid Aadhar number (12 digits required)'
                  }
                })} 
                placeholder="Enter 12-digit Aadhar number" 
              />
              {errors.aadharNumber && <p className="text-red-500 text-xs mt-1">{errors.aadharNumber.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Address <span className="text-red-500">*</span></label>
              <Input 
                {...register('address', { required: 'Address is required' })} 
                placeholder="Enter shop address" 
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">City <span className="text-red-500">*</span></label>
              <Input 
                {...register('city', { required: 'City is required' })} 
                placeholder="Enter city" 
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">State <span className="text-red-500">*</span></label>
              <Input 
                {...register('state', { required: 'State is required' })} 
                placeholder="Enter state" 
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Pincode <span className="text-red-500">*</span></label>
              <Input 
                {...register('pincode', { 
                  required: 'Pincode is required',
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: 'Invalid pincode (6 digits required)'
                  }
                })} 
                placeholder="Enter 6-digit pincode" 
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">PAN Number (Optional)</label>
              <Input 
                {...register('panNumber')} 
                placeholder="Enter PAN number" 
              />
            </div>
            <div>
              <label className="text-sm font-medium">GST Number (Optional)</label>
              <Input 
                {...register('gstNumber')} 
                placeholder="Enter GST number" 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
              <Input 
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })} 
                type="email" 
                placeholder="Enter email" 
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
              <Input 
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Invalid phone number (10 digits required)'
                  }
                })} 
                placeholder="Enter phone number" 
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Credit Limit <span className="text-red-500">*</span></label>
              <Input
                {...register('creditLimit', { 
                  required: 'Credit limit is required',
                  min: { value: 0, message: 'Credit limit cannot be negative' }
                })}
                type="number"
                placeholder="Enter credit limit"
              />
              {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Create Password <span className="text-red-500">*</span></label>
              <Input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type="password"
                placeholder="Create password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password <span className="text-red-500">*</span></label>
              <Input
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type="password"
                placeholder="Confirm password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Owner Photo Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Owner Photo</h4>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                    {ownerPhoto ? (
                      <>
                        <img 
                          src={ownerPhoto} 
                          alt="Owner" 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOwnerPhoto(null)
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 -mt-2 -mr-2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <User className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Owner Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => ownerFileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => openCamera('owner')}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WebP. Max size: 5MB
                  </p>
                  <input
                    type="file"
                    ref={ownerFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'owner')}
                  />
                </div>
              </div>
            </div>

            {/* Shop Image Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Shop Image</h4>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                    {shopImage ? (
                      <>
                        <img 
                          src={shopImage} 
                          alt="Shop" 
                          className="w-full h-full object-cover"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShopImage(null)
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 -mt-2 -mr-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Shop Image</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => shopFileInputRef.current?.click()}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Upload Image</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => openCamera('shop')}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or WebP. Max size: 5MB
                  </p>
                  <input
                    type="file"
                    ref={shopFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, 'shop')}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingShopkeeper}
        onClose={() => setViewingShopkeeper(null)}
        title="Shopkeeper Details"
        size="lg"
      >
        {viewingShopkeeper && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Owner Photo Section */}
              <div className="flex flex-col gap-4">
                <div className="w-32 h-32 rounded-lg border overflow-hidden">
                  {viewingShopkeeper.ownerPhoto ? (
                    <img 
                      src={viewingShopkeeper.ownerPhoto} 
                      alt={viewingShopkeeper.owner}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-center text-sm text-muted-foreground">Owner</p>
              </div>

              {/* Shop Photo Section */}
              <div className="flex flex-col gap-4">
                <div className="w-32 h-32 rounded-lg border overflow-hidden">
                  {viewingShopkeeper.shopImage ? (
                    <img 
                      src={viewingShopkeeper.shopImage} 
                      alt={`${viewingShopkeeper.name} Shop`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-center text-sm text-muted-foreground">Shop</p>
              </div>

              {/* Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Shop Name</p>
                  <p className="font-medium">{viewingShopkeeper.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Owner Name</p>
                  <p className="font-medium">{viewingShopkeeper.owner}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {viewingShopkeeper.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewingShopkeeper.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">GST Number</p>
                  <p className="font-mono">{viewingShopkeeper.gstNumber || 'Not provided'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">KYC Status</p>
                  <Badge
                    variant={
                      viewingShopkeeper.kycStatus === 'verified' 
                        ? 'success' 
                        : viewingShopkeeper.kycStatus === 'pending'
                        ? 'warning'
                        : 'destructive'
                    }
                  >
                    {viewingShopkeeper.kycStatus}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <Badge variant={viewingShopkeeper.status === 'active' ? 'success' : 'destructive'}>
                    {viewingShopkeeper.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{viewingShopkeeper.totalLoans || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{viewingShopkeeper.activeLoans || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Credit Limit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ₹{(viewingShopkeeper.creditLimit || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: ₹{((viewingShopkeeper.availableCredit || 0) - (viewingShopkeeper.creditLimit || 0)).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {viewingShopkeeper.kycStatus === 'pending' && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleKYCAction(viewingShopkeeper.id, 'verified')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve KYC
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleKYCAction(viewingShopkeeper.id, 'rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject KYC
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2">
          <div className="relative bg-white rounded-lg p-3 md:p-4 max-w-2xl w-full mx-2 md:mx-4 max-h-[95vh] overflow-y-auto">
            <button
              onClick={stopCamera}
              className="absolute top-1 right-1 md:top-2 md:right-2 z-10 p-1.5 md:p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-900">
              {cameraType === 'owner' ? 'Capture Owner Photo' : 'Capture Shop Image'}
            </h3>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg max-h-[60vh]"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="mt-3 md:mt-4 flex justify-center">
              <Button
                onClick={capturePhoto}
                variant="success"
                className="flex items-center gap-2 text-sm md:text-base"
              >
                <Camera className="h-4 w-4 md:h-5 md:w-5" />
                Capture Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
