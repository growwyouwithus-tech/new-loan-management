import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, CheckCircle, Clock, XCircle, Eye, TrendingUp
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/common/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import loanStore from '../../store/loanStore'
import { useEffect, useState } from 'react'

export default function VerifierDashboard() {
  const navigate = useNavigate()
  const { 
    loans, 
    pendingLoans, 
    verifiedLoans, 
    getStatistics 
  } = loanStore()
  
  const [weeklyData, setWeeklyData] = useState([])
  
  const stats = getStatistics()
  
  // Calculate verifier-specific stats with actual data
  const verifierStats = {
    pendingVerification: pendingLoans.length,
    verifiedToday: loans.filter(loan => {
      const today = new Date().toISOString().split('T')[0]
      return loan.verifiedDate === today && loan.status === 'Verified'
    }).length,
    totalVerified: loans.filter(loan => loan.status === 'Verified' || loan.status === 'Approved' || loan.status === 'Active').length,
    rejectedLoans: loans.filter(loan => loan.status === 'Rejected').length
  }
  
  // Generate actual weekly verification trend
  useEffect(() => {
    const generateWeeklyData = () => {
      const weekData = []
      const today = new Date()
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const verifiedCount = loans.filter(loan => 
          loan.verifiedDate === dateStr && 
          (loan.status === 'Verified' || loan.status === 'Approved' || loan.status === 'Active')
        ).length
        
        const rejectedCount = loans.filter(loan => 
          loan.verifiedDate === dateStr && loan.status === 'Rejected'
        ).length
        
        weekData.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: dateStr,
          verified: verifiedCount,
          rejected: rejectedCount
        })
      }
      
      setWeeklyData(weekData)
    }
    
    generateWeeklyData()
  }, [loans])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Verifier Dashboard</h1>
          <p className="text-gray-600">Loan verification overview and statistics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            title="Pending Verification"
            value={verifierStats.pendingVerification}
            icon={Clock}
            trend={{ value: 5, isPositive: false }}
            color="yellow"
            onClick={() => navigate('/verifier/loan-verifier')}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            title="Verified Today"
            value={verifierStats.verifiedToday}
            icon={CheckCircle}
            trend={{ value: 12, isPositive: true }}
            color="green"
            onClick={() => navigate('/verifier/verified-loans')}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            title="Total Verified"
            value={verifierStats.totalVerified}
            icon={FileText}
            trend={{ value: 8, isPositive: true }}
            color="blue"
            onClick={() => navigate('/verifier/verified-loans')}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard
            title="Rejected Loans"
            value={verifierStats.rejectedLoans}
            icon={XCircle}
            trend={{ value: 2, isPositive: false }}
            color="red"
            onClick={() => navigate('/verifier/loan-verifier')}
          />
        </motion.div>
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Verification Trend
              </CardTitle>
              <CardDescription>
                Loans verified and rejected over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'verified' ? 'Verified' : 'Rejected']}
                    labelFormatter={(label) => {
                      const dayData = weeklyData.find(d => d.date === label)
                      return dayData ? `${label} (${dayData.fullDate})` : label
                    }}
                  />
                  <Legend />
                  <Bar dataKey="verified" fill="#10b981" name="Verified" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
              {weeklyData.length === 0 && (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No verification data available for the past week</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access frequently used verification tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate('/verifier/loan-verifier')}
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Start Verification
              </Button>
              <Button
                onClick={() => navigate('/verifier/verified-loans')}
                className="w-full justify-start"
                variant="outline"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                View Verified Loans
              </Button>
              <Button
                onClick={() => navigate('/verifier/loan-verifier')}
                className="w-full justify-start"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Review Pending
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Verification Activity</CardTitle>
            <CardDescription>
              Latest loan verification actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingLoans.slice(0, 5).map((loan, index) => (
                <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{loan.clientName}</p>
                      <p className="text-sm text-gray-500">Loan ID: {loan.loanId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{loan.loanAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{loan.appliedDate}</p>
                  </div>
                </div>
              ))}
              {pendingLoans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pending loans for verification
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
