import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { DollarSign, FileText, Users, TrendingUp, Clock, CheckCircle, CalendarCheck, Clock3, CheckCircle2 } from 'lucide-react'
import loanStore from '../../store/loanStore'
import shopkeeperStore from '../../store/shopkeeperStore'
import notificationStore from '../../store/notificationStore'
import { useAuthStore } from '../../store/authStore'


const collectionData = [
  { date: '01', amount: 35000 },
  { date: '02', amount: 42000 },
  { date: '03', amount: 38000 },
  { date: '04', amount: 45000 },
  { date: '05', amount: 41000 },
  { date: '06', amount: 48000 },
  { date: '07', amount: 45000 },
]

const recentLoans = [
  { id: 'LN001', customer: 'Priya Patel', amount: 50000, status: 'active', dueDate: '2024-02-15' },
  { id: 'LN002', customer: 'Vikram Singh', amount: 100000, status: 'overdue', dueDate: '2024-01-01' },
  { id: 'LN003', customer: 'Amit Kumar', amount: 30000, status: 'pending', dueDate: null },
]

export default function ShopkeeperDashboard() {
  const navigate = useNavigate()
  const { loans, fetchLoans, loading } = loanStore()
  const { shopkeepers, fetchShopkeepers } = shopkeeperStore()
  const { user } = useAuthStore()
  const { updateNotifications } = notificationStore()

  useEffect(() => {
    fetchLoans()
    fetchShopkeepers()
  }, []) // Empty dependency array - only run once on mount

  // Update notifications when loans change
  useEffect(() => {
    if (loans.length > 0) {
      const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue')
      updateNotifications(loans, activeLoans)
    }
  }, [loans]) // Only depend on loans, not updateNotifications

  // Get current shopkeeper's token balance
  const currentShopkeeper = shopkeepers.find(sk => sk.email === user?.email)
  const tokenBalance = currentShopkeeper?.tokenBalance || 0


  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter loans based on date if selected
  const filteredLoans = loans.filter(loan => {
    if (!startDate && !endDate) return true;
    const loanDate = new Date(loan.appliedDate);
    const start = startDate ? new Date(startDate) : new Date('1970-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    return loanDate >= start && loanDate <= end;
  });

  // Calculate real data from filtered loans
  const totalLoans = filteredLoans.length
  const activeLoans = filteredLoans.filter(l => l.status === 'Active' || l.status === 'Overdue').length
  const pendingLoans = filteredLoans.filter(l => l.status === 'Pending').length
  const verifiedLoans = filteredLoans.filter(l => l.status === 'Verified').length
  const approvedLoans = filteredLoans.filter(l => l.status === 'Approved').length
  const completedLoans = filteredLoans.filter(l => l.status === 'Paid').length

  // Specific Categories
  const selfLoansCount = filteredLoans.filter(l => l.applicationMode === 'self').length
  const maxbornLoansCount = filteredLoans.filter(l => l.applicationMode === 'max_born_group').length

  // EMI Stats Logic - Robust calculation to match EMIList page
  const calculateEMIDueDateLocal = (baseDateStr, emiNumber) => {
    const baseDate = new Date(baseDateStr)
    const baseDateDay = baseDate.getDate()
    let firstEMIDueDate = new Date(baseDate)

    if (baseDateDay >= 1 && baseDateDay <= 18) {
      firstEMIDueDate.setMonth(firstEMIDueDate.getMonth() + 1)
      firstEMIDueDate.setDate(2)
    } else {
      firstEMIDueDate.setMonth(firstEMIDueDate.getMonth() + 2)
      firstEMIDueDate.setDate(2)
    }

    const dueDate = new Date(firstEMIDueDate)
    dueDate.setMonth(dueDate.getMonth() + (emiNumber - 1))
    return dueDate
  }

  let totalEmisCollected = 0
  let totalEmisRemaining = 0
  let pendingEmiCount = 0
  let upcomingEmiCount = 0

  filteredLoans.forEach(loan => {
    // Exclude rejected/void loans
    const status = (loan.status || '').toLowerCase()
    if (status === 'rejected' || status === 'void') return

    const payments = loan.payments || []
    const paymentsCount = payments.length
    const tenure = loan.tenure || (loan.emisPaid || 0) + (loan.emisRemaining || 0) || 12
    const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt

    // Stats for this loan
    totalEmisCollected += paymentsCount

    // Calculate remaining
    const remaining = Math.max(tenure - paymentsCount, 0)
    totalEmisRemaining += remaining

    // Calculate specific Pending/Upcoming counts based on dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 1; i <= tenure; i++) {
      if (i <= paymentsCount) continue; // Already paid

      const dueDate = calculateEMIDueDateLocal(baseDateStr, i)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        pendingEmiCount++
      } else {
        upcomingEmiCount++
      }
    }
  })

  const totalCustomers = new Set(filteredLoans.map(l => l.clientAadharNumber)).size

  // Calculate collections (Today's collection doesn't depend on general date filter usually, but kept as is)
  const todayCollections = loans.reduce((sum, loan) => {
    const payments = loan.payments || []
    const todayPayments = payments.filter(p => {
      const paymentDate = new Date(p.paymentDate || p.date)
      const today = new Date()
      return paymentDate.toDateString() === today.toDateString()
    })
    return sum + todayPayments.reduce((s, p) => s + (p.amount || 0), 0)
  }, 0)

  // Icon card component - Modern Professional Design with Gradients
  const IconCard = ({ icon: Icon, label, value, color = 'blue', onClick }) => {
    const colorClasses = {
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
        icon: 'text-blue-600',
        shadow: 'shadow-blue-200'
      },
      green: {
        gradient: 'from-emerald-500 to-green-600',
        bg: 'bg-gradient-to-br from-emerald-50 to-green-100',
        icon: 'text-emerald-600',
        shadow: 'shadow-emerald-200'
      },
      purple: {
        gradient: 'from-purple-500 to-violet-600',
        bg: 'bg-gradient-to-br from-purple-50 to-violet-100',
        icon: 'text-purple-600',
        shadow: 'shadow-purple-200'
      },
      orange: {
        gradient: 'from-orange-500 to-amber-600',
        bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
        icon: 'text-orange-600',
        shadow: 'shadow-orange-200'
      },
      red: {
        gradient: 'from-red-500 to-rose-600',
        bg: 'bg-gradient-to-br from-red-50 to-rose-100',
        icon: 'text-red-600',
        shadow: 'shadow-red-200'
      },
      emerald: {
        gradient: 'from-teal-500 to-emerald-600',
        bg: 'bg-gradient-to-br from-teal-50 to-emerald-100',
        icon: 'text-teal-600',
        shadow: 'shadow-teal-200'
      },
      indigo: {
        gradient: 'from-indigo-500 to-blue-600',
        bg: 'bg-gradient-to-br from-indigo-50 to-blue-100',
        icon: 'text-indigo-600',
        shadow: 'shadow-indigo-200'
      },
      cyan: {
        gradient: 'from-cyan-500 to-sky-600',
        bg: 'bg-gradient-to-br from-cyan-50 to-sky-100',
        icon: 'text-cyan-600',
        shadow: 'shadow-cyan-200'
      },
    }

    const colors = colorClasses[color] || colorClasses.blue

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05, y: -8 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        onClick={onClick}
        className={`bg-white rounded-2xl p-5 sm:p-6 md:p-7 text-center hover:shadow-2xl ${colors.shadow} transition-all duration-300 cursor-pointer border-2 border-gray-100 hover:border-transparent relative overflow-hidden group`}
      >
        {/* Background Gradient Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-4">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
              className={`${colors.bg} rounded-2xl p-4 shadow-lg`}
            >
              <Icon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${colors.icon}`} strokeWidth={2} />
            </motion.div>
          </div>
          <p className="text-xs sm:text-sm md:text-base font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">{value}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-7 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg font-medium">Welcome back! Here's your business overview</p>
        </motion.div>
      </div>

      {/* Date Filter */}
      {/* Date Filter */}
      <div className="mb-6 flex items-center gap-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Icon Grid - 2 columns, 4 rows to fit all 8 icons without scrolling */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {/* Row 1 */}
        <IconCard icon={DollarSign} label="Token Left" value={tokenBalance} color="emerald" onClick={() => { }} />
        <IconCard icon={FileText} label="Total Loans" value={totalLoans} color="blue" onClick={() => navigate('/shopkeeper/loans')} />

        {/* Row 2 */}
        <IconCard icon={Users} label="Self Loans" value={selfLoansCount} color="purple" onClick={() => navigate('/shopkeeper/loans', { state: { filter: 'self' } })} />
        <IconCard icon={Users} label="Maxborn Loans" value={maxbornLoansCount} color="red" onClick={() => navigate('/shopkeeper/loans', { state: { filter: 'max_born_group' } })} />
        <IconCard icon={Clock} label="Pending Loans" value={pendingLoans} color="orange" onClick={() => navigate('/shopkeeper/loans', { state: { filter: 'Pending' } })} />
        <IconCard icon={CheckCircle2} label="Verified Loans" value={verifiedLoans} color="indigo" onClick={() => navigate('/shopkeeper/loans', { state: { filter: 'Verified' } })} />
        <IconCard icon={CheckCircle} label="Active Loans" value={activeLoans} color="green" onClick={() => navigate('/shopkeeper/loans', { state: { filter: 'Active' } })} />
        <IconCard icon={DollarSign} label="Completed Loans" value={completedLoans} color="cyan" onClick={() => navigate('/shopkeeper/loans', { state: { filter: 'Paid' } })} />

        {/* Row 3 */}
        <IconCard icon={Clock3} label="Pending EMI" value={pendingEmiCount} color="orange" onClick={() => navigate('/shopkeeper/emis', { state: { filter: 'pending_emi' } })} />
        <IconCard icon={CalendarCheck} label="Collected EMI" value={totalEmisCollected} color="blue" onClick={() => navigate('/shopkeeper/emis', { state: { filter: 'collected_emi' } })} />

        <IconCard icon={CalendarCheck} label="Upcoming EMI" value={upcomingEmiCount} color="green" onClick={() => navigate('/shopkeeper/emis', { state: { filter: 'upcoming_emi' } })} />

        {/* Row 4 */}
        {/* <IconCard icon={DollarSign} label="Today's Collections" value={`₹${todayCollections.toLocaleString()}`} color="green" onClick={() => navigate('/shopkeeper/collect-payment')} /> */}
      </div>
    </div>
  )
}
