import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { useForm } from 'react-hook-form'
import { userService } from '../../api/userService'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue } = useForm()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await userService.getAllUsers()
      const formattedUsers = response.users.map(user => ({
        id: user.id || user._id,
        name: user.fullName,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
      }))
      setUsers(formattedUsers)
    } catch (error) {
      toast.error('Failed to fetch users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'active' ? 'success' : 'destructive'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const handleEdit = (user) => {
    setEditingUser(user)
    setValue('name', user.name)
    setValue('email', user.email)
    setValue('username', user.username)
    setValue('phoneNumber', user.phoneNumber)
    setValue('role', user.role)
    setValue('status', user.status)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(id)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        toast.error('Failed to delete user')
        console.error('Error deleting user:', error)
      }
    }
  }

  const handleSendInvite = (user) => {
    toast.success(`Invite sent to ${user.email}`)
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.name,
        phoneNumber: data.phoneNumber,
        role: data.role,
        isActive: data.status === 'active',
      }

      if (editingUser) {
        await userService.updateUser(editingUser.id, userData)
        toast.success('User updated successfully')
      } else {
        await userService.createUser(userData)
        toast.success('User created successfully')
      }
      
      setIsModalOpen(false)
      setEditingUser(null)
      reset()
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user')
      console.error('Error saving user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            reset()
            setIsModalOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Table columns={columns} data={users} searchPlaceholder="Search users..." />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingUser(null)
          reset()
        }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input {...register('name', { required: true })} placeholder="Enter full name" />
          </div>
          <div>
            <label className="text-sm font-medium">Username</label>
            <Input {...register('username', { required: true })} placeholder="Enter username" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input {...register('email', { required: true })} type="email" placeholder="Enter email" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input {...register('phoneNumber', { required: true })} placeholder="Enter phone number" />
          </div>
          <div>
            <label className="text-sm font-medium">Password {editingUser && '(Leave blank to keep current)'}</label>
            <Input {...register('password', { required: !editingUser })} type="password" placeholder="Enter password" />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select {...register('role', { required: true })}>
              <option value="admin">Admin</option>
              <option value="credit_manager">Credit Manager</option>
              <option value="collections">Collections</option>
              <option value="supporter">Supporter</option>
              <option value="verifier">Verifier</option>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Note: Shopkeepers ko Shopkeeper Management se create karein
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select {...register('status', { required: true })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
