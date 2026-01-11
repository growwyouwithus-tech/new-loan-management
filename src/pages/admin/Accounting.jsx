import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Download, Filter } from 'lucide-react'
import loanStore from '../../store/loanStore'
import { format } from 'date-fns'

export default function Accounting() {
    const { loans } = loanStore()
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState('all')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })

    // Calculate monthly accounting data from loans
    const monthlyData = useMemo(() => {
        const dataByMonth = {}

        loans.forEach(loan => {
            const loanDate = new Date(loan.appliedDate || loan.createdAt)
            const monthKey = format(loanDate, 'MMMM yyyy')
            const year = loanDate.getFullYear()
            const month = format(loanDate, 'MMMM')

            if (!dataByMonth[monthKey]) {
                dataByMonth[monthKey] = {
                    month: monthKey,
                    year: year,
                    monthName: month,
                    capitalInvestment: 0, // Total loan amounts disbursed
                    grossProfit: 0, // Total payments received
                    activeLoans: 0,
                    completedLoans: 0,
                    totalLoans: 0,
                    loss: 0, // Penalties or defaults
                }
            }

            // Add loan amount to capital investment
            dataByMonth[monthKey].capitalInvestment += loan.loanAmount || 0
            dataByMonth[monthKey].totalLoans += 1

            // Add payments to gross profit
            const totalPaid = (loan.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
            dataByMonth[monthKey].grossProfit += totalPaid

            // Count loan statuses
            if (loan.status === 'Active' || loan.status === 'Overdue') {
                dataByMonth[monthKey].activeLoans += 1
            } else if (loan.status === 'Paid') {
                dataByMonth[monthKey].completedLoans += 1
            }

            // Add penalties to loss
            dataByMonth[monthKey].loss += loan.totalPenalty || 0
        })

        // Convert to array and calculate balance
        return Object.values(dataByMonth).map(entry => ({
            ...entry,
            balance: entry.grossProfit - entry.loss
        })).sort((a, b) => new Date(b.month) - new Date(a.month))
    }, [loans])

    // Filter data by year/month OR date range
    const filteredData = useMemo(() => {
        let filtered = monthlyData

        // Helper to get first day of month from entry
        const getEntryDate = (entry) => {
            const months = {
                'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
            }
            return new Date(entry.year, months[entry.monthName], 1)
        }

        if (dateRange.start || dateRange.end) {
            // If date range is used, ignore year/month dropdowns
            if (dateRange.start) {
                const startDate = new Date(dateRange.start)
                // Set start date to 1st of month to capture full month data
                startDate.setDate(1)
                filtered = filtered.filter(entry => getEntryDate(entry) >= startDate)
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end)
                endDate.setDate(1) // Compare against month start
                filtered = filtered.filter(entry => getEntryDate(entry) <= endDate)
            }
        } else {
            // Use dropdown filters
            if (selectedYear !== 'all') {
                filtered = filtered.filter(entry => entry.year === parseInt(selectedYear))
            }

            if (selectedMonth !== 'all') {
                filtered = filtered.filter(entry => entry.monthName === selectedMonth)
            }
        }

        return filtered
    }, [monthlyData, selectedYear, selectedMonth, dateRange])

    // Get unique years from data
    const availableYears = useMemo(() => {
        const years = new Set(monthlyData.map(entry => entry.year))
        return Array.from(years).sort((a, b) => b - a)
    }, [monthlyData])

    // Helper to format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value)
    }

    // Export to CSV
    const handleExport = () => {
        const headers = ['Month', 'Capital Investment', 'Gross Profit', 'Loss', 'Balance', 'Total Loans', 'Active', 'Completed']
        const rows = filteredData.map(entry => [
            entry.month,
            entry.capitalInvestment,
            entry.grossProfit,
            entry.loss,
            entry.balance,
            entry.totalLoans,
            entry.activeLoans,
            entry.completedLoans
        ])

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `accounting-${selectedYear}-${selectedMonth}.csv`
        link.click()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounting</h1>
                    <p className="text-muted-foreground mt-1">Manage monthly financial records and profit/loss statements</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="md:w-48">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Years</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:w-48">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Months</option>
                                <option value="January">January</option>
                                <option value="February">February</option>
                                <option value="March">March</option>
                                <option value="April">April</option>
                                <option value="May">May</option>
                                <option value="June">June</option>
                                <option value="July">July</option>
                                <option value="August">August</option>
                                <option value="September">September</option>
                                <option value="October">October</option>
                                <option value="November">November</option>
                                <option value="December">December</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-2 border-l border-gray-200">
                            <span className="text-sm font-medium text-gray-500">OR Range:</span>
                            <div>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => {
                                        setDateRange(prev => ({ ...prev, start: e.target.value }))
                                        setSelectedYear('all') // Reset dropdowns when using range
                                        setSelectedMonth('all')
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Start"
                                />
                            </div>
                            <span className="text-gray-500">-</span>
                            <div>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => {
                                        setDateRange(prev => ({ ...prev, end: e.target.value }))
                                        setSelectedYear('all')
                                        setSelectedMonth('all')
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="End"
                                />
                            </div>
                        </div>

                        {(selectedYear !== 'all' || selectedMonth !== 'all' || dateRange.start || dateRange.end) && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedYear(new Date().getFullYear())
                                        setSelectedMonth('all')
                                        setDateRange({ start: '', end: '' })
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                    {(selectedYear !== 'all' || selectedMonth !== 'all' || dateRange.start || dateRange.end) && (
                        <p className="text-sm text-gray-600 mt-2">
                            Showing {filteredData.length} of {monthlyData.length} records
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Financial Records</CardTitle>
                        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExport}>
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 min-w-[120px]">Month</th>
                                    <th className="px-4 py-3">Capital Inv.</th>
                                    <th className="px-4 py-3">Gross Profit</th>
                                    <th className="px-4 py-3">Total Loans</th>
                                    <th className="px-4 py-3">Active</th>
                                    <th className="px-4 py-3">Completed</th>
                                    <th className="px-4 py-3 text-red-600">Loss</th>
                                    <th className="px-4 py-3 font-bold">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((entry, index) => (
                                        <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{entry.month}</td>
                                            <td className="px-4 py-3">{formatCurrency(entry.capitalInvestment)}</td>
                                            <td className="px-4 py-3 text-green-600 font-semibold">{formatCurrency(entry.grossProfit)}</td>
                                            <td className="px-4 py-3">{entry.totalLoans}</td>
                                            <td className="px-4 py-3">{entry.activeLoans}</td>
                                            <td className="px-4 py-3">{entry.completedLoans}</td>
                                            <td className="px-4 py-3 text-red-600">{formatCurrency(entry.loss)}</td>
                                            <td className="px-4 py-3 font-bold">{formatCurrency(entry.balance)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                            No accounting data found for selected filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-blue-600">Total Capital Investment</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(filteredData.reduce((sum, e) => sum + e.capitalInvestment, 0))}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-green-600">Total Gross Profit</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(filteredData.reduce((sum, e) => sum + e.grossProfit, 0))}</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-red-600">Total Loss</p>
                        <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(filteredData.reduce((sum, e) => sum + e.loss, 0))}</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-purple-600">Net Balance</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(filteredData.reduce((sum, e) => sum + e.balance, 0))}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
