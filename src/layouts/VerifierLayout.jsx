import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, FileText, CheckCircle, Menu, X, LogOut
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import notificationStore from '../store/notificationStore'
import Header from '../components/common/Header'
import Sidebar from '../components/common/Sidebar'

const sidebarItems = [
  { path: '/verifier', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/verifier/loan-verifier', label: 'Loan Verifier', icon: FileText },
]

export default function VerifierLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const { notifications, getUnreadCount, markAsRead, getRecentNotifications } = notificationStore()

  const unreadCount = getUnreadCount()
  const recentNotifications = getRecentNotifications(5)

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        items={sidebarItems} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header 
          onMenuClick={() => setSidebarOpen(prev => !prev)}
          title="Loan Verifier Panel"
        />
        <main className={`flex-1 overflow-y-auto bg-background p-4 md:p-6`}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
            <div className="flex justify-around items-center h-16">
              <button
                onClick={() => navigate('/verifier')}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  location.pathname === '/verifier' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-xs mt-1">Dashboard</span>
              </button>
              <button
                onClick={() => navigate('/verifier/loan-verifier')}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  location.pathname === '/verifier/loan-verifier' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs mt-1">Verify</span>
              </button>
              <button
                onClick={() => navigate('/verifier/verified-loans')}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  location.pathname === '/verifier/verified-loans' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <CheckCircle className="h-5 w-5" />
                <span className="text-xs mt-1">Verified</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center w-full h-full text-red-500 dark:text-red-400"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-xs mt-1">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
