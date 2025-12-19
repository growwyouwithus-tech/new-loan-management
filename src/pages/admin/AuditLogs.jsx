import { useState } from 'react'
import Table from '../../components/ui/Table'

export default function AuditLogs() {
  const [logs] = useState([])

  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'user', header: 'User' },
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'entity', header: 'Entity' },
    { accessorKey: 'entityId', header: 'Entity ID' },
    { accessorKey: 'timestamp', header: 'Timestamp' },
    { accessorKey: 'details', header: 'Details' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all system activities and changes</p>
      </div>
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No audit logs available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">API endpoint not implemented yet</p>
        </div>
      ) : (
        <Table columns={columns} data={logs} searchPlaceholder="Search logs..." />
      )}
    </div>
  )
}
