
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Search, Calendar, FileText, Download } from 'lucide-react'
import paymentService from '../../api/paymentService'
import { toast } from 'react-toastify'

export default function PaymentRecords() {
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [applicationMode, setApplicationMode] = useState('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Function to fetch payments
    const fetchPayments = async () => {
        setLoading(true)
        try {
            const params = {
                page,
                limit: 100, // Fetch more records to allow better client-side search if backend search is limited
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            }

            const data = await paymentService.getAllPayments(params)
            setPayments(data.payments || [])
            setTotalPages(data.totalPages || 1)
        } catch (error) {
            console.error('Error fetching payments:', error)
            toast.error('Failed to load payment records')
        } finally {
            setLoading(false)
        }
    }

    // Fetch on mount and when filters change
    useEffect(() => {
        fetchPayments()
    }, [page, startDate, endDate])

    // Filter payments based on search query (Client Name, Loan ID, or Amount)
    const filteredPayments = payments.filter(payment => {
        if (!searchQuery) return true

        const query = searchQuery.toLowerCase()

        // Check various fields
        const clientName = payment.loanId?.clientName || payment.loanId?.customerName || ''
        const loanId = payment.loanId?.loanId || payment.loanId?.id || ''
        const amount = String(payment.amount || '')
        const paymentId = payment.paymentId || ''

        // Check application mode
        const matchesMode = applicationMode === 'all' ||
            (applicationMode === 'max_born_group' ? payment.loanId?.applicationMode === 'max_born_group' :
                (payment.loanId?.applicationMode === 'self' || !payment.loanId?.applicationMode));

        return (
            (clientName.toLowerCase().includes(query) ||
                loanId.toLowerCase().includes(query) ||
                amount.includes(query) ||
                paymentId.toLowerCase().includes(query)) &&
            matchesMode
        )
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Date Filters */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Start Date</label>
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">End Date</label>
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

                        {/* Application Type Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Application Type</label>
                            <select
                                className="w-full h-10 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={applicationMode}
                                onChange={(e) => setApplicationMode(e.target.value)}
                            >
                                <option value="all">All Applications</option>
                                <option value="self">Self Loans</option>
                                <option value="max_born_group">Maxborn Group</option>
                            </select>
                        </div>

                        {/* Search Box */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="text"
                                    placeholder="Search by Client Name, Loan ID, or Amount..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">App Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Collected By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex justify-center items-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-2">Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-10 w-10 text-gray-300 mb-2" />
                                            <p>No payment records found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment._id || payment.paymentId} className="hover:bg-blue-50/30 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {payment.paymentDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                                            {payment.loanId?.loanId || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{payment.loanId?.clientName || payment.loanId?.customerName || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{payment.loanId?.clientPhone || payment.loanId?.customerPhone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                            ₹{payment.amount?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="capitalize font-medium text-sm text-gray-700">
                                                {payment.loanId?.applicationMode === 'max_born_group' ? 'Maxborn Group' : 'Self'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 uppercase">
                                                {payment.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.collectedBy?.fullName || 'Shopkeeper'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-center gap-2">
                        <Button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            variant="outline"
                            size="sm"
                        >
                            Previous
                        </Button>
                        <span className="flex items-center text-sm text-gray-600">Page {page} of {totalPages}</span>
                        <Button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            variant="outline"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
