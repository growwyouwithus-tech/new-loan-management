import { useState, useEffect } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import customerStore from '../../store/customerStore'
import { toast } from 'react-toastify'

export default function EditCustomerModal({ isOpen, onClose, customer, onCustomerUpdated }) {
  const { updateCustomer } = customerStore()
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    phoneNumber: '',
    email: '',
    area: '',
    district: '',
    street: '',
    state: '',
    pincode: '',
    aadharNumber: '',
    aadharFrontImage: null,
    aadharBackImage: null,
    profilePhoto: null
  })
  
  const [imagePreviews, setImagePreviews] = useState({
    aadharFront: null,
    aadharBack: null,
    profilePhoto: null
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate form when customer is provided
  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || '',
        fatherName: customer.fatherName || '',
        phoneNumber: customer.phoneNumber || '',
        email: customer.email || '',
        area: customer.area || '',
        district: customer.district || '',
        street: customer.street || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        aadharNumber: customer.aadharNumber || '',
        aadharFrontImage: null,
        aadharBackImage: null,
        profilePhoto: null
      })
      
      setImagePreviews({
        aadharFront: customer.aadharFrontImage || null,
        aadharBack: customer.aadharBackImage || null,
        profilePhoto: customer.profilePhoto || null
      })
    }
  }, [customer])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (e, imageType) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => ({
          ...prev,
          [imageType]: reader.result
        }))
        setFormData(prev => ({
          ...prev,
          [`${imageType}Image`]: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (imageType) => {
    setImagePreviews(prev => ({
      ...prev,
      [imageType]: null
    }))
    setFormData(prev => ({
      ...prev,
      [`${imageType}Image`]: null
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.fullName || !formData.fatherName || !formData.phoneNumber) {
      toast.error('Please fill all required fields')
      return
    }

    if (formData.phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    if (formData.aadharNumber && formData.aadharNumber.length !== 12) {
      toast.error('Aadhar number must be 12 digits')
      return
    }

    setIsSubmitting(true)

    try {
      const customerData = {
        ...formData,
        fullAddress: `${formData.area}, ${formData.street}, ${formData.district}, ${formData.state} - ${formData.pincode}`
      }

      const updatedCustomer = updateCustomer(customer.id, customerData)
      
      if (updatedCustomer) {
        toast.success('Customer updated successfully!')
        onCustomerUpdated?.(updatedCustomer)
        onClose()
      } else {
        toast.error('Failed to update customer')
      }
    } catch (error) {
      toast.error('Failed to update customer')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Customer"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Father Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter father name"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  maxLength={10}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter 10-digit phone number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Area</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter area/colony"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Street/Gali</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter street/gali number"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter district"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  maxLength={6}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter pincode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Proof Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address Proof Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Aadhar Number</label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                maxLength={12}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter 12-digit aadhar number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Profile Photo</label>
                <div className="relative">
                  {imagePreviews.profilePhoto ? (
                    <div className="relative">
                      <img
                        src={imagePreviews.profilePhoto}
                        alt="Profile"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('profilePhoto')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:!border-green-500">
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'profilePhoto')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Aadhar Front</label>
                <div className="relative">
                  {imagePreviews.aadharFront ? (
                    <div className="relative">
                      <img
                        src={imagePreviews.aadharFront}
                        alt="Aadhar Front"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('aadharFront')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:!border-green-500">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Front</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'aadharFront')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Aadhar Back</label>
                <div className="relative">
                  {imagePreviews.aadharBack ? (
                    <div className="relative">
                      <img
                        src={imagePreviews.aadharBack}
                        alt="Aadhar Back"
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('aadharBack')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:!border-green-500">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload Back</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'aadharBack')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="!bg-green-500 !hover:bg-green-600 !text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
