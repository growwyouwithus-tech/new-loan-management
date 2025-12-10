import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { FileText, Download, CheckCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import loanStore from '../../store/loanStore'

export default function Reports() {
  const [completionReports, setCompletionReports] = useState([])
  const { getCompletionReports } = loanStore()

  useEffect(() => {
    setCompletionReports(getCompletionReports())
  }, [getCompletionReports])

  const reports = [
    { name: 'Portfolio Report', description: 'Complete loan portfolio analysis' },
    { name: 'Disbursement Report', description: 'Loan disbursement summary' },
    { name: 'Collection Report', description: 'Payment collection details' },
    { name: 'NPA Report', description: 'Non-performing assets analysis' },
    { name: 'Customer Report', description: 'Customer demographics and behavior' },
  ]

  const downloadCompletionReport = (report) => {
    const csvContent = `Loan ID,Client Name,Phone,Loan Amount,Interest Rate,Tenure,Applied Date,Approved Date,Completion Date,Total Paid,Total EMIs,Status
${report.loanId},${report.clientName},${report.clientPhone},${report.loanAmount},${report.interestRate}%,${report.tenure} months,${report.appliedDate},${report.approvedDate},${report.completionDate},₹${report.totalPaid},${report.totalEMIs},${report.status}`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loan-completion-${report.loanId}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Exports</h1>
        <p className="text-muted-foreground">Generate and download system reports</p>
      </div>

      {/* Loan Completion Reports */}
      {completionReports.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Loan Completion Reports
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {completionReports.map((report) => (
              <Card key={report.loanId} className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{report.loanId} - {report.clientName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Loan Amount: ₹{report.loanAmount?.toLocaleString()} | 
                        Completed: {report.completionDate} | 
                        Total Paid: ₹{report.totalPaid?.toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => downloadCompletionReport(report)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Standard Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {report.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <div className="flex gap-2">
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
