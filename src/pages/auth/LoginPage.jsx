import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, User, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import icon from '/logo.png'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    if (!agreedToTerms) {
      toast.error('Please accept the Terms and Conditions to continue')
      return
    }

    setLoading(true)
    try {
      const result = await login(data)

      if (result.success) {
        toast.success('Login successful!')

        const userRole = result.user.role
        if (userRole === 'shopkeeper') {
          navigate('/shopkeeper')
        } else if (userRole === 'verifier') {
          navigate('/verifier')
        } else if (userRole === 'collections') {
          navigate('/collections')
        } else {
          navigate('/admin')
        }
      } else {
        toast.error(result.error || 'Invalid credentials')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="space-y-1 pb-2">
            {/* Logo Display */}
            <div className="flex flex-col items-center justify-center mb-6">
              <img src={icon} alt="MaxBorn Group" className="h-40 w-auto object-contain" />
            </div>

            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email ID Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  <span className="text-red-500">*</span> Email ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="off"
                    className="pl-10 bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1a365d] focus:border-[#1a365d] rounded-full py-3"
                    error={errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  <span className="text-red-500">*</span> Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    className="pl-10 pr-10 bg-white border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#1a365d] focus:border-[#1a365d] rounded-full py-3"
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#1a365d] border-gray-300 rounded focus:ring-[#1a365d] cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                  I have read and agree all{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-[#1a365d] underline font-medium hover:text-[#2d4a7c] transition-colors"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>

              <Button
                type="submit"
                variant="success"
                disabled={!agreedToTerms}
                className={`w-full border-none text-white font-semibold py-6 text-lg mt-4 shadow-lg transition-all duration-300 rounded-full ${agreedToTerms
                  ? 'bg-[#1a365d] hover:bg-[#2d4a7c] hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
                  }`}
                loading={loading}
              >
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Terms and Conditions</h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh] text-gray-700 text-sm leading-relaxed space-y-4">
                <p className="text-gray-500 text-xs">Last Updated: January 2026</p>

                <h3 className="font-semibold text-gray-900 text-base">1. Acceptance of Terms</h3>
                <p>By accessing and using this Loan Management System ("Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service.</p>

                <h3 className="font-semibold text-gray-900 text-base">2. User Account & Security</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account or any other breach of security. We reserve the right to suspend or terminate accounts that violate these terms.</p>

                <h3 className="font-semibold text-gray-900 text-base">3. Authorized Use</h3>
                <p>The Service is provided exclusively for legitimate business purposes related to loan management operations. You agree not to use the Service for any unlawful purpose or in any way that could damage, disable, or impair the Service.</p>

                <h3 className="font-semibold text-gray-900 text-base">4. Data Privacy & Protection</h3>
                <p>We are committed to protecting your privacy and handling your personal information with care. All data collected through the Service is processed in accordance with applicable data protection laws and our Privacy Policy. You consent to the collection, use, and processing of your information as described therein.</p>

                <h3 className="font-semibold text-gray-900 text-base">5. Confidentiality</h3>
                <p>All information accessed through the Service, including but not limited to customer data, loan details, and financial records, is strictly confidential. You agree not to disclose, share, or use such information for any purpose other than the authorized business operations.</p>

                <h3 className="font-semibold text-gray-900 text-base">6. Compliance with Laws</h3>
                <p>You agree to comply with all applicable laws, regulations, and guidelines, including but not limited to those related to financial services, data protection, and anti-money laundering. Any violation may result in immediate termination of access and potential legal action.</p>

                <h3 className="font-semibold text-gray-900 text-base">7. Intellectual Property</h3>
                <p>All content, features, and functionality of the Service, including software, text, graphics, logos, and trademarks, are the exclusive property of MaxBorn Group and are protected by intellectual property laws.</p>

                <h3 className="font-semibold text-gray-900 text-base">8. Limitation of Liability</h3>
                <p>To the maximum extent permitted by law, MaxBorn Group shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.</p>

                <h3 className="font-semibold text-gray-900 text-base">9. Modifications to Terms</h3>
                <p>We reserve the right to modify these Terms and Conditions at any time. Continued use of the Service after any such changes constitutes your acceptance of the new terms.</p>

                <h3 className="font-semibold text-gray-900 text-base">10. Contact Information</h3>
                <p>For any questions or concerns regarding these Terms and Conditions, please contact our support team through the official channels provided in the application.</p>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setAgreedToTerms(true)
                    setShowTermsModal(false)
                  }}
                  className="px-6 py-2 bg-[#1a365d] text-white rounded-lg hover:bg-[#2d4a7c] transition-colors font-medium"
                >
                  I Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
