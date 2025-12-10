import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, DollarSign, Users, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import loanStore from '../../store/loanStore';
import { format } from 'date-fns';

export default function CollectionsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const { loans, activeLoans, getPayments, getStatistics } = loanStore();
  
  const allPayments = getPayments();
  const stats = getStatistics();

  // Calculate collections data based on actual data
  const getCollectionData = () => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    let filteredPayments = allPayments;
    
    switch (selectedPeriod) {
      case 'today':
        filteredPayments = allPayments.filter(p => p.date === today);
        break;
      case 'week':
        filteredPayments = allPayments.filter(p => p.date >= thisWeek);
        break;
      case 'month':
        filteredPayments = allPayments.filter(p => p.date >= thisMonth);
        break;
    }

    const totalCollected = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const overdueLoans = activeLoans.filter(loan => loan.status === 'Overdue');
    const pendingLoans = activeLoans.filter(loan => loan.status === 'Active');

    return {
      totalCollected,
      totalPayments: filteredPayments.length,
      overdueCount: overdueLoans.length,
      pendingCount: pendingLoans.length,
      overdueLoans,
      pendingLoans,
      recentPayments: filteredPayments.slice(-10).reverse()
    };
  };

  const collectionData = getCollectionData();

  // Filter loans based on search
  const filteredOverdueLoans = collectionData.overdueLoans.filter(loan =>
    loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingLoans = collectionData.pendingLoans.filter(loan =>
    loan.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections Dashboard</h1>
          <p className="text-gray-600">Monitor and manage loan collections</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Overdue Loans"
          value={collectionData.overdueCount}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Collections"
          value={collectionData.pendingCount}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by client name or loan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Overdue Loans Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Overdue Loans ({filteredOverdueLoans.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOverdueLoans.length > 0 ? (
                filteredOverdueLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                        <div className="text-sm text-gray-500">{loan.clientPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.loanId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(loan.emiAmount || loan.loanAmount / loan.tenure || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.nextDueDate || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-600">{loan.appliedDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No overdue loans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Collections Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 text-orange-500 mr-2" />
            Pending Collections ({filteredPendingLoans.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPendingLoans.length > 0 ? (
                filteredPendingLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{loan.clientName}</div>
                        <div className="text-sm text-gray-500">{loan.clientPhone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.loanId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(loan.emiAmount || loan.loanAmount / loan.tenure || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{loan.nextDueDate || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-600">{loan.appliedDate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No pending collections found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
