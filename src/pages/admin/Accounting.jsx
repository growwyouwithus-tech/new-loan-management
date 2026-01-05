import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Plus, Download, Trash2, Edit2 } from 'lucide-react'

export default function Accounting() {
    const [entries, setEntries] = useState([
        {
            id: 1,
            month: 'April 2024',
            capitalInvestment: 1000000,
            grossProfit: 150000,
            rci: 800000,
            aci: 200000,
            rgp: 120000,
            agp: 30000,
            loss: 0,
            balance: 1150000
        }
    ])

    // Helper to format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounting</h1>
                    <p className="text-muted-foreground mt-1">Manage monthly financial records and profit/loss statements</p>
                </div>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Month Entry
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Financial Records</CardTitle>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
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
                                    <th className="px-4 py-3" title="Regular Capital Investment">R.C.I</th>
                                    <th className="px-4 py-3" title="Additional Capital Investment">A.C.I</th>
                                    <th className="px-4 py-3" title="Regular Gross Profit">R.G.P</th>
                                    <th className="px-4 py-3" title="Additional Gross Profit">A.G.P</th>
                                    <th className="px-4 py-3 text-red-600">Loss</th>
                                    <th className="px-4 py-3 font-bold">Balance</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-medium">{entry.month}</td>
                                        <td className="px-4 py-3">{formatCurrency(entry.capitalInvestment)}</td>
                                        <td className="px-4 py-3 text-green-600 font-semibold">{formatCurrency(entry.grossProfit)}</td>
                                        <td className="px-4 py-3">{formatCurrency(entry.rci)}</td>
                                        <td className="px-4 py-3">{formatCurrency(entry.aci)}</td>
                                        <td className="px-4 py-3">{formatCurrency(entry.rgp)}</td>
                                        <td className="px-4 py-3">{formatCurrency(entry.agp)}</td>
                                        <td className="px-4 py-3 text-red-600">{formatCurrency(entry.loss)}</td>
                                        <td className="px-4 py-3 font-bold">{formatCurrency(entry.balance)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button className="text-blue-500 hover:text-blue-700">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                        <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(entries.reduce((sum, e) => sum + e.capitalInvestment, 0))}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-green-600">Total Gross Profit</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(entries.reduce((sum, e) => sum + e.grossProfit, 0))}</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-red-600">Total Loss</p>
                        <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(entries.reduce((sum, e) => sum + e.loss, 0))}</p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-purple-600">Net Balance</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(entries[entries.length - 1]?.balance || 0)}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
