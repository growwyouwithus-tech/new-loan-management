import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Store, UserCheck, FileText, Shield, 
  CreditCard, AlertCircle, Bell, FileBarChart, 
  Activity, DollarSign, Settings 
} from 'lucide-react'
import Header from '../components/common/Header'
import Sidebar from '../components/common/Sidebar'

const sidebarItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/shopkeepers', label: 'Shopkeepers', icon: Store },
  { path: '/admin/borrowers', label: 'Borrowers', icon: UserCheck },
  { path: '/admin/loans', label: 'Loans', icon: FileText },
  { path: '/admin/verified-loans', label: 'Verified Loans', icon: UserCheck },
  { path: '/admin/repayments', label: 'Repayments', icon: CreditCard },
  { path: '/admin/penalties', label: 'Penalties', icon: AlertCircle },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { path: '/admin/emi-management', label: 'EMI Management', icon: DollarSign },
  { path: '/admin/configuration', label: 'Configuration', icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
