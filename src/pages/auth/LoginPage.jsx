import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@loanmanagement.com',
      password: 'admin123',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Call real backend API with email
      const result = await login(data)

      if (result.success) {
        toast.success('Login successful!')

        // Navigate based on role
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center flex justify-center text-white">
              <div className="w-full h-24 flex items-center justify-center">
                <img src={icon} alt="MaxBorn Group" className="h-30 object-contain" />
              </div>
            </CardTitle>
            {/* <CardDescription className="text-center text-white/70">
              Enter your credentials to access your account
            </CardDescription> */}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Email or Shopkeeper ID</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/70" />
                  <Input
                    {...register('email')}
                    type="text"
                    placeholder="admin@lms.com or SK123456"
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40"
                    error={errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-300 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/70" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40"
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-white/70 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300 font-medium">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="success"
                className="w-full bg-green-500 hover:bg-green-600 border-none text-white font-semibold py-6 text-lg mt-4 shadow-lg hover:shadow-xl transition-all duration-300"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            {/* <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-green-600 dark:text-green-400">✅ Real Database Credentials (7 Users):</p>
              <div className="space-y-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                <p className="font-medium">Admin: admin@loanmanagement.com / admin123</p>
                <p>Verifier: verifier@loanmanagement.com / 123456</p>
                <p>Collections: collections@loanmanagement.com / 123456</p>
                <p>Supporter: supporter@loanmanagement.com / 123456</p>
                <p>Credit Manager: creditmanager@loanmanagement.com / 123456</p>
                <p>Shopkeeper 1: shopkeeper1@example.com / 123456</p>
                <p>Shopkeeper 2: shopkeeper2@example.com / 123456</p>
              </div>
              <p className="text-xs mt-2 text-green-600 dark:text-green-400">✓ Database: MongoDB Atlas (Connected)</p>
            </div> */}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
