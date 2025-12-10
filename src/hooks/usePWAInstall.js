import { useState, useEffect } from 'react'

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available')
      return
    }

    try {
      const result = await deferredPrompt.prompt()
      console.log(`Install result: ${result.outcome}`)
      
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null)
        setIsInstallable(false)
      }
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  return {
    isInstallable,
    isInstalled,
    install,
  }
}
