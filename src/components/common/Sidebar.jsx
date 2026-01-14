import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'
import icon from '/logo2.png'

export default function Sidebar({ items, isOpen, onClose, footer }) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    onClose()
    navigate('/login')
  }
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 border-r border-blue-500/20 w-64 flex-shrink-0 shadow-2xl">
        <div className="flex items-center justify-center border-b border-white/10">
          <div className="flex items-center justify-center w-full px-2">
            <img src={icon} alt="MaxBorn" className="w-36 object-contain" />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-white text-blue-600 shadow-lg font-semibold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}

          {footer && (
            <div className="mt-auto pt-4 pb-2">
              {footer}
            </div>
          )}

          {/* Logout Button - Mobile and Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: items.length * 0.05 }}
            className="mt-2 pt-2 border-t border-white/10 lg:block"
          >
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </motion.div>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-[60] w-64 bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-700 border-r border-blue-500/20 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 pr-4">
          <div className="flex items-center justify-center flex-1">
            <img src={icon} alt="MaxBorn" className="w-40 object-contain" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-white text-blue-600 shadow-lg font-semibold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {footer && (
            <div className="mb-4">
              {footer}
            </div>
          )}

          {/* Logout Button - Mobile and Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: items.length * 0.05 }}
          >
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </motion.div>
        </div>
      </aside>
    </>
  )
}
