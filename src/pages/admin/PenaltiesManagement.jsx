import { useState, useEffect } from 'react'
import { AlertTriangle, DollarSign, Calendar, Clock, User, Settings, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import loanStore from '../../store/loanStore'

export default function PenaltiesManagement() {
  const { loans, activeLoans, applyPenalty, checkAndApplyPenalties, fetchStatistics, stats: storeStats } = loanStore()
  const [penaltySettings, setPenaltySettings] = useState({
    defaultPenaltyAmount: 500,
    gracePeriodDays: 0,
    autoApplyPenalties: true,
    penaltyCalculationType: 'fixed', // fixed or percentage
    penaltyPercentage: 5,
  })
  const [overdueLoans, setOverdueLoans] = useState([])
  const [penaltyHistory, setPenaltyHistory] = useState([])

  // Fetch statistics on mount
  useEffect(() => {
    fetchStatistics()
  }, [])

  const stats = storeStats || {
    totalPenalties: 0
  }

  // Get overdue loans and penalty history
  useEffect(() => {
    const currentDate = new Date()
    const overdue = activeLoans.filter(loan => {
      if (!loan.nextDueDate) return false
      const dueDate = new Date(loan.nextDueDate)
      return currentDate > dueDate
    })

    setOverdueLoans(overdue)

    // Extract penalty history from all loans
    const allPenalties = loans.flatMap(loan =>
      (loan.penalties || []).map(penalty => ({
        ...penalty,
        loanId: loan.loanId,
        clientName: loan.clientName,
        loanDbId: loan.id,
      }))
    ).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))

    setPenaltyHistory(allPenalties)
  }, [activeLoans, loans])

  // Auto-apply penalties if enabled
  useEffect(() => {
    if (penaltySettings.autoApplyPenalties) {
      checkAndApplyPenalties()
    }
  }, [penaltySettings.autoApplyPenalties])

  const handleManualPenalty = (loanId, customAmount = null) => {
    const amount = customAmount || penaltySettings.defaultPenaltyAmount
    const success = applyPenalty(loanId, amount, 'Manual penalty applied')

    if (success) {
      toast.success(`Penalty of ₹${amount} applied successfully`)
    } else {
      toast.error('Failed to apply penalty')
    }
  }

  const savePenaltySettings = () => {
    // In a real app, this would save to backend
    localStorage.setItem('penaltySettings', JSON.stringify(penaltySettings))
    toast.success('Penalty settings saved successfully')
  }

  const getDaysOverdue = (dueDate) => {
    const currentDate = new Date()
    const due = new Date(dueDate)
    return Math.ceil((currentDate - due) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Penalties Management</h1>
          <p className="text-gray-600">Configure and manage late fees and penalties for overdue EMIs</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue Loans</p>
              <p className="text-2xl font-bold text-red-600">{overdueLoans.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Penalties</p>
            <p className="text-2xl font-bold text-purple-600">₹{stats.totalPenalties?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-orange-600">
                {penaltyHistory.filter(p => {
                  const penaltyDate = new Date(p.appliedAt)
                  const currentDate = new Date()
                  return penaltyDate.getMonth() === currentDate.getMonth() &&
                    penaltyDate.getFullYear() === currentDate.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Default Penalty</p>
              <p className="text-2xl font-bold text-blue-600">₹{penaltySettings.defaultPenaltyAmount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Penalty Settings */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Penalty Configuration</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure automatic penalty rules and amounts</p>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Penalty Amount (₹)</label>
              <input
                type="number"
                value={penaltySettings.defaultPenaltyAmount}
                onChange={(e) => setPenaltySettings({ ...penaltySettings, defaultPenaltyAmount: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (Days)</label>
              <input
                type="number"
                value={penaltySettings.gracePeriodDays}
                onChange={(e) => setPenaltySettings({ ...penaltySettings, gracePeriodDays: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={penaltySettings.autoApplyPenalties}
                  onChange={(e) => setPenaltySettings({ ...penaltySettings, autoApplyPenalties: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Automatically apply penalties after 12:00 AM on due date</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                onClick={savePenaltySettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Loans */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Overdue Loans</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Loans with overdue EMI payments</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Penalty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overdueLoans.length > 0 ? (
                overdueLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{loan.loanId}</div>
                      <div className="text-sm text-gray-500">{loan.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                          <div className="text-sm text-gray-500">{loan.clientMobile}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{loan.nextDueDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {getDaysOverdue(loan.nextDueDate)} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{loan.emiAmount?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600">₹{loan.totalPenalty?.toLocaleString() || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleManualPenalty(loan.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Apply Penalty"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No overdue loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Penalty History */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Penalty History</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Recent penalty applications and history</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Applied</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {penaltyHistory.length > 0 ? (
                penaltyHistory.slice(0, 10).map((penalty) => (
                  <tr key={penalty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{penalty.appliedDate}</div>
                      <div className="text-sm text-gray-500">{new Date(penalty.appliedAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{penalty.loanId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{penalty.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">₹{penalty.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{penalty.reason}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No penalty history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
