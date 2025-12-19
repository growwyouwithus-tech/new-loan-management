import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import loanStore from '../../store/loanStore'
import { FileText, User, Store, Calendar, DollarSign } from 'lucide-react'

export default function LoanDetails() {
  const { id } = useParams()
  const { loans, fetchLoans, loading } = loanStore()
  
  useEffect(() => {
    fetchLoans()
  }, [])
  
  const loan = loans.find((l) => l.id === id || l._id === id)

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }
  
  if (!loan) {
    return <div className="flex items-center justify-center h-64">Loan not found</div>
  }
  
  // Calculate repayments from loan data
  const mockRepayments = loan.payments || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Loan Details - {loan.id}</h1>
          <p className="text-muted-foreground">Complete loan information and repayment schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Agreement</Button>
          <Button>Record Payment</Button>
        </div>
      </div>

      {/* Loan Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Loan Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{loan.amount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              @ {loan.interestRate}% for {loan.tenure} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Repayment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₹{loan.paidAmount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Paid / ₹{loan.amount.toLocaleString()} Total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                loan.status === 'active'
                  ? 'success'
                  : loan.status === 'overdue'
                  ? 'destructive'
                  : 'default'
              }
              className="text-lg px-4 py-2"
            >
              {loan.status}
            </Badge>
            {loan.dueDate && (
              <p className="text-sm text-muted-foreground mt-2">
                Next Due: {loan.dueDate}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Borrower</p>
              <p className="font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {loan.borrower}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shopkeeper</p>
              <p className="font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                {loan.shopkeeper}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disbursed Date</p>
              <p className="font-medium">{loan.disbursedDate || 'Not disbursed'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purpose</p>
              <p className="font-medium">{loan.purpose}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">EMI Amount</p>
              <p className="font-medium">₹{loan.emi.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining Amount</p>
              <p className="font-medium">₹{loan.remainingAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Repayment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockRepayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">EMI #{payment.id}</p>
                  <p className="text-sm text-muted-foreground">Due: {payment.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                  <Badge variant={payment.status === 'paid' ? 'success' : 'warning'}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
