import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, FileText, CreditCard,
  Users, DollarSign, Bell, Home, Plus, User, Menu, X,
  Phone, Mail
} from 'lucide-react'
import Header from '../components/common/Header'
import Sidebar from '../components/common/Sidebar'

const sidebarItems = [
  { path: '/shopkeeper', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/shopkeeper/apply-loan', label: 'Apply Loan', icon: PlusCircle },
  { path: '/shopkeeper/loans', label: 'My Loans', icon: FileText },
  { path: '/shopkeeper/collect-payment', label: 'Collect Payment', icon: CreditCard },
  { path: '/shopkeeper/payment-records', label: 'Payment Records', icon: FileText },
  { path: '/shopkeeper/notifications', label: 'Notifications', icon: Bell },
  { path: '/shopkeeper/profile', label: 'My Profile', icon: User },
]

const bottomTabs = [
  { id: 'home', label: 'Home', icon: Home, path: '/shopkeeper' },
  { id: 'loans', label: 'Loans', icon: FileText, path: '/shopkeeper/loans' },
  { id: 'apply', label: 'Apply', icon: Plus, path: '/shopkeeper/apply-loan' },
  { id: 'payment', label: 'Payment', icon: DollarSign, path: '/shopkeeper/collect-payment' },
  { id: 'notifications', label: 'Alerts', icon: Bell, path: '/shopkeeper/notifications' },
]

export default function ShopkeeperLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      // Don't close sidebar here as it prevents it from opening on mobile
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const isActiveTab = (path) => {
    return location.pathname === path ||
      (path !== '/shopkeeper' && location.pathname.startsWith(path))
  }

  const SupportFooter = (
    <div className="bg-white/10 rounded-xl p-3 border border-white/10 mx-2 mb-2">
      <p className="text-xs font-semibold text-white/70 uppercase mb-2 px-1">Support Contact</p>
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-white/90">
          <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p>9999555584</p>
            <p>8882823566</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/90">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <p className="text-xs break-all">maxborngroup@gmail.com</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Always rendered but positioned differently based on screen size */}
      <Sidebar
        items={sidebarItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        footer={SupportFooter}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Header onMenuClick={() => {
          setSidebarOpen(prev => !prev) // Toggle the sidebar state
        }} />
        <main className={`flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 ${isMobile ? 'pb-20' : ''}`}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 border-t border-blue-500/20 shadow-2xl z-50">
            <div className="flex justify-around items-center h-16">
              {bottomTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${isActiveTab(tab.path)
                    ? 'text-white bg-white/10 font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
