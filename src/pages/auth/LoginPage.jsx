import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@lms.com',
      password: 'admin123',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Mock login - replace with actual API call
      let userRole = 'admin'
      let userName = 'Admin User'
      
      if (data.email.includes('shopkeeper')) {
        userRole = 'shopkeeper'
        userName = 'Shopkeeper User'
      } else if (data.email.includes('verifier')) {
        userRole = 'verifier'
        userName = 'Loan Verifier'
      } else if (data.email.includes('collections')) {
        userRole = 'collections'
        userName = 'Collections Officer'
      }
      
      const mockResponse = {
        success: true,
        user: {
          id: 1,
          name: userName,
          email: data.email,
          role: userRole,
        },
      }

      if (mockResponse.success) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))
        
        // Set auth state
        useAuthStore.setState({
          user: mockResponse.user,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true,
        })

        toast.success('Login successful!')
        
        // Navigate based on role
        if (mockResponse.user.role === 'shopkeeper') {
          navigate('/shopkeeper')
        } else if (mockResponse.user.role === 'verifier') {
          navigate('/verifier')
        } else if (mockResponse.user.role === 'collections') {
          navigate('/collections')
        } else {
          navigate('/admin')
        }
      } else {
        toast.error('Invalid credentials')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
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
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">
              Loan Management System
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="admin@lms.com"
                    className="pl-10"
                    error={errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    error={errors.password}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                variant="success"
                className="w-full"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold">Demo Credentials:</p>
              <p>Admin: admin@lms.com / admin123</p>
              <p>Shopkeeper: shopkeeper@lms.com / shop123</p>
              <p>Loan Verifier: verifier@lms.com / verify123</p>
              <p>Collections: collections@lms.com / collect123</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
