import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Settings } from 'lucide-react'

export default function Configuration() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">System settings and master data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Loan Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Default Interest Rate (%)</label>
                <Input type="number" defaultValue="3.5" step="0.1" />
              </div>
              <div>
                <label className="text-sm font-medium">Minimum Loan Amount</label>
                <Input type="number" defaultValue="20000" />
              </div>
              <Button className="w-full">Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
