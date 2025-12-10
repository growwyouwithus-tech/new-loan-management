import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Download } from 'lucide-react'

export default function AccountingLedger() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounting & Ledger</h1>
          <p className="text-muted-foreground">Financial records and general ledger</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Ledger
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Accounting features coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
