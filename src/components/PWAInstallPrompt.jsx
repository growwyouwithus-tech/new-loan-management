import { useState } from 'react'
import { usePWAInstall } from '../hooks/usePWAInstall'
import { X, Download, Smartphone } from 'lucide-react'

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)

  if (!isInstallable || isInstalled || dismissed) {
    return null
  }

  const handleInstall = () => {
    install()
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-4 z-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Install App</h3>
            <p className="text-sm text-gray-600">Install our app for a better experience</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex space-x-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
        >
          <Download className="h-4 w-4" />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  )
}

export default PWAInstallPrompt
