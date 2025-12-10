import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { useForm } from 'react-hook-form'
import { mockUsers } from '../../api/mockData'

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const { register, handleSubmit, reset, setValue } = useForm()

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
    setValue('role', user.role)
    setValue('status', user.status)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((u) => u.id !== id))
      toast.success('User deleted successfully')
    }
  }

  const handleSendInvite = (user) => {
    toast.success(`Invite sent to ${user.email}`)
  }

  const onSubmit = (data) => {
    if (editingUser) {
      setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u)))
      toast.success('User updated successfully')
    } else {
      setUsers([...users, { id: users.length + 1, ...data }])
      toast.success('User created successfully')
    }
    setIsModalOpen(false)
    setEditingUser(null)
    reset()
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
            <label className="text-sm font-medium">Name</label>
            <Input {...register('name')} placeholder="Enter name" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input {...register('email')} type="email" placeholder="Enter email" />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select {...register('role')}>
              <option value="admin">Admin</option>
              <option value="credit_manager">Credit Manager</option>
              <option value="collections">Collections</option>
              <option value="support">Support</option>
              <option value="verifier">Verifier</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select {...register('status')}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
