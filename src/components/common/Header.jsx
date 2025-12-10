import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, User, LogOut, Sun, Moon, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import notificationStore from '../../store/notificationStore'
import Button from '../ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { getUnreadCount, getRecentNotifications, markAsRead, clearAll, getPanelsWithNotifications } = notificationStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)
  const userMenuRef = useRef(null)

  const unreadCount = getUnreadCount()
  const recentNotifications = getRecentNotifications(5)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const showClearNotificationMessage = () => {
    const panelsBefore = getPanelsWithNotifications()
    const totalCleared = Object.values(panelsBefore).reduce((sum, count) => sum + count, 0)
    
    // Create toast message
    const message = document.createElement('div')
    message.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-pulse'
    message.innerHTML = `
      <div class="font-semibold">Notifications Cleared!</div>
      <div class="text-sm mt-1">
        ${totalCleared} notifications cleared from current panel
      </div>
    `
    
    document.body.appendChild(message)
    
    // Remove message after 3 seconds
    setTimeout(() => {
      message.remove()
    }, 3000)
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id)
    if (notification.type === 'new_loan_application') {
      navigate('/verifier/loan-verifier')
    }
    setShowNotifications(false)
  }

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications, showUserMenu])

  return (
    <header className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-b border-blue-100 px-4 md:px-6 py-3 md:py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-blue-100"
          >
            <Menu className="h-5 w-5 text-blue-600" />
          </Button>
          <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">Loan Management System</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-card border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 border-b">
                    <h3 className="font-medium">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b cursor-pointer hover:bg-accent transition-colors ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                  {recentNotifications.length > 0 && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          showClearNotificationMessage()
                          clearAll()
                          setShowNotifications(false)
                        }}
                      >
                        Clear All Notifications
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLogout()
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
