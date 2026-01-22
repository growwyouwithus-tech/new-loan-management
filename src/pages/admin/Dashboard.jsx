import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, TrendingUp, FileText,
  Users, Clock, XCircle, Bell, Download, Share2, Copy
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/common/StatCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import notificationStore from '../../store/notificationStore'
import loanStore from '../../store/loanStore'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { notifications, getRecentNotifications, markAsRead, updateNotifications } = notificationStore()
  const {
    loans,
    pendingLoans,
    verifiedLoans,
    approvedLoans,
    activeLoans,
    completedLoans,
    fetchLoans,
    loading
  } = loanStore()

  // Calculate actual stats from loan store
  const stats = {
    totalLoans: loans.length,
    activeLoans: activeLoans.length,
    overdueAmount: activeLoans
      .filter(loan => loan.status === 'Overdue')
      .reduce((sum, loan) => sum + (loan.loanAmount || 0), 0),
    npaPercentage: activeLoans.length > 0
      ? ((activeLoans.filter(loan => loan.status === 'Overdue').length / activeLoans.length) * 100).toFixed(1)
      : 0,
    totalDisbursed: approvedLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0),
    totalCollected: completedLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0),
    pendingApprovals: verifiedLoans.length,
    kycPending: pendingLoans.filter(loan => loan.kycStatus !== 'verified').length
  }

  // Calculate chart data from actual loans
  const getDisbursementData = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-GB')

      const dayLoans = approvedLoans.filter(loan => {
        const loanDate = new Date(loan.approvedDate || loan.createdAt)
        return loanDate.toLocaleDateString('en-GB') === dateStr
      })

      last7Days.push({
        date: dateStr,
        amount: dayLoans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0)
      })
    }
    return last7Days
  }

  const getCollectionData = () => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-GB')

      const dayCollections = completedLoans.filter(loan => {
        const loanDate = new Date(loan.completedDate || loan.updatedAt)
        return loanDate.toLocaleDateString('en-GB') === dateStr
      })

      last7Days.push({
        date: dateStr,
        amount: dayCollections.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0)
      })
    }
    return last7Days
  }

  const getLoansByStatusData = () => {
    return [
      { name: 'Pending', value: pendingLoans.length, color: '#f59e0b' },
      { name: 'Verified', value: verifiedLoans.length, color: '#3b82f6' },
      { name: 'Approved', value: approvedLoans.length, color: '#10b981' },
      { name: 'Active', value: activeLoans.length, color: '#8b5cf6' },
      { name: 'Completed', value: completedLoans.length, color: '#6b7280' }
    ]
  }

  useEffect(() => {
    // Fetch loans from backend on component mount
    fetchLoans()
  }, [])

  useEffect(() => {
    updateNotifications(loans, activeLoans)
  }, [loans, activeLoans, updateNotifications])

  const recentNotifications = getRecentNotifications(5)

  const [copied, setCopied] = useState(false)

  const appDownloadLink = window.location.origin
  const shopkeeperAppLink = `${appDownloadLink}/shopkeeper`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopkeeperAppLink)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadAPK = () => {
    // This would link to your APK file hosted on a server
    toast.info('APK download will start shortly...')
    // window.location.href = 'https://your-server.com/shopkeeper-app.apk'
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium">Complete overview of your loan management system</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="success"
            onClick={() => navigate('/admin/verified-loans')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Approve Loan
          </Button>
        </div>
      </motion.div>

      {/* Download App Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Shopkeeper Mobile App</CardTitle>
                  <CardDescription>Download and share the app with shopkeepers</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Web App Link */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📱 Web App Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shopkeeperAppLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white"
                  />
                  <Button
                    size="sm"
                    variant={copied ? "success" : "outline"}
                    onClick={handleCopyLink}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Share this link with shopkeepers to access the app from any browser
                </p>
              </div>

              {/* Download Options */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">⬇️ Download APK</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      toast.info('APK download link will be available soon. Please check back later.')
                      // window.location.href = 'https://your-server.com/shopkeeper-app.apk'
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download APK (Android)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      toast.info('iOS app will be available on App Store soon.')
                      // window.location.href = 'https://apps.apple.com/app/...'
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download iOS App
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">📋 How to Share:</p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>✓ Copy the link and send via SMS, Email, or WhatsApp</li>
                  <li>✓ Shopkeepers can open the link on any mobile browser</li>
                  <li>✓ No installation required - works on all devices</li>
                  <li>✓ Bookmark the app for quick access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Loans"
          value={stats.totalLoans}
          icon={FileText}
          color="blue"
          onClick={() => navigate('/admin/loans')}
        />
        <StatCard
          title="Active Loans"
          value={stats.activeLoans}
          icon={Clock}
          color="green"
          onClick={() => navigate('/admin/loans')}
        />
        <StatCard
          title="Overdue Amount"
          value={`₹${stats.overdueAmount.toLocaleString()}`}
          icon={XCircle}
          color="red"
          onClick={() => navigate('/admin/loans')}
        />
        <StatCard
          title="NPA Percentage"
          value={`${stats.npaPercentage}%`}
          icon={TrendingUp}
          color="yellow"
          onClick={() => navigate('/admin/loans')}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Disbursed"
          value={`₹${stats.totalDisbursed.toLocaleString()}`}
          icon={DollarSign}
          color="purple"
          onClick={() => navigate('/admin/verified-loans')}
        />
        <StatCard
          title="Total Collected"
          value={`₹${stats.totalCollected.toLocaleString()}`}
          icon={DollarSign}
          color="green"
          onClick={() => navigate('/admin/loans')}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          color="orange"
          onClick={() => navigate('/admin/verified-loans')}
        />
        <StatCard
          title="KYC Pending"
          value={stats.kycPending}
          icon={Users}
          color="blue"
          onClick={() => navigate('/admin/kyc')}
        />
      </div>

      {/* Recent Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription>Latest loan activities and alerts</CardDescription>
            </div>
            {recentNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/notifications')}
              >
                View All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent notifications</p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${!notif.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                      }`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{notif.title}</p>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          notif.severity === 'high' ? 'destructive' :
                            notif.severity === 'medium' ? 'warning' :
                              notif.type === 'success' ? 'success' : 'default'
                        }
                        className="text-xs"
                      >
                        {notif.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disbursements Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Disbursements (Last 7 Days)</CardTitle>
              <CardDescription>Daily loan disbursement trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getDisbursementData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Collections Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Collections (Last 7 Days)</CardTitle>
              <CardDescription>Daily collection trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCollectionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Loans by Status & Recent Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loans by Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Loans by Status</CardTitle>
              <CardDescription>Distribution of loan statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getLoansByStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getLoansByStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Loans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Loans</CardTitle>
              <CardDescription>Latest loan applications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loans.slice(0, 5).map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{loan.id}</p>
                        <Badge
                          variant={
                            loan.status === 'Active'
                              ? 'success'
                              : loan.status === 'Overdue'
                                ? 'destructive'
                                : loan.status === 'Pending'
                                  ? 'warning'
                                  : 'default'
                          }
                        >
                          {loan.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {loan.clientName || 'Unknown'} • {loan.shopkeeperName || 'Unknown'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{(loan.loanAmount || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {loan.tenure || 12} months @ {loan.interestRate || 10}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
