import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Download, TrendingUp, TrendingDown, DollarSign, Calculator, Calendar } from 'lucide-react'
import loanStore from '../../store/loanStore'
import shopkeeperStore from '../../store/shopkeeperStore'

export default function AccountingLedger() {
  const { loans, fetchLoans } = loanStore()
  const { shopkeepers, fetchShopkeepers } = shopkeeperStore()
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [accountData, setAccountData] = useState({
    month: selectedMonth,
    capitalInvestment: 0,
    grossProfit: 0,
    rci: 0, // Regular Capital Investment
    aci: 0, // Additional Capital Investment
    rgp: 0, // Regular Gross Profit
    agp: 0, // Additional Gross Profit
    loss: 0,
    balance: 0
  })

  useEffect(() => {
    fetchLoans()
    fetchShopkeepers()
  }, [])

  useEffect(() => {
    calculateAccountingData()
  }, [loans, selectedMonth])

  const calculateAccountingData = () => {
    const currentMonth = new Date(selectedMonth)
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    // Filter loans for the selected month
    const monthlyLoans = loans.filter(loan => {
      const loanDate = new Date(loan.appliedDate || loan.createdAt)
      return loanDate >= monthStart && loanDate <= monthEnd
    })

    // Calculate Capital Investment (total loan amount disbursed)
    const capitalInvestment = monthlyLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0)

    // Calculate Gross Profit (interest earned)
    const grossProfit = monthlyLoans.reduce((sum, loan) => {
      const emiAmount = loan.emiAmount || 0
      const tenure = loan.tenure || 1
      const totalPayable = emiAmount * tenure
      const principal = loan.loanAmount || 0
      return sum + (totalPayable - principal)
    }, 0)

    // Calculate payments received in the month
    const paymentsReceived = loans.reduce((sum, loan) => {
      if (!loan.payments) return sum
      const monthlyPayments = loan.payments.filter(payment => {
        const paymentDate = new Date(payment.date || payment.timestamp)
        return paymentDate >= monthStart && paymentDate <= monthEnd
      })
      return sum + monthlyPayments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
    }, 0)

    // Calculate losses (defaults, penalties, etc.)
    const loss = loans.reduce((sum, loan) => {
      if (loan.status === 'Defaulted') {
        return sum + (loan.loanAmount || 0)
      }
      return sum + (loan.penalties || 0)
    }, 0)

    // For simplicity, split into regular and additional (70% regular, 30% additional)
    const rci = capitalInvestment * 0.7
    const aci = capitalInvestment * 0.3
    const rgp = grossProfit * 0.7
    const agp = grossProfit * 0.3

    // Calculate balance
    const balance = paymentsReceived - loss

    setAccountData({
      month: selectedMonth,
      capitalInvestment,
      grossProfit,
      rci,
      aci,
      rgp,
      agp,
      loss,
      balance
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounting & Ledger</h1>
          <p className="text-muted-foreground">Financial records and monthly accounting summary</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Ledger
          </Button>
        </div>
      </div>

      {/* Main Accounting Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(accountData.capitalInvestment)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(accountData.grossProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${accountData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(accountData.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Accounting Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Capital Investment Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">R.C.I (Regular Capital Investment)</span>
              <span className="font-bold text-blue-600">{formatCurrency(accountData.rci)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="font-medium">A.C.I (Additional Capital Investment)</span>
              <span className="font-bold text-indigo-600">{formatCurrency(accountData.aci)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2">
              <span className="font-bold">Total Capital Investment</span>
              <span className="font-bold">{formatCurrency(accountData.capitalInvestment)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gross Profit Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">R.G.P (Regular Gross Profit)</span>
              <span className="font-bold text-green-600">{formatCurrency(accountData.rgp)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="font-medium">A.G.P (Additional Gross Profit)</span>
              <span className="font-bold text-emerald-600">{formatCurrency(accountData.agp)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border-t-2">
              <span className="font-bold">Total Gross Profit</span>
              <span className="font-bold">{formatCurrency(accountData.grossProfit)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loss and Balance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Loss Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-red-800">Total Loss (Excess of expenses over income)</span>
                <span className="font-bold text-red-600 text-xl">{formatCurrency(accountData.loss)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-500" />
              Balance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${accountData.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${accountData.balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  Balance (Remaining amount after profit/loss adjustments)
                </span>
                <span className={`font-bold text-xl ${accountData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(accountData.balance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Accounting Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Month</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Capital Investment</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Gross Profit</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">R.C.I</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">A.C.I</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">R.G.P</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">A.G.P</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Loss</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accountData.capitalInvestment)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accountData.grossProfit)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accountData.rci)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accountData.aci)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accountData.rgp)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(accountData.agp)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-red-600">{formatCurrency(accountData.loss)}</td>
                  <td className={`border border-gray-300 px-4 py-2 text-right font-bold ${accountData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(accountData.balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
