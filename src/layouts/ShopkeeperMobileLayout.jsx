import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  CreditCard, 
  User, 
  Users,
  Menu,
  X,
  Bell,
  LogOut,
  FileText,
  DollarSign,
  PlusCircle
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'

const ShopkeeperMobileLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [showMenu, setShowMenu] = useState(false)

  const bottomTabs = [
    { id: 'home', label: 'Home', icon: Home, path: '/shopkeeper' },
    { id: 'loans', label: 'Loans', icon: CreditCard, path: '/shopkeeper/loans' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/shopkeeper/customers' },
    { id: 'payment', label: 'Payment', icon: DollarSign, path: '/shopkeeper/collect-payment' },
  ]

  const menuItems = [
    { label: 'Dashboard', icon: Home, path: '/shopkeeper' },
    { label: 'Apply Loan', icon: PlusCircle, path: '/shopkeeper/apply-loan' },
    { label: 'My Loans', icon: FileText, path: '/shopkeeper/loans' },
    { label: 'Collect Payment', icon: DollarSign, path: '/shopkeeper/collect-payment' },
    { label: 'Customers', icon: Users, path: '/shopkeeper/customers' },
    { label: 'Notifications', icon: Bell, path: '/shopkeeper/notifications' },
  ]

  const handleTabClick = (path) => {
    navigate(path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActiveTab = (path) => {
    if (path === '/shopkeeper') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const isDark = theme === 'dark'

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Top Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-40 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-b shadow-sm`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-lg ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {showMenu ? (
                <X className={isDark ? 'text-white' : 'text-gray-900'} size={24} />
              ) : (
                <Menu className={isDark ? 'text-white' : 'text-gray-900'} size={24} />
              )}
            </button>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Loan Manager
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.name || 'Shopkeeper'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/shopkeeper/notifications')}
              className={`p-2 rounded-lg relative ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <Bell className={isDark ? 'text-white' : 'text-gray-900'} size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDark ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
              }`}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Slide-out Menu */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: showMenu ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed top-[57px] left-0 bottom-[64px] w-64 z-50 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-xl overflow-y-auto`}
      >
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveTab(item.path)
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setShowMenu(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDark
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isDark
                ? 'text-red-400 hover:bg-gray-700'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </motion.div>

      {/* Overlay */}
      {showMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowMenu(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 top-[57px] bottom-[64px]"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - DAMAKEDAR DESIGN */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={`fixed bottom-0 left-0 right-0 z-30 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-t shadow-2xl backdrop-blur-lg`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-1 py-3">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = isActiveTab(tab.path)
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className="flex flex-col items-center justify-center flex-1 relative"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.05 }}
                  className={`p-3 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/50'
                        : 'bg-gradient-to-br from-blue-500 to-blue-400 shadow-lg shadow-blue-500/50'
                      : isDark
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={
                      isActive
                        ? 'text-white'
                        : isDark
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }
                  />
                </motion.div>
                <span
                  className={`text-[11px] mt-1.5 font-semibold transition-all duration-300 ${
                    isActive
                      ? isDark
                        ? 'text-blue-400'
                        : 'text-blue-600'
                      : isDark
                      ? 'text-gray-500'
                      : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute -top-1 w-1 h-1 rounded-full ${
                      isDark ? 'bg-blue-400' : 'bg-blue-600'
                    }`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}

export default ShopkeeperMobileLayout
