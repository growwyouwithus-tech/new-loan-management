import { useState } from 'react'
import Table from '../../components/ui/Table'
import { mockAuditLogs } from '../../api/mockData'

export default function AuditLogs() {
  const [logs] = useState(mockAuditLogs)

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
      <Table columns={columns} data={logs} searchPlaceholder="Search logs..." />
    </div>
  )
}
