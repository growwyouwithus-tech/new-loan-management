import { useState } from 'react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Plus } from 'lucide-react'

export default function SupportTickets() {
  const [tickets] = useState([])

  const columns = [
    { accessorKey: 'id', header: 'Ticket ID' },
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'customer', header: 'Customer' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const colors = { open: 'destructive', in_progress: 'warning', closed: 'success' }
        return <Badge variant={colors[row.original.status]}>{row.original.status}</Badge>
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const colors = { high: 'destructive', medium: 'warning', low: 'default' }
        return <Badge variant={colors[row.original.priority]}>{row.original.priority}</Badge>
      },
    },
    { accessorKey: 'assignedTo', header: 'Assigned To' },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => <Button size="sm">View</Button>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support requests</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No support tickets available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">API endpoint not implemented yet</p>
        </div>
      ) : (
        <Table columns={columns} data={tickets} />
      )}
    </div>
  )
}
