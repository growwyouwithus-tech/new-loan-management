
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Search, Calendar, FileText, Download, Eye, Edit, Trash2 } from 'lucide-react'
import loanStore from '../../store/loanStore'
import { toast } from 'react-toastify'

export default function PaymentRecords() {
    const { loans: allLoans, fetchLoans } = loanStore()
    const [loans, setLoans] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [applicationMode, setApplicationMode] = useState('All')
    const [shopkeeperFilter, setShopkeeperFilter] = useState('All Shopkeeper')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')


    // Fetch loans on mount
    useEffect(() => {
        const loadLoans = async () => {
            setLoading(true)
            try {
                await fetchLoans()
            } catch (error) {
                console.error('Error fetching loans:', error)
                toast.error('Failed to load loan records')
            } finally {
                setLoading(false)
            }
        }
        loadLoans()
    }, [fetchLoans])

    // Sync state with store
    useEffect(() => {
        if (allLoans) {
            setLoans(allLoans)
        }
    }, [allLoans])

    // Filter loans based on search query and filters
    const filteredLoans = loans.filter(loan => {
        // 0. Date Filter (Applied Date)
        if (startDate) {
            const loanDate = new Date(loan.appliedDate || loan.createdAt)
            if (loanDate < new Date(startDate)) return false
        }
        if (endDate) {
            const loanDate = new Date(loan.appliedDate || loan.createdAt)
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (loanDate > end) return false
        }

        // 1. Application Type

        if (applicationMode !== 'All') {
            if (applicationMode === 'Maxborn' && loan.applicationMode !== 'max_born_group') return false
            if (applicationMode === 'Self' && (loan.applicationMode === 'max_born_group')) return false
        }

        // 2. Loan Status
        if (statusFilter !== 'All') {
            const lowerStatus = statusFilter.toLowerCase();
            const s = (loan.status || '').toLowerCase();
            let match = false;
            if (statusFilter === 'Pending') match = s === 'pending';
            else if (statusFilter === 'Verified') match = s === 'verified';
            else if (statusFilter === 'Approve') match = s === 'approved';
            else if (statusFilter === 'Active') match = s === 'active';
            else if (statusFilter === 'Defaulter') match = s === 'overdue' || s === 'defaulter';
            else if (statusFilter === 'Settled') match = s === 'paid' || s === 'settled';
            else if (statusFilter === 'Close') match = s === 'closed' || s === 'paid' || s === 'completed';
            else match = s === lowerStatus;

            if (!match) return false;
        }

        // 3. Shopkeeper Filter (Placeholder for now)
        if (shopkeeperFilter !== 'All Shopkeeper') {
            // Logic to filter by shopkeeper if data available
        }

        // 4. Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const clientName = loan.clientName || loan.customerName || ''
            const loanId = loan.loanId || `LN${String(loan.id).slice(-6)}`
            const shopName = loan.shopName || loan.shopkeeperName || ''
            const aadhar = loan.clientAadharNumber || loan.aadharNumber || ''
            const phone = loan.clientPhone || ''

            if (!clientName.toLowerCase().includes(query) &&
                !loanId.toLowerCase().includes(query) &&
                !shopName.toLowerCase().includes(query) &&
                !aadhar.toLowerCase().includes(query) &&
                !phone.includes(query)) {
                return false
            }
        }

        return true
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Payment Records
                    </h1>
                    <p className="text-muted-foreground mt-1">View and manage all client payment history</p>
                </div>
            </div>

            <Card className="shadow-lg border-t-4 border-t-blue-500">
                <CardHeader>
                    <CardTitle>Filter & Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Start Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">End Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Loan Status */}

                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Loan Status</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Verified">Verified</option>
                                <option value="Approve">Approve</option>
                                <option value="Active">Active</option>
                                <option value="Defaulter">Defaulter</option>
                                <option value="Settled">Settled</option>
                                <option value="Close">Close</option>
                            </select>
                        </div>

                        {/* Application Type */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Application Type</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={applicationMode}
                                onChange={(e) => setApplicationMode(e.target.value)}
                            >
                                <option value="All">All</option>
                                <option value="Maxborn">Maxborn</option>
                                <option value="Self">Self</option>
                            </select>
                        </div>

                        {/* Shopkeeper Wise */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Shopkeeper wise</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={shopkeeperFilter}
                                onChange={(e) => setShopkeeperFilter(e.target.value)}
                            >
                                <option value="All Shopkeeper">All Shopkeeper</option>
                                <option value="Individual">Individual</option>
                            </select>
                        </div>

                        {/* Search Box */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Search Bar</label>

                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="text"
                                    placeholder="Search Loan ID, Name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                    title="Search by Client Name, Loan ID, or Amount..."
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Loan ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Shop Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">App Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Applied Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Loan Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">EMI Start Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">EMI Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">EMI Paid</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Due EMI</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Last Due EMI Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Penalties</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Balance</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mode</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="16" className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-2">Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="16" className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-10 w-10 text-gray-300 mb-2" />
                                            <p>No records found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLoans.map((loan) => {
                                    const emiAmount = Number(loan.emiAmount || loan.emi || 0)
                                    const paidEmis = loan.emisPaid || 0
                                    const totalPaid = emiAmount * paidEmis
                                    const tenure = loan.tenure || (loan.emisPaid || 0) + (loan.emisRemaining || 0) || 12
                                    const totalAmount = emiAmount * tenure
                                    const balance = Math.max(0, totalAmount - totalPaid)
                                    const emiStartDate = loan.emiStartDate || loan.appliedDate || new Date().toISOString()

                                    const colors = {
                                        Pending: 'warning',
                                        Verified: 'info',
                                        Approved: 'success',
                                        Active: 'success',
                                        Rejected: 'destructive',
                                        Overdue: 'destructive',
                                        Paid: 'success'
                                    }

                                    return (
                                        <tr key={loan.id} className="hover:bg-blue-50/30 transition-colors duration-150">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-bold">
                                                {loan.loanId || `LN${String(loan.id).slice(-6)}`}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                {loan.shopName || loan.shopkeeperName || 'My Shop'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {loan.clientName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="capitalize font-medium text-sm text-gray-700">
                                                    {loan.applicationMode === 'max_born_group' ? 'Maxborn Group' : 'Self'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(loan.appliedDate || loan.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-800">
                                                ₹{Number(loan.loanAmount || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(emiStartDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                                ₹{emiAmount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 font-medium">
                                                ₹{totalPaid.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-medium">
                                                {loan.emisRemaining || 0}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                                                ₹{Number(loan.totalPenalty || 0).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                ₹{balance.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {loan.mode || 'Online'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge variant={colors[loan.status] || 'secondary'}>{loan.status}</Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="outline" title="View">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    )
}
