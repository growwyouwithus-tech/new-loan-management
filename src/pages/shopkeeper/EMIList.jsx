import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, DollarSign, Clock, CheckCircle, AlertCircle, Filter, Search } from 'lucide-react'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import loanStore from '../../store/loanStore'

// Helper: Calculate EMI due date
const calculateEMIDueDate = (baseDateStr, emiNumber) => {
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

    return dueDate.toISOString().split('T')[0]
}

export default function EMIList() {
    const { loans, fetchLoans } = loanStore()
    const location = useLocation()

    const [emiList, setEmiList] = useState([])
    const [filteredEmis, setFilteredEmis] = useState([])
    const [activeTab, setActiveTab] = useState('All') // All, Pending, Paid, Upcoming
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchLoans()
    }, [fetchLoans])

    // Handle initial filter from navigation
    useEffect(() => {
        if (location.state?.filter) {
            const filter = location.state.filter
            if (filter === 'pending_emi') setActiveTab('Pending')
            else if (filter === 'upcoming_emi') setActiveTab('Upcoming')
            else if (filter === 'collected_emi') setActiveTab('Paid')
            else if (filter === 'remaining_emi') setActiveTab('All') // Show all for remaining to see scope
        }
    }, [location.state])

    // Process loans into EMI list
    useEffect(() => {
        if (!loans.length) return

        const allEmis = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        loans.forEach(loan => {
            // Only exclude explicitly rejected loans
            const status = (loan.status || '').toLowerCase()
            if (status === 'rejected' || status === 'void') return

            const payments = loan.payments || []
            const paymentsCount = payments.length
            const tenure = loan.tenure || (loan.emisPaid || 0) + (loan.emisRemaining || 0) || 12
            const emiAmountBase = Number(loan.emiAmount || loan.emi || 0)
            const baseDateStr = loan.emiStartDate || loan.appliedDate || loan.approvedDate || loan.createdAt

            for (let i = 1; i <= tenure; i++) {
                const dueDateStr = calculateEMIDueDate(baseDateStr, i)
                const dueDate = new Date(dueDateStr)
                dueDate.setHours(0, 0, 0, 0)

                let status = 'Upcoming'
                if (i <= paymentsCount) {
                    status = 'Paid'
                } else if (dueDate < today) {
                    status = 'Pending' // Overdue technically
                } else if (dueDate.getTime() === today.getTime()) {
                    status = 'Today'
                }

                allEmis.push({
                    id: `${loan._id || loan.id}_emi_${i}`,
                    loanId: loan.loanId,
                    clientName: loan.clientName || loan.customerName,
                    clientPhone: loan.clientPhone,
                    shopName: loan.shopName || loan.shopkeeperName,
                    emiNumber: i,
                    amount: emiAmountBase,
                    dueDate: dueDateStr,
                    status: status,
                    originalLoan: loan
                })
            }
        })

        // Sort by due date (oldest first for pending, newest first for others usually)
        allEmis.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

        setEmiList(allEmis)
    }, [loans])

    // Filter Logic
    useEffect(() => {
        let result = emiList

        // Tab Filter
        if (activeTab === 'Pending') {
            result = result.filter(e => e.status === 'Pending' || e.status === 'Today')
        } else if (activeTab === 'Paid') {
            result = result.filter(e => e.status === 'Paid')
        } else if (activeTab === 'Upcoming') {
            result = result.filter(e => e.status === 'Upcoming')
        }

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            result = result.filter(e =>
                e.loanId.toLowerCase().includes(lowerTerm) ||
                e.clientName.toLowerCase().includes(lowerTerm) ||
                (e.clientPhone && e.clientPhone.includes(lowerTerm))
            )
        }

        setFilteredEmis(result)
    }, [emiList, activeTab, searchTerm])

    const stats = {
        totalPendingAmount: emiList.filter(e => e.status === 'Pending' || e.status === 'Today').reduce((sum, e) => sum + e.amount, 0),
        totalUpcomingAmount: emiList.filter(e => e.status === 'Upcoming').reduce((sum, e) => sum + e.amount, 0),
        totalPaidAmount: emiList.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0),
        countPending: emiList.filter(e => e.status === 'Pending' || e.status === 'Today').length
    }

    const columns = [
        {
            accessorKey: 'loanId',
            header: 'Loan ID',
            cell: ({ row }) => <span className="font-medium text-blue-600">{row.original.loanId}</span>
        },
        {
            accessorKey: 'clientName',
            header: 'Customer',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium">{row.original.clientName}</p>
                    <p className="text-xs text-muted-foreground">{row.original.clientPhone}</p>
                </div>
            )
        },
        {
            accessorKey: 'emiNumber',
            header: 'EMI No.',
            cell: ({ row }) => <span className="font-mono">#{row.original.emiNumber}</span>
        },
        {
            accessorKey: 'dueDate',
            header: 'Due Date',
            cell: ({ row }) => {
                const date = new Date(row.original.dueDate)
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{date.toLocaleDateString('en-GB')}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => <span className="font-bold">₹{row.original.amount.toLocaleString()}</span>
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status
                let variant = 'secondary'
                if (status === 'Paid') variant = 'success'
                else if (status === 'Pending') variant = 'destructive'
                else if (status === 'Today') variant = 'warning'
                else if (status === 'Upcoming') variant = 'info'

                return <Badge variant={variant}>{status === 'Pending' ? 'Overdue' : status}</Badge>
            }
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        EMI Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Track and manage all EMI schedules</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" /> Pending / Overdue
                            </p>
                            <p className="text-2xl font-bold text-red-900 mt-1">₹{stats.totalPendingAmount.toLocaleString()}</p>
                            <p className="text-xs text-red-700 mt-1">{stats.countPending} EMIs pending</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 flex items-center gap-1">
                                <Clock className="h-4 w-4" /> Upcoming
                            </p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">₹{stats.totalUpcomingAmount.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" /> Collected
                            </p>
                            <p className="text-2xl font-bold text-green-900 mt-1">₹{stats.totalPaidAmount.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Access Filters & Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                        {/* Tabs */}
                        <div className="flex p-1 bg-muted/50 rounded-lg overflow-x-auto">
                            {['All', 'Pending', 'Upcoming', 'Paid'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-muted-foreground hover:bg-white/50'
                                        }`}
                                >
                                    {tab === 'Pending' ? 'Pending / Overdue' : tab}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search Client or Loan ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* EMI Table */}
            <div className="bg-white rounded-lg shadow-sm border">
                <Table
                    columns={columns}
                    data={filteredEmis}
                    searchable={false}
                />
            </div>
        </div>
    )
}
