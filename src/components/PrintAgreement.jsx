import { useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Printer } from 'lucide-react'
import Button from './ui/Button'

export default function PrintAgreement({ loan, onClose }) {
  const printRef = useRef()

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800')
    printWindow.document.write(printRef.current.innerHTML)
    printWindow.document.close()
    printWindow.print()
  }

  if (!loan) return null

  const companyName = "Max Born Group"
  const clientName = loan.clientName || 'N/A'
  const loanAmount = loan.loanAmount || 0
  const emiAmount = loan.emiAmount || 0
  const tenure = loan.tenure || 12
  const loanId = loan.loanId || loan.id

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Loan Agreement</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Content */}
        <div ref={printRef} className="p-6 md:p-8 space-y-6 bg-white">
          {/* Company Header */}
          <div className="text-center border-b-2 border-gray-300 pb-4">
            <h1 className="text-3xl font-bold text-green-600">{companyName}</h1>
            <p className="text-gray-600 text-sm mt-1">Mobile Loan Agreement</p>
          </div>

          {/* Loan Details */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Loan ID</p>
              <p className="text-lg font-bold text-gray-900">{loanId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Client Name</p>
              <p className="text-lg font-bold text-gray-900">{clientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Loan Amount</p>
              <p className="text-lg font-bold text-green-600">₹{loanAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">EMI Amount</p>
              <p className="text-lg font-bold text-blue-600">₹{emiAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Tenure</p>
              <p className="text-lg font-bold text-gray-900">{tenure} Months</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-semibold">Date</p>
              <p className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-300 pb-2">
              Terms & Conditions
            </h3>

            {/* T&C Item 1 */}
            <div className="border-l-4 border-red-500 pl-4 py-3 bg-red-50 rounded">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    मोबाइल खोने या चोरी होने पर कंपनी की कोई गारंटी नहीं होगी
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    (In case of mobile loss or theft, the company will not be responsible)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-2">Sign</p>
                  <div className="w-24 h-12 border-2 border-gray-300 rounded"></div>
                </div>
              </div>
            </div>

            {/* T&C Item 2 */}
            <div className="border-l-4 border-orange-500 pl-4 py-3 bg-orange-50 rounded">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    मोबाइल किस्त लेट होने पर पेनल्टी चार्ज होगी
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    (Late payment charges will be applicable for overdue EMI)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-2">Sign</p>
                  <div className="w-24 h-12 border-2 border-gray-300 rounded"></div>
                </div>
              </div>
            </div>

            {/* T&C Item 3 */}
            <div className="border-l-4 border-yellow-500 pl-4 py-3 bg-yellow-50 rounded">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    मोबाइल खराब होने पर यूजर को सर्विस सेल्फ सेंटर जाना होगा
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    (For device damage, customer must visit authorized service center)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-2">Sign</p>
                  <div className="w-24 h-12 border-2 border-gray-300 rounded"></div>
                </div>
              </div>
            </div>

            {/* T&C Item 4 */}
            <div className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    ECS Late Charges - ₹499
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    (Late charges applicable for ECS/Auto-debit failures)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 mb-2">Sign</p>
                  <div className="w-24 h-12 border-2 border-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-gray-300">
            <div className="text-center">
              <div className="h-16 mb-2"></div>
              <p className="text-xs font-semibold text-gray-900">Client Signature</p>
              <p className="text-xs text-gray-600">{clientName}</p>
            </div>
            <div className="text-center">
              <div className="h-16 mb-2"></div>
              <p className="text-xs font-semibold text-gray-900">Company Representative</p>
              <p className="text-xs text-gray-600">{companyName}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-600">
              This is a legally binding agreement. Please read all terms carefully before signing.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Generated on {new Date().toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="!text-gray-700"
          >
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="!bg-green-600 !hover:bg-green-700 !text-white flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Agreement
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
