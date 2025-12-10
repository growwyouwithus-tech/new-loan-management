import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { Edit, Trash2, Eye, User, Phone, Mail, MapPin, FileText, Plus } from 'lucide-react'
import customerStore from '../../store/customerStore'
import AddCustomerModal from '../../components/shopkeeper/AddCustomerModal'
import EditCustomerModal from '../../components/shopkeeper/EditCustomerModal'
import { toast } from 'react-toastify'

export default function CustomerList() {
  const { customers, deleteCustomer, updateCustomer, getAllCustomers } = customerStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer)
    setShowEditModal(true)
  }

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const success = deleteCustomer(customerId)
      if (success) {
        toast.success('Customer deleted successfully!')
      } else {
        toast.error('Failed to delete customer')
      }
    }
  }

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer)
    setShowDetailsModal(true)
  }

  const handleCustomerAdded = (newCustomer) => {
    getAllCustomers()
    setShowAddModal(false)
    toast.success('Customer added successfully!')
  }

  const handleCustomerUpdated = (updatedCustomer) => {
    getAllCustomers()
    setShowEditModal(false)
    setSelectedCustomer(null)
    toast.success('Customer updated successfully!')
  }

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.fullName?.toLowerCase().includes(query) ||
      customer.fatherName?.toLowerCase().includes(query) ||
      customer.phoneNumber?.includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.aadharNumber?.includes(query)
    )
  })

  const columns = [
    {
      accessorKey: 'fullName',
      header: 'Full Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.profilePhoto ? (
            <img
              src={row.original.profilePhoto}
              alt={row.original.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <span className="font-medium">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'fatherName',
      header: "Father's Name",
      cell: ({ row }) => row.original.fatherName || 'N/A',
    },
    {
      accessorKey: 'phoneNumber',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-gray-400" />
          <span>{row.original.phoneNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{row.original.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'fullAddress',
      header: 'Address',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 max-w-xs">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm truncate">{row.original.fullAddress || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'aadharNumber',
      header: 'Aadhar',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{row.original.aadharNumber || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return date.toLocaleDateString()
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(row.original)}
            className="hover:bg-blue-50"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditCustomer(row.original)}
            className="hover:bg-yellow-50"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteCustomer(row.original.id)}
            className="hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage all your customers</p>
        </div>
        <Button
          className="!bg-green-500 !hover:bg-green-600 !text-white"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Aadhar</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.aadharNumber).length}
                </p>
              </div>
              <FileText className="h-8 w-8 !text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Added Today</p>
                </div>
                <p className="text-2xl font-bold">
                  {customers.filter(c => {
                    const today = new Date().toDateString()
                    const customerDate = new Date(c.createdAt).toDateString()
                    return today === customerDate
                  }).length}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <Table
              columns={columns}
              data={filteredCustomers}
              searchPlaceholder="Search customers..."
              onSearch={setSearchQuery}
            />
          ) : (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first customer'}
              </p>
              {!searchQuery && (
                <Button
                  className="!bg-green-500 !hover:bg-green-600 !text-white"
                  onClick={() => setShowAddModal(true)}
                >
                  Add Customer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerAdded={handleCustomerAdded}
      />

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCustomer(null)
          }}
          customer={selectedCustomer}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Customer Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-center gap-4">
              {selectedCustomer.profilePhoto ? (
                <img
                  src={selectedCustomer.profilePhoto}
                  alt={selectedCustomer.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{selectedCustomer.fullName}</h3>
                <p className="text-gray-500">Father: {selectedCustomer.fatherName}</p>
                <p className="text-gray-500">Added: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{selectedCustomer.phoneNumber}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>{selectedCustomer.fullAddress || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Address Proof Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address Proof Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCustomer.aadharNumber && (
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>Aadhar: {selectedCustomer.aadharNumber}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedCustomer.profilePhoto && (
                    <div>
                      <p className="text-sm font-medium mb-2">Profile Photo</p>
                      <img
                        src={selectedCustomer.profilePhoto}
                        alt="Profile"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {selectedCustomer.aadharFrontImage && (
                    <div>
                      <p className="text-sm font-medium mb-2">Aadhar Front</p>
                      <img
                        src={selectedCustomer.aadharFrontImage}
                        alt="Aadhar Front"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {selectedCustomer.aadharBackImage && (
                    <div>
                      <p className="text-sm font-medium mb-2">Aadhar Back</p>
                      <img
                        src={selectedCustomer.aadharBackImage}
                        alt="Aadhar Back"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </Modal>
      )}
    </div>
  )
}
