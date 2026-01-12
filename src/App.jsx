import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import LoginPage from './pages/auth/LoginPage'
import AdminLayout from './layouts/AdminLayout'
import ShopkeeperLayout from './layouts/ShopkeeperLayout'
import CollectionsLayout from './layouts/CollectionsLayout'
import VerifierLayout from './layouts/VerifierLayout'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ShopkeeperManagement from './pages/admin/ShopkeeperManagement'
import BorrowerManagement from './pages/admin/BorrowerManagement'
import LoanOrigination from './pages/admin/LoanOrigination'
import LoanDetails from './pages/admin/LoanDetails'
import KYCVerification from './pages/admin/KYCVerification'
import RepaymentManagement from './pages/admin/RepaymentManagement'
import PenaltiesManagement from './pages/admin/PenaltiesManagement'
import NotificationsManagement from './pages/admin/NotificationsManagement'
import Reports from './pages/admin/Reports'
import EMIManagement from './pages/admin/EMIManagement'
import Configuration from './pages/admin/Configuration'
import LoanVerifier from './pages/admin/LoanVerifier'
import VerifiedLoans from './pages/admin/VerifiedLoans'
import Accounting from './pages/admin/Accounting'
import LoanRecovery from './pages/admin/LoanRecovery'

// Shopkeeper Pages
import ShopkeeperDashboard from './pages/shopkeeper/Dashboard'
import ApplyLoan from './pages/shopkeeper/ApplyLoan'
import LoanTracking from './pages/shopkeeper/LoanTracking'
import CollectPayment from './pages/shopkeeper/CollectPayment'
import CustomerList from './pages/shopkeeper/CustomerList'
import ShopkeeperNotifications from './pages/shopkeeper/Notifications'

import PaymentRecords from './pages/shopkeeper/PaymentRecords'
import Profile from './pages/shopkeeper/Profile'

// Collections Pages
import CollectionsDashboard from './pages/collections/Dashboard'
import LoanCollection from './pages/collections/LoanCollection'

// Verifier Pages
import VerifierDashboard from './pages/verifier/Dashboard'
import VerifierNotifications from './pages/verifier/Notifications'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <LoginPage /> : <Navigate to={
            user?.role === 'shopkeeper' ? '/shopkeeper' :
              user?.role === 'collections' ? '/collections' :
                user?.role === 'verifier' ? '/verifier' :
                  '/admin'
          } />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'credit_manager', 'collections', 'support', 'verifier']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="shopkeepers" element={<ShopkeeperManagement />} />
          <Route path="borrowers" element={<BorrowerManagement />} />
          <Route path="loans" element={<LoanOrigination />} />
          <Route path="loans/:id" element={<LoanDetails />} />
          <Route path="kyc" element={<KYCVerification />} />
          <Route path="repayments" element={<RepaymentManagement />} />
          <Route path="penalties" element={<PenaltiesManagement />} />
          <Route path="notifications" element={<NotificationsManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="emi-management" element={<EMIManagement />} />
          <Route path="loan-verifier" element={<LoanVerifier />} />
          <Route path="verified-loans" element={<VerifiedLoans />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="recovery" element={<LoanRecovery />} />
          <Route path="configuration" element={<Configuration />} />
        </Route>

        {/* Shopkeeper Routes */}
        <Route
          path="/shopkeeper"
          element={
            <ProtectedRoute allowedRoles={['shopkeeper']}>
              <ShopkeeperLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ShopkeeperDashboard />} />
          <Route path="apply-loan" element={<ApplyLoan />} />
          <Route path="loans" element={<LoanTracking />} />
          <Route path="my-loans" element={<LoanTracking />} />
          <Route path="collect-payment" element={<CollectPayment />} />
          <Route path="customers" element={<CustomerList />} />
          <Route path="notifications" element={<ShopkeeperNotifications />} />

          <Route path="payment-records" element={<PaymentRecords />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Collections Routes */}
        <Route
          path="/collections"
          element={
            <ProtectedRoute allowedRoles={['collections', 'admin']}>
              <CollectionsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CollectionsDashboard />} />
          <Route path="loans" element={<LoanCollection />} />
        </Route>

        {/* Verifier Routes */}
        <Route
          path="/verifier"
          element={
            <ProtectedRoute allowedRoles={['verifier']}>
              <VerifierLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<VerifierDashboard />} />
          <Route path="loan-verifier" element={<LoanVerifier />} />
          <Route path="verified-loans" element={<VerifiedLoans />} />
          <Route path="notifications" element={<VerifierNotifications />} />
        </Route>

        {/* Make login page the default route */}
        <Route path="/" element={<LoginPage />} />

        {/* Redirect any unknown routes to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <PWAInstallPrompt />
    </>
  )
}

export default App
