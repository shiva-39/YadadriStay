import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Phone, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    else if (formData.fullName.trim().length < 2) newErrors.fullName = 'Name must be at least 2 characters'
    if (!formData.phone) newErrors.phone = 'Phone number is required'
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit Indian phone number'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) {
      if (!validateStep1()) return
      setStep(2)
    } else {
      if (!validateStep2()) return
      setLoading(true)
      try {
        await register({
          fullName: formData.fullName.trim(),
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
        })
        toast.success('Account created successfully!')
        navigate('/')
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed'
        setErrors({ form: message })
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }
  }

  const goBack = () => setStep(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl" role="img" aria-label="Temple">🕉️</span>
            <span className="text-3xl font-bold text-primary">Yadadri Stay</span>
          </Link>
          <div className="flex justify-center gap-2 mb-6">
            <div className={`w-16 h-1 rounded-full transition-colors ${step === 1 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className="w-2 h-1 bg-gray-200 mx-1" />
            <div className={`w-16 h-1 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{step === 1 ? 'Create Your Account' : 'Set Your Password'}</h1>
          <p className="text-gray-600 mt-1">
            {step === 1 ? 'Enter your details to get started' : 'Create a strong password for your account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Full Name"
                        className={`input-field pl-10 ${errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        autoComplete="name"
                      />
                      {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">+91</span>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                        placeholder="9876543210"
                        className="input-field pl-14"
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                      placeholder="email@example.com"
                      className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                      autoComplete="email"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>
                <button type="button" onClick={goBack} className="btn-secondary w-full">Back</button>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  Continue
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="input-field pl-10"
                      placeholder="Enter current password"
                    />
                  </div>
                  {errors.currentPassword && <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>}
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="input-field pl-10"
                      placeholder="Enter new password"
                    />
                  </div>
                  {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input-field pl-10"
                      placeholder="Confirm new password"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                </div>
                <button type="button" onClick={goBack} className="btn-secondary w-full">Back</button>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  Update Password
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

